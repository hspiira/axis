"""Comprehensive tests for Profile model."""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date

from apps.authentication.models import User, Profile
from axis_backend.enums import Gender, Language, ContactMethod, UserStatus


class ProfileModelTestCase(TestCase):
    """Test Profile model fields and basic functionality."""

    def setUp(self):
        """Set up test user and profile."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.profile = Profile.objects.create(
            user=self.user,
            full_name='John Doe',
            dob=date(1990, 1, 15),
            gender=Gender.MALE
        )

    def test_profile_creation_generates_cuid(self):
        """Test that profile ID is auto-generated as CUID."""
        self.assertIsNotNone(self.profile.id)
        self.assertTrue(len(self.profile.id) > 0)
        self.assertTrue(isinstance(self.profile.id, str))

    def test_profile_string_representation(self):
        """Test Profile __str__ returns full_name."""
        self.assertEqual(str(self.profile), 'John Doe')

    def test_profile_repr(self):
        """Test Profile __repr__ includes full name."""
        repr_str = repr(self.profile)
        self.assertIn('John Doe', repr_str)

    def test_profile_with_preferred_name(self):
        """Test that __str__ returns preferred_name when set."""
        self.profile.preferred_name = 'Johnny'
        self.profile.save()
        self.assertEqual(str(self.profile), 'Johnny')

    def test_profile_one_to_one_with_user(self):
        """Test one-to-one relationship with User."""
        self.assertEqual(self.user.profile, self.profile)
        self.assertEqual(self.profile.user, self.user)

    def test_profile_without_user(self):
        """Test creating profile without user (optional relationship)."""
        profile = Profile.objects.create(
            full_name='Jane Doe',
            dob=date(1992, 5, 20),
            gender=Gender.FEMALE
        )
        self.assertIsNone(profile.user)

    def test_profile_cascade_delete_with_user(self):
        """Test that profile is deleted when user is deleted."""
        user_id = self.user.id
        profile_id = self.profile.id

        self.user.delete()

        self.assertFalse(User.objects.filter(id=user_id).exists())
        self.assertFalse(Profile.objects.filter(id=profile_id).exists())

    def test_metadata_defaults_to_dict(self):
        """Test that metadata field defaults to empty dict."""
        self.assertEqual(self.profile.metadata, {})

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.profile.created_at)
        self.assertIsNotNone(self.profile.updated_at)


class ProfileContactInformationTestCase(TestCase):
    """Test Profile contact information fields."""

    def test_profile_with_phone(self):
        """Test creating profile with valid phone number."""
        profile = Profile.objects.create(
            full_name='John Doe',
            phone='+1234567890'
        )
        self.assertEqual(profile.phone, '+1234567890')

    def test_profile_with_international_phone(self):
        """Test creating profile with international phone."""
        profile = Profile.objects.create(
            full_name='John Doe',
            phone='+441234567890'
        )
        self.assertEqual(profile.phone, '+441234567890')

    def test_profile_with_invalid_phone_format(self):
        """Test that invalid phone format raises validation error."""
        profile = Profile(
            full_name='John Doe',
            phone='invalid'
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_profile_with_email(self):
        """Test creating profile with email."""
        profile = Profile.objects.create(
            full_name='John Doe',
            email='john@example.com'
        )
        self.assertEqual(profile.email, 'john@example.com')

    def test_profile_with_address(self):
        """Test creating profile with address."""
        profile = Profile.objects.create(
            full_name='John Doe',
            address='123 Main St, City, State 12345'
        )
        self.assertEqual(profile.address, '123 Main St, City, State 12345')


class ProfileEmergencyContactTestCase(TestCase):
    """Test Profile emergency contact functionality."""

    def setUp(self):
        """Set up test profile."""
        self.profile = Profile.objects.create(
            full_name='John Doe'
        )

    def test_has_emergency_contact_false_by_default(self):
        """Test that has_emergency_contact is False without data."""
        self.assertFalse(self.profile.has_emergency_contact)

    def test_has_emergency_contact_with_name_and_phone(self):
        """Test has_emergency_contact True with name and phone."""
        self.profile.emergency_contact_name = 'Jane Doe'
        self.profile.emergency_contact_phone = '+1234567890'
        self.profile.save()
        self.assertTrue(self.profile.has_emergency_contact)

    def test_has_emergency_contact_with_name_and_email(self):
        """Test has_emergency_contact True with name and email."""
        self.profile.emergency_contact_name = 'Jane Doe'
        self.profile.emergency_contact_email = 'jane@example.com'
        self.profile.save()
        self.assertTrue(self.profile.has_emergency_contact)

    def test_has_emergency_contact_false_with_only_name(self):
        """Test has_emergency_contact False with only name."""
        self.profile.emergency_contact_name = 'Jane Doe'
        self.profile.save()
        self.assertFalse(self.profile.has_emergency_contact)

    def test_get_emergency_contact_returns_none_without_data(self):
        """Test get_emergency_contact returns None without complete data."""
        self.assertIsNone(self.profile.get_emergency_contact())

    def test_get_emergency_contact_returns_dict_with_data(self):
        """Test get_emergency_contact returns dict with complete data."""
        self.profile.emergency_contact_name = 'Jane Doe'
        self.profile.emergency_contact_phone = '+1234567890'
        self.profile.emergency_contact_email = 'jane@example.com'
        self.profile.save()

        contact = self.profile.get_emergency_contact()
        self.assertIsNotNone(contact)
        self.assertEqual(contact['name'], 'Jane Doe')
        self.assertEqual(contact['phone'], '+1234567890')
        self.assertEqual(contact['email'], 'jane@example.com')


class ProfilePropertiesTestCase(TestCase):
    """Test Profile model properties."""

    def setUp(self):
        """Set up test profile."""
        self.profile = Profile.objects.create(
            full_name='John Doe',
            preferred_name='Johnny',
            dob=date(1990, 1, 15)
        )

    def test_display_name_returns_preferred_name(self):
        """Test display_name returns preferred_name when set."""
        self.assertEqual(self.profile.display_name, 'Johnny')

    def test_display_name_falls_back_to_full_name(self):
        """Test display_name returns full_name when preferred_name is None."""
        self.profile.preferred_name = None
        self.profile.save()
        self.assertEqual(self.profile.display_name, 'John Doe')

    def test_age_calculated_correctly(self):
        """Test age property calculates age correctly."""
        # User born 1990-01-15
        expected_age = timezone.now().year - 1990
        # Adjust if birthday hasn't occurred this year
        today = timezone.now().date()
        if (today.month, today.day) < (1, 15):
            expected_age -= 1

        self.assertEqual(self.profile.age, expected_age)

    def test_age_none_without_dob(self):
        """Test age returns None when dob is not set."""
        profile = Profile.objects.create(full_name='Jane Doe')
        self.assertIsNone(profile.age)

    def test_age_on_birthday(self):
        """Test age calculation on exact birthday."""
        today = timezone.now().date()
        profile = Profile.objects.create(
            full_name='Birthday Person',
            dob=date(today.year - 25, today.month, today.day)
        )
        self.assertEqual(profile.age, 25)

    def test_age_day_before_birthday(self):
        """Test age calculation day before birthday."""
        today = timezone.now().date()
        # Born 25 years ago tomorrow
        if today.month == 12 and today.day == 31:
            # Special case: tomorrow is next year
            birth_year = today.year - 24
            birth_month = 1
            birth_day = 1
        elif today.day == 31:
            birth_year = today.year - 25
            birth_month = today.month + 1
            birth_day = 1
        else:
            birth_year = today.year - 25
            birth_month = today.month
            birth_day = today.day + 1

        profile = Profile.objects.create(
            full_name='Almost Birthday',
            dob=date(birth_year, birth_month, birth_day)
        )
        self.assertEqual(profile.age, 24)  # Still 24, birthday tomorrow


class ProfilePreferencesTestCase(TestCase):
    """Test Profile preference fields."""

    def test_profile_with_language_preference(self):
        """Test setting preferred_language."""
        profile = Profile.objects.create(
            full_name='John Doe',
            preferred_language=Language.SPANISH
        )
        self.assertEqual(profile.preferred_language, Language.SPANISH)

    def test_profile_with_contact_method_preference(self):
        """Test setting preferred_contact_method."""
        profile = Profile.objects.create(
            full_name='John Doe',
            preferred_contact_method=ContactMethod.EMAIL
        )
        self.assertEqual(profile.preferred_contact_method, ContactMethod.EMAIL)

    def test_get_primary_contact_returns_dict(self):
        """Test get_primary_contact returns contact information."""
        profile = Profile.objects.create(
            full_name='John Doe',
            email='john@example.com',
            phone='+1234567890',
            preferred_contact_method=ContactMethod.EMAIL,
            preferred_language=Language.ENGLISH
        )

        contact = profile.get_primary_contact()
        self.assertEqual(contact['name'], 'John Doe')
        self.assertEqual(contact['email'], 'john@example.com')
        self.assertEqual(contact['phone'], '+1234567890')
        self.assertEqual(contact['method'], ContactMethod.EMAIL)
        self.assertEqual(contact['language'], Language.ENGLISH)

    def test_get_primary_contact_with_preferred_name(self):
        """Test get_primary_contact uses preferred_name."""
        profile = Profile.objects.create(
            full_name='John Doe',
            preferred_name='Johnny',
            email='john@example.com'
        )

        contact = profile.get_primary_contact()
        self.assertEqual(contact['name'], 'Johnny')


class ProfileImageTestCase(TestCase):
    """Test Profile image field."""

    def test_profile_with_image_url(self):
        """Test creating profile with image URL."""
        profile = Profile.objects.create(
            full_name='John Doe',
            image='https://example.com/profile.jpg'
        )
        self.assertEqual(profile.image, 'https://example.com/profile.jpg')

    def test_profile_without_image(self):
        """Test creating profile without image."""
        profile = Profile.objects.create(full_name='John Doe')
        self.assertIsNone(profile.image)


class ProfileSoftDeleteTestCase(TestCase):
    """Test Profile soft delete functionality."""

    def setUp(self):
        """Set up test profile."""
        self.profile = Profile.objects.create(
            full_name='John Doe'
        )

    def test_soft_delete_sets_deleted_at(self):
        """Test soft_delete sets deleted_at timestamp."""
        self.assertIsNone(self.profile.deleted_at)
        self.profile.soft_delete()
        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.deleted_at)

    def test_restore_clears_deleted_at(self):
        """Test restore clears deleted_at timestamp."""
        self.profile.soft_delete()
        self.profile.restore()
        self.profile.refresh_from_db()
        self.assertIsNone(self.profile.deleted_at)
