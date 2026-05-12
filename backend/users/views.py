from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

from users.serializers import (
    UserSerializer,
    RegisterSerializer,
    ChangePasswordSerializer,
    UserProfileUpdateSerializer,
)


class AuthViewSet(viewsets.GenericViewSet):
    """
    ViewSet for user authentication endpoints.
    Handles login, logout, registration, and password changes.
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """Register a new user (resident by default)."""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'detail': 'User registered successfully'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """Login user with username and password."""
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'detail': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            serializer = UserSerializer(user)
            return Response({
                'detail': 'Login successful',
                'user': serializer.data
            })
        
        return Response(
            {'detail': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """Logout current user."""
        logout(request)
        return Response({'detail': 'Logout successful'})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], permission_classes=[IsAuthenticated])
    def profile_update(self, request):
        """Update current user profile."""
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'detail': 'Profile updated successfully',
                'user': UserSerializer(request.user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change password for authenticated user."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing user information.
    Only authenticated users can access.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
