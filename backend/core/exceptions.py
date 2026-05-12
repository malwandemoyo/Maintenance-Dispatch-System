"""
Custom exception handlers for consistent API error responses.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler to provide consistent error response format.
    
    Returns standardized error format:
    {
        "error": true,
        "status_code": 400,
        "message": "Error message",
        "errors": {} or []
    }
    """
    response = exception_handler(exc, context)
    
    # Log the exception
    logger.error(f"Exception: {exc}", exc_info=True)
    
    if response is None:
        # Unhandled exception - return 500
        return Response(
            {
                'error': True,
                'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': 'Internal server error. Please try again later.',
                'errors': {}
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # Standardize response format for all errors
    custom_response_data = {
        'error': True,
        'status_code': response.status_code,
        'message': None,
        'errors': response.data if isinstance(response.data, dict) else {}
    }
    
    # Extract message from common error formats
    if isinstance(response.data, dict):
        if 'detail' in response.data:
            custom_response_data['message'] = str(response.data['detail'])
            del response.data['detail']
        elif 'non_field_errors' in response.data:
            custom_response_data['message'] = str(response.data['non_field_errors'][0])
        else:
            # Use first field error as message
            for field, errors in response.data.items():
                if isinstance(errors, list):
                    custom_response_data['message'] = f"{field}: {errors[0]}"
                else:
                    custom_response_data['message'] = f"{field}: {errors}"
                break
    elif isinstance(response.data, list):
        custom_response_data['message'] = str(response.data[0]) if response.data else 'An error occurred'
        custom_response_data['errors'] = response.data
    
    # Default message if none found
    if not custom_response_data['message']:
        custom_response_data['message'] = 'An error occurred'
    
    response.data = custom_response_data
    return response
