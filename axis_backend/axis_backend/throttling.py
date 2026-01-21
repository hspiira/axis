"""Custom throttling classes for API rate limiting."""
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """
    Burst rate limit for authenticated users.
    
    Prevents rapid-fire requests while allowing normal usage.
    Scope: 'burst' - short-term rate limit
    """
    scope = 'burst'


class SustainedRateThrottle(UserRateThrottle):
    """
    Sustained rate limit for authenticated users.
    
    Prevents long-term API abuse while allowing generous usage.
    Scope: 'sustained' - long-term rate limit
    """
    scope = 'sustained'


class AuthenticationRateThrottle(AnonRateThrottle):
    """
    Strict rate limit for authentication endpoints.
    
    Prevents brute force and credential stuffing attacks.
    Scope: 'auth' - authentication-specific endpoints
    """
    scope = 'auth'

    def get_cache_key(self, request, view):
        """
        Use IP address for rate limiting authentication attempts.
        
        This prevents attackers from bypassing limits by using different
        credentials on the same IP address.
        """
        if request.user and request.user.is_authenticated:
            # Authenticated users get regular user rate limit
            return None
        
        # Use IP-based rate limiting for unauthenticated requests
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }


class StrictAnonRateThrottle(AnonRateThrottle):
    """
    Strict rate limit for anonymous/unauthenticated users.
    
    More restrictive than authenticated users to prevent abuse.
    Scope: 'anon' - unauthenticated requests
    """
    scope = 'anon'
