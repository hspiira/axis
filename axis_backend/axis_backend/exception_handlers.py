"""Custom exception handlers for API error responses."""
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that prevents sensitive information leakage.
    
    Security features:
    - Strips sensitive Django/Python internals from error responses
    - Logs full error details server-side for debugging
    - Returns user-friendly error messages
    - Prevents stack trace exposure in production
    
    Args:
        exc: Exception instance
        context: Context dict with view, request, args, kwargs
    
    Returns:
        Response: DRF Response object with safe error message
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # If DRF didn't handle it, handle it ourselves
    if response is None:
        response = handle_unhandled_exception(exc, context)
    
    # Add custom error code and sanitize response
    if response is not None:
        response = sanitize_error_response(response, exc, context)
    
    # Log the error with full context (server-side only)
    log_exception(exc, context, response)
    
    return response


def handle_unhandled_exception(exc, context):
    """
    Handle exceptions not caught by DRF's default handler.
    
    Args:
        exc: Exception instance
        context: Context dict
    
    Returns:
        Response or None
    """
    # Handle Django's Http404
    if isinstance(exc, Http404):
        return Response(
            {
                'error': 'not_found',
                'message': 'The requested resource was not found.',
                'detail': None
            },
            status=404
        )
    
    # Handle Django's ObjectDoesNotExist
    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {
                'error': 'not_found',
                'message': 'The requested object does not exist.',
                'detail': None
            },
            status=404
        )
    
    # For all other unhandled exceptions, return generic 500
    return Response(
        {
            'error': 'server_error',
            'message': 'An unexpected error occurred. Please try again later.',
            'detail': None
        },
        status=500
    )


def sanitize_error_response(response, exc, context):
    """
    Sanitize error response to prevent information leakage.
    
    Removes:
    - Stack traces
    - File paths
    - Database query details
    - Python/Django internal details
    
    Args:
        response: DRF Response object
        exc: Exception instance
        context: Context dict
    
    Returns:
        Response: Sanitized response
    """
    # Determine error code based on exception type
    error_code = get_error_code(exc)
    
    # Build safe error structure
    safe_data = {
        'error': error_code,
        'message': get_safe_message(exc, response),
        'status_code': response.status_code,
    }
    
    # Include field-specific validation errors if present
    if isinstance(exc, ValidationError) and hasattr(response, 'data'):
        safe_data['errors'] = sanitize_validation_errors(response.data)
    elif hasattr(response, 'data') and isinstance(response.data, dict):
        # Include detail if it's safe
        if 'detail' in response.data:
            safe_data['detail'] = str(response.data['detail'])
    
    response.data = safe_data
    return response


def get_error_code(exc):
    """
    Generate error code from exception type.
    
    Args:
        exc: Exception instance
    
    Returns:
        str: Error code
    """
    if isinstance(exc, ValidationError):
        return 'validation_error'
    elif isinstance(exc, PermissionDenied):
        return 'permission_denied'
    elif isinstance(exc, Http404) or isinstance(exc, ObjectDoesNotExist):
        return 'not_found'
    elif hasattr(exc, 'default_code'):
        return exc.default_code
    else:
        return 'error'


def get_safe_message(exc, response):
    """
    Extract safe error message from exception.
    
    Args:
        exc: Exception instance
        response: DRF Response
    
    Returns:
        str: Safe error message
    """
    # For validation errors, return generic message
    if isinstance(exc, ValidationError):
        return 'Validation failed. Please check your input.'
    
    # For permission errors, return clear message
    if isinstance(exc, PermissionDenied):
        return 'You do not have permission to perform this action.'
    
    # For other DRF exceptions, use the detail if safe
    if hasattr(exc, 'detail'):
        detail = str(exc.detail)
        # Don't expose internal paths or technical details
        if any(term in detail.lower() for term in ['traceback', 'file', 'line', 'error at']):
            return 'An error occurred processing your request.'
        return detail
    
    # Default safe message
    return 'An error occurred processing your request.'


def sanitize_validation_errors(data):
    """
    Sanitize validation error details.
    
    Args:
        data: Error data dict
    
    Returns:
        dict: Sanitized validation errors
    """
    if isinstance(data, dict):
        return {
            key: [str(error) for error in value] if isinstance(value, list) else str(value)
            for key, value in data.items()
            if key not in ['detail', 'non_field_errors'] or key == 'non_field_errors'
        }
    return {}


def log_exception(exc, context, response):
    """
    Log exception details server-side for debugging.
    
    Args:
        exc: Exception instance
        context: Context dict
        response: Response object
    """
    request = context.get('request')
    view = context.get('view')
    
    # Build log context
    log_context = {
        'exception_type': type(exc).__name__,
        'exception_message': str(exc),
        'view': view.__class__.__name__ if view else 'Unknown',
        'method': request.method if request else 'Unknown',
        'path': request.path if request else 'Unknown',
        'user': str(request.user) if request and hasattr(request, 'user') else 'Anonymous',
        'status_code': response.status_code if response else 'Unknown',
    }
    
    # Log at appropriate level
    if response and response.status_code >= 500:
        logger.error(
            f"Server error: {log_context['exception_type']} in {log_context['view']}",
            extra=log_context,
            exc_info=True
        )
    elif response and response.status_code >= 400:
        logger.warning(
            f"Client error: {log_context['exception_type']} in {log_context['view']}",
            extra=log_context
        )
    else:
        logger.info(
            f"Exception handled: {log_context['exception_type']}",
            extra=log_context
        )
