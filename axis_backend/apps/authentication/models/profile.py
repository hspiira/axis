"""Profile model - personal information for users, staff, and beneficiaries."""
from django.db import models
from django.core.validators import RegexValidator

from axis_backend.models import BaseModel
from axis_backend.enums import Gender, Language, ContactMethod


class Profile(BaseModel):
    """
    Personal profile information entity.

    Responsibilities (Single Responsibility Principle):
    - Store personal demographic information
    - Manage contact details and preferences
    - Support emergency contact information
    - Link to User, Staff, or Beneficiary entities

    Design Notes:
    - One-to-one relationships with User, Staff, and Beneficiary
    - User relationship is optional to support profiles without login accounts
    - Separate from User model to follow Interface Segregation (auth vs profile data)
    - Phone validation ensures consistent format
    """

    # === Basic Information ===
    full_name = models.CharField(
        max_length=255,
        help_text="Complete legal name"
    )
    preferred_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="Preferred name or nickname for informal use"
    )
    dob = models.DateField(
        null=True,
        blank=True,
        help_text="Date of birth"
    )
    gender = models.CharField(
        max_length=20,
        choices=Gender.choices,
        null=True,
        blank=True,
        help_text="Gender identification"
    )

    # === Contact Information ===
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be in format: '+999999999'. Up to 15 digits allowed."
    )
    phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        null=True,
        blank=True,
        help_text="Primary phone number"
    )
    email = models.EmailField(
        null=True,
        blank=True,
        help_text="Primary email address"
    )
    address = models.TextField(
        null=True,
        blank=True,
        help_text="Residential or mailing address"
    )

    # === Emergency Contact ===
    emergency_contact_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Emergency contact person full name"
    )
    emergency_contact_phone = models.CharField(
        validators=[phone_regex],
        max_length=17,
        null=True,
        blank=True,
        help_text="Emergency contact phone number"
    )
    emergency_contact_email = models.EmailField(
        null=True,
        blank=True,
        help_text="Emergency contact email address"
    )

    # === Preferences ===
    preferred_language = models.CharField(
        max_length=20,
        choices=Language.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Preferred communication language"
    )
    preferred_contact_method = models.CharField(
        max_length=20,
        choices=ContactMethod.choices,
        null=True,
        blank=True,
        db_index=True,
        help_text="Preferred contact channel"
    )

    # === Additional Information ===
    image = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="Profile photo URL"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional profile attributes"
    )

    # === Relationships ===
    user = models.OneToOneField(
        'authentication.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='profile',
        help_text="Associated user account (optional)"
    )

    class Meta:
        db_table = 'profiles'
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'
        ordering = ['full_name']
        indexes = [
            models.Index(fields=['full_name']),
            models.Index(fields=['preferred_language']),
            models.Index(fields=['preferred_contact_method']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.preferred_name or self.full_name

    def __repr__(self):
        return f"<Profile: {self.full_name}>"

    @property
    def display_name(self) -> str:
        """Get display name with fallback to full name."""
        return self.preferred_name or self.full_name

    @property
    def age(self) -> int | None:
        """Calculate age from date of birth."""
        if not self.dob:
            return None
        from django.utils import timezone
        today = timezone.now().date()
        return today.year - self.dob.year - (
            (today.month, today.day) < (self.dob.month, self.dob.day)
        )

    @property
    def has_emergency_contact(self) -> bool:
        """Check if emergency contact information is complete."""
        return bool(
            self.emergency_contact_name and
            (self.emergency_contact_phone or self.emergency_contact_email)
        )

    def get_primary_contact(self) -> dict:
        """
        Retrieve primary contact information.

        Returns:
            dict: Contact details with method preference
        """
        return {
            'name': self.display_name,
            'email': self.email,
            'phone': self.phone,
            'method': self.preferred_contact_method,
            'language': self.preferred_language
        }

    def get_emergency_contact(self) -> dict | None:
        """
        Retrieve emergency contact information.

        Returns:
            dict: Emergency contact details or None if not available
        """
        if not self.has_emergency_contact:
            return None

        return {
            'name': self.emergency_contact_name,
            'email': self.emergency_contact_email,
            'phone': self.emergency_contact_phone
        }
