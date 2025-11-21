"""Account model - OAuth provider account linkage for external authentication."""
from django.db import models
from django.utils import timezone

from axis_backend.models import BaseModel


class Account(BaseModel):
    """
    External identity provider account association.

    Responsibilities (Single Responsibility Principle):
    - Link user to external OAuth providers (Microsoft, Google, etc.)
    - Store provider-specific tokens and identifiers
    - Track provider authentication sessions

    Design Notes:
    - Supports multiple provider accounts per user
    - Tokens stored for API access and refresh
    - Last login tracking per provider
    - Cascade delete when user is removed
    """

    # === User Association ===
    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='accounts',
        db_index=True,
        help_text="User who owns this provider account"
    )

    # === Provider Information ===
    type = models.CharField(
        max_length=50,
        help_text="Account type (e.g., 'oauth', 'oidc')"
    )
    provider = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Identity provider name (e.g., 'microsoft', 'google')"
    )
    provider_account_id = models.CharField(
        max_length=255,
        db_index=True,
        help_text="User's unique identifier from provider"
    )

    # === OAuth Tokens ===
    refresh_token = models.TextField(
        null=True,
        blank=True,
        help_text="Token for obtaining new access tokens"
    )
    access_token = models.TextField(
        null=True,
        blank=True,
        help_text="Current access token for API calls"
    )
    expires_at = models.IntegerField(
        null=True,
        blank=True,
        help_text="Unix timestamp when access token expires"
    )
    token_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Token type (e.g., 'Bearer')"
    )
    scope = models.TextField(
        null=True,
        blank=True,
        help_text="Granted OAuth scopes"
    )

    # === OIDC Specific ===
    id_token = models.TextField(
        null=True,
        blank=True,
        help_text="OpenID Connect ID token"
    )
    session_state = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Provider session state identifier"
    )

    # === Session Tracking ===
    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Last successful authentication via this provider"
    )

    class Meta:
        db_table = 'accounts'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['-last_login_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['provider']),
            models.Index(fields=['provider_account_id']),
            models.Index(fields=['last_login_at']),
            models.Index(fields=['deleted_at']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'provider_account_id'],
                name='unique_provider_account'
            )
        ]

    def __str__(self):
        return f"{self.provider} - {self.user.email}"

    def __repr__(self):
        return f"<Account: {self.provider} for {self.user.email}>"

    @property
    def is_token_expired(self) -> bool:
        """Check if access token has expired."""
        if not self.expires_at:
            return True
        current_timestamp = int(timezone.now().timestamp())
        return current_timestamp >= self.expires_at

    @property
    def needs_refresh(self) -> bool:
        """Check if token should be refreshed (expired and refresh token available)."""
        return self.is_token_expired and bool(self.refresh_token)

    def update_tokens(
        self,
        access_token: str,
        refresh_token: str = None,
        expires_at: int = None,
        **kwargs
    ) -> None:
        """
        Update OAuth tokens from provider response.

        Args:
            access_token: New access token
            refresh_token: New refresh token (optional)
            expires_at: Token expiration timestamp (optional)
            **kwargs: Additional token metadata
        """
        self.access_token = access_token
        if refresh_token:
            self.refresh_token = refresh_token
        if expires_at:
            self.expires_at = expires_at

        # Update additional fields from kwargs
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

        self.save()

    def record_login(self) -> None:
        """Record successful authentication via this provider."""
        self.last_login_at = timezone.now()
        self.save(update_fields=['last_login_at', 'updated_at'])

    def revoke_tokens(self) -> None:
        """Clear stored tokens (for security or logout)."""
        self.access_token = None
        self.refresh_token = None
        self.expires_at = None
        self.save(update_fields=['access_token', 'refresh_token', 'expires_at', 'updated_at'])
