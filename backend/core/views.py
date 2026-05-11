from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from core.models import UserRole, Property, MaintenanceTask, TaskComment, TaskHistory
from core.serializers import (
    UserSerializer, UserRoleSerializer, PropertySerializer,
    MaintenanceTaskSerializer, TaskCommentSerializer, TaskHistorySerializer
)


class IsManager(BasePermission):
    """Permission to check if user is a Property Manager."""
    def has_permission(self, request, view):
        try:
            return request.user.is_authenticated and request.user.role.role == 'manager'
        except UserRole.DoesNotExist:
            return False


class IsMaintenanceStaff(BasePermission):
    """Permission to check if user is Maintenance Staff."""
    def has_permission(self, request, view):
        try:
            return request.user.is_authenticated and request.user.role.role == 'maintenance_staff'
        except UserRole.DoesNotExist:
            return False


class IsResident(BasePermission):
    """Permission to check if user is a Resident."""
    def has_permission(self, request, view):
        try:
            return request.user.is_authenticated and request.user.role.role == 'resident'
        except UserRole.DoesNotExist:
            return False


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading user information."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def maintenance_staff(self, request):
        """Get all maintenance staff."""
        staff = User.objects.filter(role__role='maintenance_staff')
        serializer = self.get_serializer(staff, many=True)
        return Response(serializer.data)


class UserRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user roles (admin only)."""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return UserRole.objects.all()
        return UserRole.objects.filter(user=self.request.user)


class PropertyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing properties."""
    queryset = Property.objects.all()
    serializer_class = PropertySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        try:
            if user.is_superuser:
                # Superusers see all properties
                return Property.objects.all()
            elif user.role.role == 'manager':
                return Property.objects.filter(manager=user)
        except UserRole.DoesNotExist:
            pass
        return Property.objects.none()
    
    def perform_create(self, serializer):
        # Only managers can create properties
        try:
            if self.request.user.role.role != 'manager':
                raise PermissionDenied("Only managers can create properties")
        except UserRole.DoesNotExist:
            raise PermissionDenied("User role not found")
        serializer.save(manager=self.request.user)


class MaintenanceTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing maintenance tasks with strict access control."""
    queryset = MaintenanceTask.objects.all()
    serializer_class = MaintenanceTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Enforce strict access control based on user role."""
        user = self.request.user
        try:
            role = user.role.role
            
            if role == 'manager':
                # Managers see all tasks in their properties
                return MaintenanceTask.objects.filter(property__manager=user)
            
            elif role == 'maintenance_staff':
                # Maintenance staff see only tasks assigned to them
                return MaintenanceTask.objects.filter(assigned_to=user)
            
            elif role == 'resident':
                # Residents see only tasks they created
                return MaintenanceTask.objects.filter(created_by=user)
        
        except UserRole.DoesNotExist:
            pass
        
        return MaintenanceTask.objects.none()
    
    def perform_create(self, serializer):
        """Set created_by to current user when creating a task."""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Enforce update restrictions based on role."""
        task = self.get_object()
        user = self.request.user
        
        try:
            role = user.role.role
            
            if role == 'manager':
                # Manager can update any task in their properties
                if task.property.manager != user:
                    raise PermissionDenied("You can only update tasks in your properties")
            
            elif role == 'maintenance_staff':
                # Maintenance staff can only update status if assigned to them
                if task.assigned_to != user:
                    raise PermissionDenied("You can only update tasks assigned to you")
                
                # Can only update status and completion_notes
                if 'property' in serializer.validated_data or 'assigned_to' in serializer.validated_data:
                    raise PermissionDenied("Maintenance staff cannot modify task assignments or properties")
            
            elif role == 'resident':
                # Residents can only update their own tasks before assignment
                if task.created_by != user or task.status != 'pending':
                    raise PermissionDenied("You can only update pending tasks you created")
        
        except UserRole.DoesNotExist:
            raise PermissionDenied("User role not found")
        
        serializer.save()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_in_progress(self, request, pk=None):
        """Mark a task as in progress (maintenance staff only)."""
        task = self.get_object()
        
        try:
            if request.user.role.role != 'maintenance_staff':
                return Response({'error': 'Only maintenance staff can mark tasks in progress'}, 
                              status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'error': 'User role not found'}, status=status.HTTP_403_FORBIDDEN)
        
        if task.assigned_to != request.user:
            return Response({'error': 'You can only update tasks assigned to you'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        task.status = 'in_progress'
        task.save()
        
        TaskHistory.objects.create(
            task=task,
            changed_by=request.user,
            change_type='status',
            old_value='assigned',
            new_value='in_progress'
        )
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_completed(self, request, pk=None):
        """Mark a task as completed (maintenance staff only)."""
        task = self.get_object()
        
        try:
            if request.user.role.role != 'maintenance_staff':
                return Response({'error': 'Only maintenance staff can mark tasks completed'}, 
                              status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'error': 'User role not found'}, status=status.HTTP_403_FORBIDDEN)
        
        if task.assigned_to != request.user:
            return Response({'error': 'You can only complete tasks assigned to you'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.completion_notes = request.data.get('completion_notes', '')
        task.save()
        
        TaskHistory.objects.create(
            task=task,
            changed_by=request.user,
            change_type='status',
            old_value='in_progress',
            new_value='completed'
        )
        
        serializer = self.get_serializer(task)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def assign_to(self, request, pk=None):
        """Assign task to a maintenance staff member (manager only)."""
        task = self.get_object()
        
        try:
            if request.user.role.role != 'manager':
                return Response({'error': 'Only managers can assign tasks'}, 
                              status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'error': 'User role not found'}, status=status.HTTP_403_FORBIDDEN)
        
        if task.property.manager != request.user:
            return Response({'error': 'You can only assign tasks in your properties'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        staff_id = request.data.get('staff_id')
        try:
            staff = User.objects.get(id=staff_id, role__role='maintenance_staff')
            old_assigned = task.assigned_to.username if task.assigned_to else 'Unassigned'
            task.assigned_to = staff
            task.status = 'assigned'
            task.save()
            
            TaskHistory.objects.create(
                task=task,
                changed_by=request.user,
                change_type='assigned',
                old_value=old_assigned,
                new_value=staff.username
            )
            
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'Maintenance staff member not found'}, 
                          status=status.HTTP_404_NOT_FOUND)


class TaskCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task comments."""
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        if task_id:
            return TaskComment.objects.filter(task_id=task_id)
        return TaskComment.objects.all()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class TaskHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading task history (audit trail)."""
    queryset = TaskHistory.objects.all()
    serializer_class = TaskHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        if task_id:
            return TaskHistory.objects.filter(task_id=task_id)
        return TaskHistory.objects.all()
