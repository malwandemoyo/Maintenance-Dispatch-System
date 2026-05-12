from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from users.models import UserProfile, UserActivity
from core.models import UserRole


class UserProfileTestCase(TestCase):
    """Test UserProfile model creation and functionality."""
    
    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_profile_created_on_user_creation(self):
        """Test that profile can be created for user."""
        profile = UserProfile.objects.create(user=self.user)
        self.assertEqual(profile.user, self.user)
        self.assertTrue(profile.notifications_enabled)
        self.assertTrue(profile.email_on_task_assigned)
    
    def test_profile_phone_validation(self):
        """Test phone number validation."""
        profile = UserProfile.objects.create(
            user=self.user,
            phone='+1234567890'
        )
        self.assertEqual(profile.phone, '+1234567890')


class UserActivityTestCase(TestCase):
    """Test UserActivity tracking."""
    
    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_activity_creation(self):
        """Test activity log creation."""
        activity = UserActivity.objects.create(
            user=self.user,
            activity_type='login',
            ip_address='127.0.0.1'
        )
        self.assertEqual(activity.user, self.user)
        self.assertEqual(activity.activity_type, 'login')
        self.assertEqual(activity.ip_address, '127.0.0.1')
    
    def test_activity_ordering(self):
        """Test activities are ordered by most recent first."""
        activity1 = UserActivity.objects.create(
            user=self.user,
            activity_type='login'
        )
        activity2 = UserActivity.objects.create(
            user=self.user,
            activity_type='logout'
        )
        activities = UserActivity.objects.all()
        self.assertEqual(activities.first(), activity2)
        self.assertEqual(activities.last(), activity1)


class UserRegistrationTestCase(APITestCase):
    """Test user registration via API."""
    
    def setUp(self):
        """Initialize API client."""
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
    
    def test_user_registration_via_serializer(self):
        """Test user registration using serializer."""
        from users.serializers import RegisterSerializer
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_registration_password_mismatch(self):
        """Test registration fails with mismatched passwords."""
        from users.serializers import RegisterSerializer
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass123!'
        }
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class UserAuthenticationTestCase(APITestCase):
    """Test user authentication."""
    
    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_user_authentication_with_correct_password(self):
        """Test user can authenticate with correct password."""
        from django.contrib.auth import authenticate
        user = authenticate(username='testuser', password='testpass123')
        self.assertIsNotNone(user)
        self.assertEqual(user.username, 'testuser')
    
    def test_user_authentication_with_wrong_password(self):
        """Test user cannot authenticate with wrong password."""
        from django.contrib.auth import authenticate
        user = authenticate(username='testuser', password='wrongpass')
        self.assertIsNone(user)


class ChangePasswordTestCase(APITestCase):
    """Test password change functionality."""
    
    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpass123'
        )
    
    def test_password_can_be_changed_with_correct_old_password(self):
        """Test password can be changed with correct old password."""
        self.user.set_password('newpass123')
        self.user.save()
        
        from django.contrib.auth import authenticate
        user = authenticate(username='testuser', password='newpass123')
        self.assertIsNotNone(user)
    
    def test_old_password_doesnt_work_after_change(self):
        """Test old password doesn't work after password change."""
        self.user.set_password('newpass123')
        self.user.save()
        
        from django.contrib.auth import authenticate
        user = authenticate(username='testuser', password='oldpass123')
        self.assertIsNone(user)


class AuthEndpointTestCase(APITestCase):
    """Test authentication API endpoints."""
    
    def setUp(self):
        """Initialize API client and create test user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        UserRole.objects.create(user=self.user, role='resident')
    
    def test_login_endpoint_with_valid_credentials(self):
        """Test login endpoint with valid credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'testuser')
    
    def test_login_endpoint_with_invalid_credentials(self):
        """Test login endpoint with invalid credentials."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_login_endpoint_missing_username(self):
        """Test login endpoint with missing username."""
        response = self.client.post('/api/auth/login/', {
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_endpoint_missing_password(self):
        """Test login endpoint with missing password."""
        response = self.client.post('/api/auth/login/', {
            'username': 'testuser'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_me_endpoint_authenticated(self):
        """Test /me endpoint returns current user when authenticated."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_me_endpoint_unauthenticated(self):
        """Test /me endpoint returns 401 when not authenticated."""
        response = self.client.get('/api/auth/me/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_logout_endpoint(self):
        """Test logout endpoint."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('detail', response.data)
    
    def test_logout_endpoint_unauthenticated(self):
        """Test logout endpoint when not authenticated."""
        response = self.client.post('/api/auth/logout/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_register_endpoint_valid_data(self):
        """Test registration endpoint with valid data."""
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='newuser').exists())
    
    def test_register_endpoint_duplicate_username(self):
        """Test registration endpoint rejects duplicate username."""
        response = self.client.post('/api/auth/register/', {
            'username': 'testuser',
            'email': 'another@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_endpoint_duplicate_email(self):
        """Test registration endpoint rejects duplicate email."""
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_register_endpoint_password_mismatch(self):
        """Test registration endpoint rejects mismatched passwords."""
        response = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'SecurePass123!',
            'password2': 'DifferentPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_change_password_endpoint_authenticated(self):
        """Test change password endpoint for authenticated user."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/change_password/', {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass123!',
            'new_password2': 'NewSecurePass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify new password works
        from django.contrib.auth import authenticate
        user = authenticate(username='testuser', password='NewSecurePass123!')
        self.assertIsNotNone(user)
    
    def test_change_password_endpoint_wrong_old_password(self):
        """Test change password endpoint with wrong old password."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/change_password/', {
            'old_password': 'wrongpass',
            'new_password': 'NewSecurePass123!',
            'new_password2': 'NewSecurePass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_change_password_endpoint_new_password_mismatch(self):
        """Test change password endpoint with mismatched new passwords."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/auth/change_password/', {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass123!',
            'new_password2': 'DifferentPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_change_password_endpoint_unauthenticated(self):
        """Test change password endpoint when not authenticated."""
        response = self.client.post('/api/auth/change_password/', {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass123!',
            'new_password2': 'NewSecurePass123!'
        })
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_profile_update_endpoint_authenticated(self):
        """Test profile update endpoint for authenticated user."""
        self.client.force_authenticate(user=self.user)
        response = self.client.put('/api/auth/profile_update/', {
            'first_name': 'Updated',
            'last_name': 'User'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify update
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'User')
    
    def test_profile_update_endpoint_unauthenticated(self):
        """Test profile update endpoint when not authenticated."""
        response = self.client.put('/api/auth/profile_update/', {
            'first_name': 'Updated'
        })
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])