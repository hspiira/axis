# Security Configuration Guide

This document outlines the security measures implemented in the Axis Backend API and provides guidance for secure deployment.

## Table of Contents
1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Rate Limiting](#rate-limiting)
4. [Environment Configuration](#environment-configuration)
5. [Production Deployment](#production-deployment)
6. [Security Checklist](#security-checklist)
7. [Incident Response](#incident-response)

---

## Security Overview

The Axis Backend implements defense-in-depth security with multiple layers:

- **Authentication**: JWT-based authentication with refresh token rotation
- **Authorization**: Role-Based Access Control (RBAC) + Client-Scoped Permissions
- **Rate Limiting**: Multi-tier throttling to prevent abuse
- **Input Validation**: Client ID validation and sanitization
- **Error Handling**: Custom exception handler prevents information leakage
- **HTTPS**: Enforced in production with HSTS
- **CORS**: Environment-specific origin control

---

## Authentication & Authorization

### JWT Configuration

**Development** (24-hour access tokens):
```python
ACCESS_TOKEN_LIFETIME = timedelta(hours=24)
REFRESH_TOKEN_LIFETIME = timedelta(days=7)
```

**Production** (30-minute access tokens):
```python
ACCESS_TOKEN_LIFETIME = timedelta(minutes=30)  # Short-lived for security
REFRESH_TOKEN_LIFETIME = timedelta(days=7)     # Refresh tokens last longer
ROTATE_REFRESH_TOKENS = True                    # Rotate on use
BLACKLIST_AFTER_ROTATION = True                 # Prevent replay attacks
```

### Permission Classes

#### `IsAdminOrManager`
- Requires `is_staff=True` OR `admin`/`manager` role
- Use for: Admin operations, bulk actions, system-wide queries

#### `IsOwnerOrAdmin`
- Allows users to access their own records
- Checks: `user`, `user_id`, `owner`, `owner_id`, `created_by` attributes
- Use for: Profile access, personal data

#### `CanManagePersons`
- Requires `is_staff=True` OR `hr_manager`/`manager` role
- Includes client-scoped authorization via `UserClient` table
- Use for: Employee/dependent management

#### `CanManageDocuments`
- Requires `is_staff=True` OR `manage_documents` permission
- Validates client IDs (CUID format, existence check)
- Action-specific: `publish`/`archive`/`update`/`destroy` require `document_manager` role
- Use for: Document lifecycle management

### User-Client Authorization

Users must be explicitly authorized for clients via the `UserClient` junction table:

```python
from apps.authentication.models import UserClient

# Grant access
UserClient.objects.create(
    user=user,
    client=client,
    granted_by=admin_user,
    notes="HR Manager for this client"
)

# Check access
is_authorized = UserClient.objects.filter(
    user=user,
    client_id=client_id,
    deleted_at__isnull=True
).exists()
```

**Security Note**: Never rely on `user.metadata['authorized_clients']` - this is user-editable and insecure.

---

## Rate Limiting

### Default Rates (base.py)
```python
'anon': '100/hour',       # Unauthenticated users
'burst': '60/minute',     # Short-term authenticated limit
'sustained': '1000/hour', # Long-term authenticated limit
'auth': '5/minute',       # Authentication endpoints (strict)
```

### Development Rates (development.py)
More lenient for testing:
```python
'anon': '1000/hour'
'burst': '300/minute'
'sustained': '10000/hour'
'auth': '20/minute'
```

### Production Rates (production.py)
Strict limits for security:
```python
'anon': '100/hour'
'burst': '60/minute'
'sustained': '1000/hour'
'auth': '5/minute'  # Brute force protection
```

### Custom Throttle Classes

- `StrictAnonRateThrottle`: IP-based for unauthenticated users
- `BurstRateThrottle`: Short-term limit for authenticated users
- `SustainedRateThrottle`: Long-term limit for authenticated users
- `AuthenticationRateThrottle`: Very strict for login/register endpoints

### Applying to Specific Views

```python
from axis_backend.throttling import AuthenticationRateThrottle

class LoginView(APIView):
    throttle_classes = [AuthenticationRateThrottle]
```

---

## Environment Configuration

### Required Environment Variables

#### Base Configuration
```bash
# Django
SECRET_KEY=<strong-random-key>
DJANGO_SETTINGS_MODULE=axis_backend.settings.production

# Database
DB_NAME=axis_backend
DB_USER=axis_user
DB_PASSWORD=<strong-password>
DB_HOST=localhost
DB_PORT=5432

# Redis (for caching and rate limiting)
REDIS_URL=redis://localhost:6379/0
```

#### Production-Specific
```bash
# Security
ALLOWED_HOSTS=api.example.com,www.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# Email (for error notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=noreply@example.com
EMAIL_HOST_PASSWORD=<app-password>
DEFAULT_FROM_EMAIL=noreply@example.com
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=Admin Team

# Microsoft Entra ID (if using)
MICROSOFT_CLIENT_ID=<client-id>
MICROSOFT_CLIENT_SECRET=<client-secret>
MICROSOFT_TENANT_ID=<tenant-id>
MICROSOFT_REDIRECT_URI=https://api.example.com/auth/microsoft/callback
```

---

## Production Deployment

### 1. Security Headers

Production settings automatically enable:
- `SECURE_SSL_REDIRECT = True` - Force HTTPS
- `SECURE_HSTS_SECONDS = 31536000` - 1 year HSTS
- `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`
- `SECURE_HSTS_PRELOAD = True`
- `SESSION_COOKIE_SECURE = True` - HTTPS-only cookies
- `CSRF_COOKIE_SECURE = True`
- `X_FRAME_OPTIONS = 'DENY'` - Prevent clickjacking
- `SECURE_CONTENT_TYPE_NOSNIFF = True`
- `SECURE_BROWSER_XSS_FILTER = True`

### 2. Content Security Policy (CSP)

Install django-csp:
```bash
pip install django-csp
```

Add to `INSTALLED_APPS` and `MIDDLEWARE` in production.py:
```python
INSTALLED_APPS += ['csp']
MIDDLEWARE += ['csp.middleware.CSPMiddleware']
```

### 3. Database Security

**PostgreSQL Configuration**:
```sql
-- Create database with restricted access
CREATE DATABASE axis_backend;
CREATE USER axis_user WITH ENCRYPTED PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE axis_backend TO axis_user;
GRANT USAGE ON SCHEMA public TO axis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO axis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO axis_user;

-- Enable SSL connections
ALTER SYSTEM SET ssl = on;
```

**Connection Pooling**:
```python
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,  # Keep connections for 10 minutes
        'OPTIONS': {
            'sslmode': 'require',  # Require SSL
        }
    }
}
```

### 4. Redis Security

```bash
# redis.conf
requirepass strong-redis-password
bind 127.0.0.1  # Only local connections
protected-mode yes
```

Update `REDIS_URL`:
```bash
REDIS_URL=redis://:strong-redis-password@localhost:6379/0
```

### 5. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Security Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] `SECRET_KEY` is cryptographically random (50+ characters)
- [ ] `DEBUG = False` in production
- [ ] `ALLOWED_HOSTS` configured with actual domain
- [ ] `CORS_ALLOWED_ORIGINS` contains only trusted origins
- [ ] Database password is strong (16+ characters)
- [ ] Redis password configured
- [ ] SSL/TLS certificates valid
- [ ] Rate limiting enabled and tested
- [ ] Exception handler enabled
- [ ] All migrations applied
- [ ] Static files collected
- [ ] Superuser created with strong password

### Post-Deployment
- [ ] HTTPS working correctly
- [ ] HSTS header present (check with browser dev tools)
- [ ] CSP headers present
- [ ] Rate limiting functioning (test with multiple requests)
- [ ] Authentication working
- [ ] Authorization working (test with different user roles)
- [ ] Client-scoped authorization tested
- [ ] Error responses don't leak sensitive info
- [ ] Logging configured and working
- [ ] Email notifications working
- [ ] Database backups configured
- [ ] Monitoring/alerting set up

### Regular Maintenance
- [ ] Review and rotate `SECRET_KEY` annually
- [ ] Update dependencies monthly (`pip list --outdated`)
- [ ] Run security audit: `pip-audit`
- [ ] Review access logs for suspicious activity
- [ ] Test backup restoration process
- [ ] Review and update user permissions
- [ ] Check for Django security advisories
- [ ] Update SSL/TLS certificates before expiry

---

## Incident Response

### Security Incident Procedure

1. **Detect**: Monitor logs, alerts, user reports
2. **Contain**: Disable compromised accounts, block IPs if needed
3. **Investigate**: Review logs, identify attack vector
4. **Eradicate**: Fix vulnerability, patch systems
5. **Recover**: Restore services, verify security
6. **Document**: Record incident details, lessons learned

### Emergency Actions

**Compromised User Account**:
```python
from apps.authentication.models import User

user = User.objects.get(email='compromised@example.com')
user.suspend(reason="Security incident - unauthorized access detected")
user.is_active = False
user.save()
```

**Revoke All JWT Tokens**:
```python
# Rotate SECRET_KEY in environment variables
# All existing JWTs will become invalid
# Users must re-authenticate
```

**Block IP Address** (via Nginx):
```nginx
# /etc/nginx/blocked-ips.conf
deny 192.0.2.1;
deny 198.51.100.0/24;
```

### Contact Information

**Security Issues**: Report to security@example.com
**On-Call Engineer**: +1-XXX-XXX-XXXX
**Incident Response Team**: security-team@example.com

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [DRF Security Best Practices](https://www.django-rest-framework.org/topics/api-security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: 2025-01-23
**Version**: 1.0.0
