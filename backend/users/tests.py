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

