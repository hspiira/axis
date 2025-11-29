from django.urls import resolve, Resolver404
from django.utils import timezone
from apps.audit.models import AuditLog
from axis_backend.enums import ActionType
import json
import time


class AuditMiddleware:
    """
    Middleware to automatically audit all state-changing API requests.

    Logs:
    - User performing the action
    - HTTP method and endpoint
    - Request parameters and body
    - Response status code
    - Client ID (if present in headers)
    - IP address and user agent
    - Timestamp and duration

    Only audits:
    - API endpoints (paths starting with /api/)
    - State-changing methods (POST, PUT, PATCH, DELETE)
    - Authenticated requests (anonymous requests are rate-limited separately)
    """

    # Methods that change state and should be audited
    AUDIT_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

    # Sensitive fields to redact from audit logs
    SENSITIVE_FIELDS = {
        'password', 'token', 'secret', 'api_key',
        'access_token', 'refresh_token', 'auth',
        'authorization', 'ssn', 'social_security',
        'credit_card', 'card_number', 'cvv', 'pin'
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Record start time
        start_time = time.time()

        # Get response
        response = self.get_response(request)

        # Calculate duration
        duration_ms = int((time.time() - start_time) * 1000)

        # Check if we should audit this request
        if self._should_audit(request):
            self._create_audit_log(request, response, duration_ms)

        return response

    def _should_audit(self, request):
        """
        Determine if request should be audited.

        Audit if:
        - Path starts with /api/ (API endpoints only)
        - Method is state-changing (POST, PUT, PATCH, DELETE)
        - User is authenticated (skip anonymous requests)

        Returns:
            bool: True if request should be audited
        """
        # Only audit API endpoints
        if not request.path.startswith('/api/'):
            return False

        # Only audit state-changing methods
        if request.method not in self.AUDIT_METHODS:
            return False

        # Only audit authenticated requests
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return False

        return True

    def _create_audit_log(self, request, response, duration_ms):
        """
        Create audit log entry asynchronously.

        Args:
            request: Django request object
            response: Django response object
            duration_ms: Request duration in milliseconds
        """
        try:
            # Extract client ID from headers (if present)
            client_id = request.headers.get('X-Client-ID')

            # Map HTTP method to ActionType
            action_type_map = {
                'POST': ActionType.CREATE,
                'PUT': ActionType.UPDATE,
                'PATCH': ActionType.UPDATE,
                'DELETE': ActionType.DELETE,
            }
            action_type = action_type_map.get(request.method, ActionType.OTHER)

            # Extract request body (sanitized)
            request_data = self._sanitize_data(self._get_request_body(request))

            # Build metadata
            metadata = {
                'method': request.method,
                'path': request.path,
                'query_params': dict(request.GET),
                'client_id': client_id,
                'ip_address': self._get_client_ip(request),
                'user_agent': request.headers.get('User-Agent', ''),
                'status_code': response.status_code,
                'duration_ms': duration_ms,
                'request_data': request_data,
            }
            
            # Extract entity info using URL resolver
            entity_type, entity_id = self._get_entity_info(request)

            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                action=action_type,
                entity_type=entity_type,
                entity_id=entity_id,
                data=metadata,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get('User-Agent', '')[:500],  # Truncate long UAs
            )

        except Exception as e:
            # Never let audit logging break the request
            # Log error to console but don't raise
            import logging
            logger = logging.getLogger('axis_backend.audit')
            logger.error(f"Failed to create audit log: {e}", exc_info=True)

    def _get_entity_info(self, request):
        """
        Extract model name and object ID from the request using URL resolver.
        """
        entity_type = None
        entity_id = None
        try:
            resolver_match = resolve(request.path_info)
            view = resolver_match.func
            
            # For class-based views (like ViewSets)
            if hasattr(view, 'cls'):
                view_class = view.cls
                # Get model from queryset
                if hasattr(view_class, 'queryset') and view_class.queryset is not None:
                    entity_type = view_class.queryset.model.__name__
                # Fallback for views with get_queryset
                elif hasattr(view_class, 'get_queryset'):
                    entity_type = view_class().get_queryset().model.__name__

            # Extract primary key from URL kwargs
            pk_field = getattr(view, 'lookup_field', 'pk')
            if pk_field in resolver_match.kwargs:
                entity_id = resolver_match.kwargs[pk_field]
            elif 'pk' in resolver_match.kwargs:
                 entity_id = resolver_match.kwargs['pk']
            elif 'id' in resolver_match.kwargs:
                 entity_id = resolver_match.kwargs['id']

        except Resolver404:
            # Path doesn't match any URL pattern
            pass
        except Exception:
            # Catch other potential errors to avoid breaking the request
            pass

        return entity_type, entity_id

    def _get_request_body(self, request):
        """
        Extract and parse request body.

        Returns:
            dict: Parsed request body or empty dict if parsing fails
        """
        try:
            if hasattr(request, 'data'):
                # DRF parsed data (preferred - already parsed)
                return dict(request.data)
        except (ValueError, AttributeError):
            pass
        
        # Try to access raw body only if DRF hasn't already read it
        try:
            if hasattr(request, 'body') and request.body:
                # Raw body - try to parse as JSON
                return json.loads(request.body.decode('utf-8'))
        except (ValueError, AttributeError, UnicodeDecodeError):
            # Body may have already been read by DRF, which raises RawPostDataException
            # This is expected and we should just return empty dict
            pass
        except Exception:
            # Catch any other exceptions (like RawPostDataException from Django)
            pass
        
        return {}

    def _sanitize_data(self, data):
        """
        Remove sensitive fields from data before logging.

        Args:
            data: Dictionary to sanitize

        Returns:
            dict: Sanitized data with sensitive fields redacted
        """
        if not isinstance(data, dict):
            return data

        sanitized = {}
        for key, value in data.items():
            # Check if key contains sensitive terms
            if any(sensitive in key.lower() for sensitive in self.SENSITIVE_FIELDS):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                # Recursively sanitize nested dicts
                sanitized[key] = self._sanitize_data(value)
            elif isinstance(value, list):
                # Sanitize lists
                sanitized[key] = [
                    self._sanitize_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value

        return sanitized

    def _get_client_ip(self, request):
        """
        Extract client IP address from request.

        Handles X-Forwarded-For header for proxied requests.

        Returns:
            str: Client IP address
        """
        x_forwarded_for = request.headers.get('X-Forwarded-For')
        if x_forwarded_for:
            # Get first IP in chain (client IP)
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        return ip[:45]  # IPv6 max length
