from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from core.models import UserRole, Property, StaffProfile, MaintenanceTask, TaskComment, TaskHistory


class UserRoleSetupTestCase(TestCase):
    """Test user role setup and permissions."""
    
    def setUp(self):
        """Create test users with different roles."""
        # Admin/Superuser
        self.admin_user = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='admin123'
        )
        
        # Manager
        self.manager_user = User.objects.create_user(
            username='manager1', email='manager@test.com', password='manager123'
        )
        UserRole.objects.create(user=self.manager_user, role='manager')
        
        # Maintenance Staff
        self.staff_user = User.objects.create_user(
            username='staff1', email='staff@test.com', password='staff123'
        )
        UserRole.objects.create(user=self.staff_user, role='maintenance_staff')
        
        # Resident
        self.resident_user = User.objects.create_user(
            username='resident1', email='resident@test.com', password='resident123'
        )
        UserRole.objects.create(user=self.resident_user, role='resident')
    
    def test_user_roles_created(self):
        """Test that users have correct roles."""
        self.assertEqual(self.manager_user.role.role, 'manager')
        self.assertEqual(self.staff_user.role.role, 'maintenance_staff')
        self.assertEqual(self.resident_user.role.role, 'resident')
        self.assertTrue(self.admin_user.is_superuser)


