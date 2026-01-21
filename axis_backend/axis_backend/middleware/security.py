"""
Security middleware for Axis Backend.

Provides:
- Content Security Policy (CSP) headers
- Additional security headers beyond Django's SecurityMiddleware
"""
from django.conf import settings


class SecurityHeadersMiddleware:
    """
    Add security headers to all responses.

    Headers added:
    - Content-Security-Policy: Prevents XSS, clickjacking, and code injection
    - X-Content-Type-Options: Prevents MIME-sniffing attacks
    - X-Frame-Options: Already set by Django, but reinforced
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser feature access
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content Security Policy - Strict policy for API
        # For API-only backend, we don't load scripts, styles, or images
        csp_directives = [
            "default-src 'none'",  # Block everything by default
            "script-src 'none'",   # No JavaScript execution
            "style-src 'none'",    # No stylesheets
            "img-src 'none'",      # No images
            "font-src 'none'",     # No fonts
            "connect-src 'self'",  # Allow API calls to same origin
            "frame-ancestors 'none'",  # Prevent iframe embedding (already in X-Frame-Options)
            "base-uri 'self'",     # Prevent <base> tag injection
            "form-action 'self'",  # Restrict form submissions
        ]

        # Relax CSP for Django Admin
        if request.path.startswith('/admin'):
            csp_directives = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",  # Admin requires inline scripts
                "style-src 'self' 'unsafe-inline'",   # Admin requires inline styles
                "img-src 'self' data:",                # Admin uses data URIs
                "font-src 'self'",
                "connect-src 'self'",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ]

        response['Content-Security-Policy'] = '; '.join(csp_directives)

        # Additional security headers
        response['X-Content-Type-Options'] = 'nosniff'  # Prevent MIME-sniffing
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'  # Control referrer

        # Permissions-Policy (formerly Feature-Policy)
        # Disable all browser features we don't need
        permissions_policy = [
            'geolocation=()',
            'microphone=()',
            'camera=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
        ]
        response['Permissions-Policy'] = ', '.join(permissions_policy)

        return response
