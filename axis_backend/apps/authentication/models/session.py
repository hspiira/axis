"""Session model - active user session tracking for authentication."""
from django.db import models
from django.utils import timezone

from axis_backend.utils import generate_cuid


class Session(models.Model):
    """
    Active authentication session tracker.

    Responsibilities (Single Responsibility Principle):
    - Track active user sessions
    - Store session metadata (IP, user agent)
    - Support session invalidation and security monitoring

    Design Notes:
    - Not using BaseModel (no soft delete needed for sessions)
    - Session token should be cryptographically secure
    - IP and user agent for security audit
    - No cascade delete - sessions cleaned up separately
    """

    id = models.CharField(
        primary_key=True,
        default=generate_cuid,
        editable=False,
        max_length=25
    )
    session_token = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique session identifier"
    )
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='sessions',
        db_index=True,
        help_text="User who owns this session"
    )
    expires = models.DateTimeField(
        db_index=True,
        help_text="Session expiration timestamp"
    )

    # === Security Tracking ===
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Client IP address when session created"
    )
    user_agent = models.TextField(
        null=True,
        blank=True,
        help_text="Client user agent string"
    )
    is_valid = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Session validity flag (for manual invalidation)"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        db_table = 'sessions'
        verbose_name = 'Session'
        verbose_name_plural = 'Sessions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires']),
            models.Index(fields=['is_valid']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Session for {self.user.email}"

    def __repr__(self):
        return f"<Session: {self.user.email} ({self.session_token[:8]}...)>"

    @property
    def is_expired(self) -> bool:
        """Check if session has expired."""
        return timezone.now() >= self.expires

    @property
    def is_active(self) -> bool:
        """Check if session is valid and not expired."""
        return self.is_valid and not self.is_expired

    @property
    def time_remaining(self) -> int:
        """
        Calculate remaining session time in seconds.

        Returns:
            int: Seconds until expiration (0 if expired)
        """
        if self.is_expired:
            return 0
        delta = self.expires - timezone.now()
        return int(delta.total_seconds())

    def invalidate(self) -> None:
        """Manually invalidate session (for logout or security)."""
        self.is_valid = False
        self.save(update_fields=['is_valid'])

    def extend(self, minutes: int = 30) -> None:
        """
        Extend session expiration time.

        Args:
            minutes: Number of minutes to extend (default: 30)
        """
        from datetime import timedelta
        self.expires = timezone.now() + timedelta(minutes=minutes)
        self.save(update_fields=['expires'])

    @classmethod
    def cleanup_expired(cls) -> int:
        """
        Remove expired sessions from database.

        Returns:
            int: Number of sessions deleted
        """
        count, _ = cls.objects.filter(expires__lt=timezone.now()).delete()
        return count