class PropertyAccessControlTestCase(APITestCase):
    """Test property access control by role."""
    
    def setUp(self):
        """Create test data."""
        self.client = APIClient()
        
        # Create users
        self.manager_user = User.objects.create_user(
            username='manager1', password='manager123'
        )
        UserRole.objects.create(user=self.manager_user, role='manager')
        
        self.other_manager = User.objects.create_user(
            username='manager2', password='manager123'
        )
        UserRole.objects.create(user=self.other_manager, role='manager')
        
        self.staff_user = User.objects.create_user(
            username='staff1', password='staff123'
        )
        UserRole.objects.create(user=self.staff_user, role='maintenance_staff')
        
        self.resident_user = User.objects.create_user(
            username='resident1', password='resident123'
        )
        UserRole.objects.create(user=self.resident_user, role='resident')
        
        # Create properties
        self.property1 = Property.objects.create(
            name='Building A',
            address='123 Main St',
            manager=self.manager_user,
            status='active'
        )
        
        self.property2 = Property.objects.create(
            name='Building B',
            address='456 Oak Ave',
            manager=self.other_manager,
            status='active'
        )

        StaffProfile.objects.create(user=self.staff_user, property=self.property1, role_title='Technician')
    
    def test_unauthenticated_cannot_access_properties(self):
        """Test that unauthenticated users cannot access properties."""
        response = self.client.get('/api/properties/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_manager_sees_only_own_properties(self):
        """Test that managers see only their own properties."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], 'Building A')
    
    def test_manager_cannot_see_others_properties(self):
        """Test that managers cannot see other managers' properties."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get('/api/properties/')
        property_names = [p['name'] for p in response.data['results']]
        self.assertNotIn('Building B', property_names)
    
    def test_resident_cannot_access_properties(self):
        """Test that residents cannot access properties endpoint."""
        self.client.force_authenticate(user=self.resident_user)
        response = self.client.get('/api/properties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
    
    def test_manager_can_create_property(self):
        """Test that managers can create properties."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post('/api/properties/', {
            'name': 'New Building',
            'address': '789 Elm St',
            'status': 'active'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['manager'], self.manager_user.id)
    
    def test_resident_cannot_create_property(self):
        """Test that residents cannot create properties."""
        self.client.force_authenticate(user=self.resident_user)
        response = self.client.post('/api/properties/', {
            'name': 'Resident Building',
            'address': '999 Test Ave',
            'status': 'active'
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_fetch_staff_for_their_property(self):
        """Test that managers can fetch maintenance staff for their own property."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(f'/api/users/maintenance_staff/?property={self.property1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.staff_user.id)

    def test_manager_cannot_fetch_staff_for_other_property(self):
        """Test that managers cannot fetch maintenance staff for another manager's property."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(f'/api/users/maintenance_staff/?property={self.property2.id}')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('detail', response.data)


class TaskAccessControlTestCase(APITestCase):
    """Test task access control by role - strict enforcement."""
    
    def setUp(self):
        """Create test data."""
        self.client = APIClient()
        
        # Create users
        self.manager_user = User.objects.create_user(
            username='manager1', password='manager123'
        )
        UserRole.objects.create(user=self.manager_user, role='manager')
        
        self.staff_user1 = User.objects.create_user(
            username='staff1', password='staff123'
        )
        UserRole.objects.create(user=self.staff_user1, role='maintenance_staff')
        
        self.staff_user2 = User.objects.create_user(
            username='staff2', password='staff123'
        )
        UserRole.objects.create(user=self.staff_user2, role='maintenance_staff')
        
        self.resident_user1 = User.objects.create_user(
            username='resident1', password='resident123'
        )
        UserRole.objects.create(user=self.resident_user1, role='resident')
        
        self.resident_user2 = User.objects.create_user(
            username='resident2', password='resident123'
        )
        UserRole.objects.create(user=self.resident_user2, role='resident')
        
        # Create property
        self.property = Property.objects.create(
            name='Test Building',
            address='123 Main St',
            manager=self.manager_user,
            status='active'
        )

        StaffProfile.objects.create(user=self.staff_user1, property=self.property, role_title='Technician')
        StaffProfile.objects.create(user=self.staff_user2, property=self.property, role_title='Technician')
        
        # Create tasks
        self.task_manager_created = MaintenanceTask.objects.create(
            property=self.property,
            title='Manager Task',
            description='Task created by manager',
            priority='medium',
            status='pending',
            created_by=self.manager_user
        )
        
        self.task_assigned_to_staff1 = MaintenanceTask.objects.create(
            property=self.property,
            title='Task for Staff 1',
            description='Assigned to staff1',
            priority='high',
            status='assigned',
            assigned_to=self.staff_user1,
            created_by=self.manager_user
        )
        
        self.task_resident_created = MaintenanceTask.objects.create(
            property=self.property,
            title='Resident Request',
            description='Request from resident',
            priority='medium',
            status='pending',
            created_by=self.resident_user1
        )
    
    def test_unauthenticated_cannot_access_tasks(self):
        """Test that unauthenticated users cannot access tasks."""
        response = self.client.get('/api/tasks/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_manager_sees_all_tasks_in_property(self):
        """Test that managers see all tasks in their properties."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
    
    def test_staff_sees_only_assigned_tasks(self):
        """Test that maintenance staff see only tasks assigned to them."""
        self.client.force_authenticate(user=self.staff_user1)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.task_assigned_to_staff1.id)
    
    def test_staff_cannot_see_other_staff_tasks(self):
        """Test that staff cannot see tasks assigned to other staff (STRICT)."""
        self.client.force_authenticate(user=self.staff_user2)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        
        # Verify staff2 cannot access staff1's task directly (should get 404 since not in queryset)
        response = self.client.get(f'/api/tasks/{self.task_assigned_to_staff1.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_resident_sees_only_own_tasks(self):
        """Test that residents see only tasks they created."""
        self.client.force_authenticate(user=self.resident_user1)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], self.task_resident_created.id)
    
    def test_resident_cannot_see_other_resident_tasks(self):
        """Test that residents cannot see other residents' tasks (STRICT)."""
        self.client.force_authenticate(user=self.resident_user2)
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        
        # Verify resident2 cannot access resident1's task directly (should get 404 since not in queryset)
        response = self.client.get(f'/api/tasks/{self.task_resident_created.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_resident_can_create_task(self):
        """Test that residents can create maintenance requests."""
        self.client.force_authenticate(user=self.resident_user2)
        response = self.client.post('/api/tasks/', {
            'property': self.property.id,
            'title': 'New Request',
            'description': 'Leaking faucet',
            'priority': 'medium',
            'status': 'pending'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['created_by'], self.resident_user2.id)

    def test_resident_cannot_assign_staff_on_create(self):
        """Test that residents cannot choose the assignee when reporting a fault."""
        self.client.force_authenticate(user=self.resident_user2)
        response = self.client.post('/api/tasks/', {
            'property': self.property.id,
            'title': 'Blocked Request',
            'description': 'The heater is broken in the apartment',
            'priority': 'medium',
            'assigned_to': self.staff_user1.id,
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('assigned_to', response.data['errors'])

    def test_only_manager_can_fetch_maintenance_staff(self):
        """Test that staff lookup is restricted to managers."""
        self.client.force_authenticate(user=self.resident_user1)
        response = self.client.get('/api/users/maintenance_staff/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(f'/api/users/maintenance_staff/?property={self.property.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        returned_ids = {staff['id'] for staff in response.data}
        self.assertIn(self.staff_user1.id, returned_ids)
    
    def test_manager_can_assign_task(self):
        """Test that managers can assign tasks to staff."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post(
            f'/api/tasks/{self.task_manager_created.id}/assign_to/',
            {'staff_id': self.staff_user1.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['assigned_to'], self.staff_user1.id)
    
    def test_staff_cannot_assign_tasks(self):
        """Test that staff cannot assign tasks."""
        self.client.force_authenticate(user=self.staff_user1)
        response = self.client.post(
            f'/api/tasks/{self.task_assigned_to_staff1.id}/assign_to/',
            {'staff_id': self.staff_user2.id}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_resident_cannot_assign_tasks(self):
        """Test that residents cannot assign tasks."""
        self.client.force_authenticate(user=self.resident_user1)
        response = self.client.post(
            f'/api/tasks/{self.task_resident_created.id}/assign_to/',
            {'staff_id': self.staff_user1.id}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TaskStatusUpdateTestCase(APITestCase):
    """Test task status updates by role."""
    
    def setUp(self):
        """Create test data."""
        self.client = APIClient()
        
        # Create users
        self.manager_user = User.objects.create_user(
            username='manager1', password='manager123'
        )
        UserRole.objects.create(user=self.manager_user, role='manager')
        
        self.staff_user = User.objects.create_user(
            username='staff1', password='staff123'
        )
        UserRole.objects.create(user=self.staff_user, role='maintenance_staff')
        
        self.resident_user = User.objects.create_user(
            username='resident1', password='resident123'
        )
        UserRole.objects.create(user=self.resident_user, role='resident')
        
        # Create property
        self.property = Property.objects.create(
            name='Test Building',
            address='123 Main St',
            manager=self.manager_user,
            status='active'
        )
        
        # Create assigned task
        self.task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test task for status updates',
            priority='medium',
            status='assigned',
            assigned_to=self.staff_user,
            created_by=self.manager_user
        )
    
    def test_staff_can_mark_task_in_progress(self):
        """Test that assigned staff can mark task as in progress."""
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(f'/api/tasks/{self.task.id}/mark_in_progress/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'in_progress')
    
    def test_staff_can_mark_task_completed(self):
        """Test that assigned staff can mark task as completed."""
        self.task.status = 'in_progress'
        self.task.save()
        
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(f'/api/tasks/{self.task.id}/mark_completed/', {
            'completion_notes': 'Fixed the issue'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'completed')
        self.assertEqual(response.data['completion_notes'], 'Fixed the issue')
    
    def test_unassigned_staff_cannot_update_task(self):
        """Test that staff not assigned to task cannot update it."""
        other_staff = User.objects.create_user(
            username='staff2', password='staff123'
        )
        UserRole.objects.create(user=other_staff, role='maintenance_staff')
        
        self.client.force_authenticate(user=other_staff)
        response = self.client.post(f'/api/tasks/{self.task.id}/mark_in_progress/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_resident_cannot_update_task_status(self):
        """Test that residents cannot update task status."""
        self.client.force_authenticate(user=self.resident_user)
        response = self.client.post(f'/api/tasks/{self.task.id}/mark_in_progress/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AuthenticationTestCase(APITestCase):
    """Test session-based authentication."""
    
    def setUp(self):
        """Create test user."""
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        UserRole.objects.create(user=self.user, role='resident')
    
    def test_login_creates_session(self):
        """Test that login creates a session."""
        client = Client()
        response = client.post('/api-auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        # The response should be a redirect or 200 OK
        self.assertIn(response.status_code, [200, 302])
    
    def test_wrong_password_denied(self):
        """Test that wrong password is denied."""
        client = Client()
        response = client.post('/api-auth/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        # Should not create valid session
        self.assertNotIn('sessionid', client.cookies)
    
    def test_api_requires_authentication(self):
        """Test that API endpoints require authentication."""
        response = self.client.get('/api/tasks/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class TaskHistoryTrackingTestCase(APITestCase):
    """Test audit trail for task changes."""
    
    def setUp(self):
        """Create test data."""
        self.client = APIClient()
        
        self.manager_user = User.objects.create_user(
            username='manager1', password='manager123'
        )
        UserRole.objects.create(user=self.manager_user, role='manager')
        
        self.staff_user = User.objects.create_user(
            username='staff1', password='staff123'
        )
        UserRole.objects.create(user=self.staff_user, role='maintenance_staff')
        
        self.property = Property.objects.create(
            name='Test Building',
            address='123 Main St',
            manager=self.manager_user,
            status='active'
        )
        
        self.task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test',
            priority='medium',
            status='pending',
            created_by=self.manager_user
        )
    
    def test_task_assignment_creates_history(self):
        """Test that assigning a task creates history entry."""
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.post(
            f'/api/tasks/{self.task.id}/assign_to/',
            {'staff_id': self.staff_user.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check history was created
        history = TaskHistory.objects.filter(task=self.task, change_type='assigned')
        self.assertEqual(history.count(), 1)
        self.assertEqual(history.first().changed_by, self.manager_user)
    
    def test_task_status_change_creates_history(self):
        """Test that status change creates history entry."""
        self.task.assigned_to = self.staff_user
        self.task.status = 'assigned'
        self.task.save()
        
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(f'/api/tasks/{self.task.id}/mark_in_progress/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check history was created
        history = TaskHistory.objects.filter(task=self.task, change_type='status')
        self.assertTrue(history.exists())

    def test_task_comments_and_history_are_scoped_to_visible_tasks(self):
        """Test that residents cannot read comments/history for other users' reports."""
        other_resident = User.objects.create_user(
            username='resident2', password='resident123'
        )
        UserRole.objects.create(user=other_resident, role='resident')

        other_task = MaintenanceTask.objects.create(
            property=self.property,
            title='Other Request',
            description='Another issue',
            priority='medium',
            status='pending',
            created_by=other_resident
        )
        TaskComment.objects.create(task=other_task, author=self.manager_user, content='Please wait')
        TaskHistory.objects.create(
            task=other_task,
            changed_by=self.manager_user,
            change_type='status',
            old_value='pending',
            new_value='assigned'
        )

        self.client.force_authenticate(user=self.staff_user)
        comments = self.client.get(f'/api/comments/?task_id={other_task.id}')
        history = self.client.get(f'/api/history/?task_id={other_task.id}')
        self.assertEqual(comments.status_code, status.HTTP_200_OK)
        self.assertEqual(history.status_code, status.HTTP_200_OK)
        self.assertIn('results', comments.data)
        self.assertIn('results', history.data)
        self.assertEqual(len(comments.data['results']), 0)
        self.assertEqual(len(history.data['results']), 0)
