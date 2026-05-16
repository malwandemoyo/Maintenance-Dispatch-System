from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.authentication import SessionAuthentication
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from core.models import UserRole, Property, ResidentReport, MaintenanceTask, TaskComment, TaskHistory
from core.serializers import (
    UserSerializer, UserRoleSerializer, PropertySerializer,
    ResidentReportSerializer, MaintenanceTaskSerializer, TaskCommentSerializer, TaskHistorySerializer
)
from core.permissions import IsManager, IsMaintenanceStaff, IsResident


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session auth that bypasses CSRF validation (safe for API endpoints with proper permission checks)."""
    def enforce_csrf(self, request):
        return


def get_visible_tasks_for_user(user):
    """Return the task queryset visible to the given user."""
    try:
        role = user.role.role
    except UserRole.DoesNotExist:
        return MaintenanceTask.objects.none()

    if role == 'manager':
        return MaintenanceTask.objects.filter(property__manager=user)
    if role == 'maintenance_staff':
        return MaintenanceTask.objects.filter(assigned_to=user).exclude(status='cancelled')
    if role == 'resident':
        return MaintenanceTask.objects.filter(created_by=user)
    return MaintenanceTask.objects.none()


def get_visible_reports_for_user(user):
    """Return the report queryset visible to the given user."""
    try:
        role = user.role.role
    except UserRole.DoesNotExist:
        return ResidentReport.objects.none()

    if role == 'manager':
        return ResidentReport.objects.filter(property__manager=user)
    if role == 'maintenance_staff':
        return ResidentReport.objects.filter(tasks__assigned_to=user).distinct()
    if role == 'resident':
        return ResidentReport.objects.filter(reported_by=user)
    return ResidentReport.objects.none()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading user information."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role__role=role)
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current authenticated user."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def maintenance_staff(self, request):
        """Get maintenance staff, optionally scoped to a property."""
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            if request.user.role.role != 'manager':
                return Response({'detail': 'Property manager access required'}, status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'detail': 'Property manager access required'}, status=status.HTTP_403_FORBIDDEN)

        property_id = request.query_params.get('property')
        staff = User.objects.filter(role__role='maintenance_staff').select_related('staff_profile', 'staff_profile__property')

        if property_id:
            try:
                property_obj = Property.objects.get(id=property_id)
            except Property.DoesNotExist:
                return Response({'detail': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

            if property_obj.manager_id != request.user.id:
                return Response({'detail': 'Property manager access required'}, status=status.HTTP_403_FORBIDDEN)

            staff = staff.filter(staff_profile__property=property_obj)
        else:
            staff = staff.filter(staff_profile__property__manager=request.user)

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


class ResidentReportViewSet(viewsets.ModelViewSet):
    """ViewSet for resident fault reports."""
    queryset = ResidentReport.objects.all()
    serializer_class = ResidentReportSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get_queryset(self):
        user = self.request.user
        queryset = get_visible_reports_for_user(user)
        status_filter = self.request.query_params.get('status')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        try:
            role = user.role.role
        except UserRole.DoesNotExist:
            raise PermissionDenied("User role not found")

        if role not in ('resident', 'manager'):
            raise PermissionDenied("Only residents and managers can create reports")

        property_obj = serializer.validated_data.get('property')
        if role == 'resident':
            resident_property = getattr(getattr(user, 'resident_profile', None), 'property', None)
            # If resident has an assigned property, use it; otherwise use the provided property or default to first property
            if property_obj is None:
                if resident_property:
                    property_obj = resident_property
                else:
                    # Default to first available property if resident has none assigned
                    default_prop = Property.objects.first()
                    if default_prop is None:
                        raise PermissionDenied("No properties available for report submission")
                    property_obj = default_prop
            elif resident_property and property_obj != resident_property:
                raise PermissionDenied("Residents can only submit reports for their assigned property")
            serializer.save(reported_by=user, property=property_obj)
            return

        # For managers, property is required
        if property_obj is None:
            raise PermissionDenied("Property is required for report submission")
        serializer.save(reported_by=user)

    def perform_update(self, serializer):
        report = self.get_object()
        user = self.request.user
        try:
            role = user.role.role
        except UserRole.DoesNotExist:
            raise PermissionDenied("User role not found")

        if role == 'manager' and report.property.manager != user:
            raise PermissionDenied("You can only update reports in your properties")
        if role == 'resident' and report.reported_by != user:
            raise PermissionDenied("You can only update your own reports")
        if role == 'maintenance_staff':
            raise PermissionDenied("Maintenance staff cannot update reports directly")

        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def create_task(self, request, pk=None):
        """Create a maintenance task from a report (manager only)."""
        report = self.get_object()
        user = request.user

        try:
            if user.role.role != 'manager':
                return Response({'detail': 'Only managers can create tasks from reports'}, status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'detail': 'User role not found'}, status=status.HTTP_403_FORBIDDEN)

        if report.property.manager != user:
            return Response({'detail': 'You can only create tasks for reports in your properties'}, status=status.HTTP_403_FORBIDDEN)

        payload = {
            'property': report.property.id,
            'report': report.id,
            'title': request.data.get('title') or report.title,
            'description': request.data.get('description') or report.description,
            'priority': request.data.get('priority') or 'medium',
            'status': request.data.get('status') or 'pending',
            'assigned_to': request.data.get('assigned_to'),
            'due_date': request.data.get('due_date'),
            'completion_notes': request.data.get('completion_notes'),
        }

        serializer = MaintenanceTaskSerializer(data=payload, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=user)

        report.status = 'acknowledged'
        report.save(update_fields=['status', 'updated_at'])

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def close(self, request, pk=None):
        """Close a report after linked tasks are completed."""
        report = self.get_object()
        user = request.user

        try:
            if user.role.role != 'manager':
                return Response({'detail': 'Only managers can close reports'}, status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'detail': 'User role not found'}, status=status.HTTP_403_FORBIDDEN)

        if report.property.manager != user:
            return Response({'detail': 'You can only close reports in your properties'}, status=status.HTTP_403_FORBIDDEN)

        open_tasks = report.tasks.exclude(status='completed')
        if open_tasks.exists():
            return Response({'detail': 'Report cannot be closed until all linked tasks are completed'}, status=status.HTTP_400_BAD_REQUEST)

        report.status = 'closed'
        report.closed_at = timezone.now()
        report.save(update_fields=['status', 'closed_at', 'updated_at'])

        serializer = self.get_serializer(report)
        return Response(serializer.data)


class MaintenanceTaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing maintenance tasks with strict access control."""
    queryset = MaintenanceTask.objects.all()
    serializer_class = MaintenanceTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Enforce strict access control based on user role."""
        user = self.request.user
        status_filter = self.request.query_params.get('status')

        status_map = {
            'open': ['pending', 'assigned', 'in_progress'],
            'done': ['completed'],
            'deleted': ['cancelled'],
        }

        queryset = get_visible_tasks_for_user(user)

        if status_filter:
            normalized_status = status_filter.lower()
            if normalized_status in status_map:
                queryset = queryset.filter(status__in=status_map[normalized_status])
            else:
                queryset = queryset.filter(status=normalized_status)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user when creating a task."""
        # If a resident is creating a task, ensure the property (if provided) matches their assigned property
        user = self.request.user
        try:
            if user.role.role == 'resident':
                # Allow resident to create tasks only for their assigned property
                resident_prop = None
                if hasattr(user, 'resident_profile') and user.resident_profile.property:
                    resident_prop = user.resident_profile.property
                provided_property = serializer.validated_data.get('property')
                if provided_property and resident_prop and provided_property != resident_prop:
                    raise PermissionDenied("Residents can only report faults for their assigned property")
                # If resident has an assigned property and none was provided, auto-bind
                if resident_prop and not provided_property:
                    serializer.save(created_by=user, property=resident_prop, assigned_to=None, status='pending')
                    return
        except UserRole.DoesNotExist:
            pass

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
    
    def destroy(self, request, pk=None):
        """Soft delete a task by setting status to cancelled (manager only)."""
        task = self.get_object()
        
        try:
            if request.user.role.role != 'manager':
                return Response({'error': 'Only managers can delete tasks'}, 
                              status=status.HTTP_403_FORBIDDEN)
        except UserRole.DoesNotExist:
            return Response({'error': 'User role not found'}, status=status.HTTP_403_FORBIDDEN)
        
        if task.property.manager != request.user:
            return Response({'error': 'You can only delete tasks in your properties'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Soft delete: set status to cancelled instead of hard deleting
        old_status = task.status
        task.status = 'cancelled'
        task.save()
        
        TaskHistory.objects.create(
            task=task,
            changed_by=request.user,
            change_type='status',
            old_value=old_status,
            new_value='cancelled'
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskCommentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task comments."""
    queryset = TaskComment.objects.all()
    serializer_class = TaskCommentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        visible_tasks = get_visible_tasks_for_user(self.request.user)
        if task_id:
            return TaskComment.objects.filter(task_id=task_id, task__in=visible_tasks)
        return TaskComment.objects.filter(task__in=visible_tasks)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class TaskHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for reading task history (audit trail)."""
    queryset = TaskHistory.objects.all()
    serializer_class = TaskHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        task_id = self.request.query_params.get('task_id')
        visible_tasks = get_visible_tasks_for_user(self.request.user)
        if task_id:
            return TaskHistory.objects.filter(task_id=task_id, task__in=visible_tasks)
        return TaskHistory.objects.filter(task__in=visible_tasks)
