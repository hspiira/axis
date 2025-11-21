"""User model - core authentication and authorization entity."""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

from axis_backend.utils import generate_cuid
from axis_backend.enums import UserStatus, Language


class UserManager(BaseUserManager):
    """
    Custom manager for User model.

    Responsibilities:
    - Handle user creation with CUID primary keys
    - Provide superuser creation utility
    - Support email-based authentication
    """

    def create_user(self, email, password=None, **extra_fields):
        """Create and save regular user with email and password."""
        if not email:
            raise ValueError('Email address is required')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save superuser with admin privileges."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('status', UserStatus.ACTIVE)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Core user entity with authentication and profile information.

    Responsibilities (Single Responsibility Principle):
    - Manage authentication credentials and sessions
    - Track user status and access control
    - Store user preferences and settings
    - Maintain account security features (2FA, verification)

    Design Notes:
    - Extends Django AbstractUser for auth compatibility
    - CUID primary key for consistent ID strategy across system
    - Status field enables account lifecycle management
    - Email is primary identifier (username optional)
    - Metadata enables feature extension without migrations
    """

    # Override primary key with CUID
    id = models.CharField(
        primary_key=True,
        default=generate_cuid,
        editable=False,
        max_length=25
    )

    # Make username optional (email is primary identifier)
    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True,
        help_text="Optional username for display"
    )

    # === Core Authentication ===
    email = models.EmailField(
        unique=True,
        db_index=True,
        help_text="Primary email address for authentication"
    )
    password = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="Hashed password (null for OAuth-only accounts)"
    )
    email_verified = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when email was verified"
    )

    # === Session Tracking ===
    last_login_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Most recent successful login"
    )

    # === User Preferences ===
    preferred_language = models.CharField(
        max_length=20,
        choices=Language.choices,
        null=True,
        blank=True,
        help_text="Interface language preference"
    )
    timezone = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="IANA timezone for localization"
    )

    # === Security Features ===
    is_two_factor_enabled = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Two-factor authentication enabled"
    )

    # === Account Status ===
    status = models.CharField(
        max_length=30,
        choices=UserStatus.choices,
        default=UserStatus.PENDING_VERIFICATION,
        db_index=True,
        help_text="Account lifecycle state"
    )
    status_changed_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Timestamp of last status change"
    )

    # === Status Reasons (for compliance and audit) ===
    inactive_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Explanation if status is INACTIVE"
    )
    suspension_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Explanation if status is SUSPENDED"
    )
    ban_reason = models.TextField(
        null=True,
        blank=True,
        help_text="Explanation if status is BANNED"
    )

    # === Additional Data ===
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Flexible storage for custom user attributes"
    )

    # === Soft Delete Support ===
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Soft deletion timestamp"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )

    # Use custom manager
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is USERNAME_FIELD, so not needed here

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['last_login_at']),
            models.Index(fields=['is_two_factor_enabled']),
            models.Index(fields=['status_changed_at']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.email

    def __repr__(self):
        return f"<User: {self.email} ({self.status})>"

    # === Status Query Properties ===

    @property
    def is_email_verified(self) -> bool:
        """Check if email has been verified."""
        return self.email_verified is not None

    @property
    def is_account_active(self) -> bool:
        """Check if account is in active state."""
        return self.status == UserStatus.ACTIVE and self.deleted_at is None

    @property
    def requires_verification(self) -> bool:
        """Check if account is pending email verification."""
        return self.status == UserStatus.PENDING_VERIFICATION

    # === Account Management Methods ===

    def verify_email(self) -> None:
        """Mark email as verified and activate account if pending."""
        self.email_verified = timezone.now()
        if self.status == UserStatus.PENDING_VERIFICATION:
            self.activate()
        else:
            self.save(update_fields=['email_verified', 'updated_at'])

    def activate(self) -> None:
        """Activate user account."""
        old_status = self.status
        self.status = UserStatus.ACTIVE
        self.status_changed_at = timezone.now()
        self.inactive_reason = None
        self._track_status_change(old_status, UserStatus.ACTIVE)
        self.save(update_fields=['status', 'status_changed_at', 'inactive_reason', 'metadata', 'updated_at'])

    def suspend(self, reason: str) -> None:
        """
        Suspend user account temporarily.

        Args:
            reason: Required explanation for suspension
        """
        old_status = self.status
        self.status = UserStatus.SUSPENDED
        self.status_changed_at = timezone.now()
        self.suspension_reason = reason
        self._track_status_change(old_status, UserStatus.SUSPENDED, reason)
        self.save(update_fields=['status', 'status_changed_at', 'suspension_reason', 'metadata', 'updated_at'])

    def ban(self, reason: str) -> None:
        """
        Permanently ban user account.

        Args:
            reason: Required explanation for ban
        """
        old_status = self.status
        self.status = UserStatus.BANNED
        self.status_changed_at = timezone.now()
        self.ban_reason = reason
        self._track_status_change(old_status, UserStatus.BANNED, reason)
        self.save(update_fields=['status', 'status_changed_at', 'ban_reason', 'metadata', 'updated_at'])

    def deactivate(self, reason: str = None) -> None:
        """
        Deactivate user account.

        Args:
            reason: Optional explanation for deactivation
        """
        old_status = self.status
        self.status = UserStatus.INACTIVE
        self.status_changed_at = timezone.now()
        if reason:
            self.inactive_reason = reason
        self._track_status_change(old_status, UserStatus.INACTIVE, reason)
        self.save(update_fields=['status', 'status_changed_at', 'inactive_reason', 'metadata', 'updated_at'])

    def enable_two_factor(self) -> None:
        """Enable two-factor authentication."""
        self.is_two_factor_enabled = True
        self.save(update_fields=['is_two_factor_enabled', 'updated_at'])

    def disable_two_factor(self) -> None:
        """Disable two-factor authentication."""
        self.is_two_factor_enabled = False
        self.save(update_fields=['is_two_factor_enabled', 'updated_at'])

    def record_login(self) -> None:
        """Update last login timestamp."""
        self.last_login_at = timezone.now()
        self.save(update_fields=['last_login_at'])

    # === Soft Delete Methods ===

    def soft_delete(self) -> None:
        """Soft delete user account."""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=['deleted_at', 'is_active', 'updated_at'])

    def restore(self) -> None:
        """Restore soft-deleted user account."""
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])

    # === Helper Methods ===

    def _track_status_change(self, from_status: str, to_status: str, reason: str = None) -> None:
        """
        Record status transition in metadata for audit trail.

        Args:
            from_status: Previous status value
            to_status: New status value
            reason: Optional explanation for change
        """
        if self.metadata is None:
            self.metadata = {}

        if 'status_history' not in self.metadata:
            self.metadata['status_history'] = []

        self.metadata['status_history'].append({
            'from': from_status,
            'to': to_status,
            'reason': reason,
            'changed_at': timezone.now().isoformat()
        })
