"""Tests for PersonService."""
import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import date
from apps.persons.models import Person
from apps.persons.services.person_service import PersonService
from apps.authentication.models import User, Profile
from apps.clients.models import Client
from axis_backend.enums import PersonType, WorkStatus, StaffRole, BaseStatus, RelationType


@pytest.mark.django_db
class TestPersonService(TestCase):
    """Test cases for PersonService."""

    def setUp(self):
        """Set up test data."""
        self.service = PersonService()

        # Create test user and profile
        self.user = User.objects.create(
            email="test@example.com",
            username="testuser"
        )
        self.profile = Profile.objects.create(
            user=self.user,
            full_name="Test User",
            dob=date(1990, 1, 1),
            gender="M"
        )

        # Create test client
        self.client = Client.objects.create(
            name="Test Client",
            status=BaseStatus.ACTIVE
        )

    def tearDown(self):
        """Clean up test data."""
        Person.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()
        Client.objects.all().delete()

    def test_create_employee_success(self):
        """Test successful employee creation."""
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        self.assertIsNotNone(employee.id)
        self.assertEqual(employee.person_type, PersonType.EMPLOYEE)
        self.assertEqual(employee.employee_role, StaffRole.STAFF)
        self.assertEqual(employee.status, BaseStatus.ACTIVE)

    def test_create_employee_missing_required_field(self):
        """Test employee creation with missing required fields."""
        with self.assertRaises(ValidationError) as context:
            self.service.create_employee(
                profile_id=None,
                user_id=str(self.user.id),
                client_id=str(self.client.id),
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1)
            )

        self.assertIn('error', str(context.exception))

    def test_create_employee_duplicate_profile(self):
        """Test employee creation with duplicate profile."""
        # Create first employee
        self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Try to create second employee with same profile
        with self.assertRaises(ValidationError) as context:
            self.service.create_employee(
                profile_id=str(self.profile.id),
                user_id=str(self.user.id),
                client_id=str(self.client.id),
                employee_role=StaffRole.ADMIN,
                employment_start_date=date(2021, 1, 1)
            )

        self.assertIn('profile_id', str(context.exception))

    def test_create_employee_inactive_client(self):
        """Test employee creation with inactive client."""
        inactive_client = Client.objects.create(
            name="Inactive Client",
            status=BaseStatus.INACTIVE
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_employee(
                profile_id=str(self.profile.id),
                user_id=str(self.user.id),
                client_id=str(inactive_client.id),
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1)
            )

        self.assertIn('client', str(context.exception))

    def test_create_dependent_success(self):
        """Test successful dependent creation."""
        # Create employee first
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create dependent
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )

        dependent = self.service.create_dependent(
            profile_id=str(dep_profile.id),
            user_id=str(dep_user.id),
            primary_employee_id=str(employee.id),
            relationship_to_employee=RelationType.CHILD
        )

        self.assertIsNotNone(dependent.id)
        self.assertEqual(dependent.person_type, PersonType.DEPENDENT)
        self.assertEqual(dependent.primary_employee_id, employee.id)
        self.assertEqual(dependent.relationship_to_employee, RelationType.CHILD)

    def test_create_dependent_missing_employee(self):
        """Test dependent creation without primary employee."""
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_dependent(
                profile_id=str(dep_profile.id),
                user_id=str(dep_user.id),
                primary_employee_id=None,
                relationship_to_employee=RelationType.CHILD
            )

        self.assertIn('error', str(context.exception))

    def test_create_dependent_inactive_employee(self):
        """Test dependent creation with inactive employee."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Deactivate employee
        self.service.deactivate_person(str(employee.id))

        # Try to create dependent
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_dependent(
                profile_id=str(dep_profile.id),
                user_id=str(dep_user.id),
                primary_employee_id=str(employee.id),
                relationship_to_employee=RelationType.CHILD
            )

        self.assertIn('employee', str(context.exception))

    def test_create_dependent_requires_guardian_for_minor(self):
        """Test dependent creation requires guardian for minors."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create minor dependent (under 18)
        dep_user = User.objects.create(
            email="minor@example.com",
            username="minor"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Minor Dependent",
            dob=date.today().replace(year=date.today().year - 10)  # 10 years old
        )

        with self.assertRaises(ValidationError) as context:
            self.service.create_dependent(
                profile_id=str(dep_profile.id),
                user_id=str(dep_user.id),
                primary_employee_id=str(employee.id),
                relationship_to_employee=RelationType.CHILD,
                guardian_id=None
            )

        self.assertIn('guardian', str(context.exception))

    def test_get_eligible_persons(self):
        """Test get_eligible_persons method."""
        # Create employee
        self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        result = self.service.get_eligible_persons(page=1, page_size=10)

        self.assertGreater(result['count'], 0)
        self.assertIn('results', result)
        self.assertIn('page', result)
        self.assertIn('page_size', result)

    def test_get_family_members(self):
        """Test get_family_members method."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create dependents
        for i in range(2):
            dep_user = User.objects.create(
                email=f"dependent{i}@example.com",
                username=f"dependent{i}"
            )
            dep_profile = Profile.objects.create(
                user=dep_user,
                full_name=f"Dependent {i}",
                dob=date(2010, 1, 1)
            )
            self.service.create_dependent(
                profile_id=str(dep_profile.id),
                user_id=str(dep_user.id),
                primary_employee_id=str(employee.id),
                relationship_to_employee=RelationType.CHILD
            )

        result = self.service.get_family_members(str(employee.id))

        self.assertEqual(result['employee'].id, employee.id)
        self.assertEqual(len(result['dependents']), 2)
        self.assertEqual(result['total_members'], 3)

    def test_get_family_members_non_employee(self):
        """Test get_family_members with non-employee."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create dependent
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )
        dependent = self.service.create_dependent(
            profile_id=str(dep_profile.id),
            user_id=str(dep_user.id),
            primary_employee_id=str(employee.id),
            relationship_to_employee=RelationType.CHILD
        )

        # Try to get family members for dependent
        with self.assertRaises(ValidationError) as context:
            self.service.get_family_members(str(dependent.id))

        self.assertIn('employee', str(context.exception).lower())

    def test_get_employees_by_client(self):
        """Test get_employees_by_client method."""
        # Create employees
        for i in range(3):
            user = User.objects.create(
                email=f"emp{i}@example.com",
                username=f"emp{i}"
            )
            profile = Profile.objects.create(
                user=user,
                full_name=f"Employee {i}",
                dob=date(1990, 1, 1)
            )
            self.service.create_employee(
                profile_id=str(profile.id),
                user_id=str(user.id),
                client_id=str(self.client.id),
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1)
            )

        result = self.service.get_employees_by_client(
            client_id=str(self.client.id),
            page=1,
            page_size=10
        )

        self.assertGreaterEqual(result['count'], 3)
        for employee in result['results']:
            self.assertEqual(employee.client_id, self.client.id)

    def test_get_employees_by_client_with_status_filter(self):
        """Test get_employees_by_client with status filter."""
        # Create active and inactive employees
        for i, status in enumerate([WorkStatus.ACTIVE, WorkStatus.TERMINATED]):
            user = User.objects.create(
                email=f"emp_status{i}@example.com",
                username=f"emp_status{i}"
            )
            profile = Profile.objects.create(
                user=user,
                full_name=f"Employee Status {i}",
                dob=date(1990, 1, 1)
            )
            self.service.create_employee(
                profile_id=str(profile.id),
                user_id=str(user.id),
                client_id=str(self.client.id),
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1),
                employment_status=status
            )

        result = self.service.get_employees_by_client(
            client_id=str(self.client.id),
            status=WorkStatus.ACTIVE,
            page=1,
            page_size=10
        )

        for employee in result['results']:
            self.assertEqual(employee.employment_status, WorkStatus.ACTIVE)

    def test_activate_person(self):
        """Test activate_person method."""
        # Create inactive employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Deactivate first
        self.service.deactivate_person(str(employee.id))

        # Activate
        activated = self.service.activate_person(str(employee.id))

        self.assertEqual(activated.status, BaseStatus.ACTIVE)

    def test_deactivate_person(self):
        """Test deactivate_person method."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Deactivate
        deactivated = self.service.deactivate_person(
            str(employee.id),
            reason="Test deactivation"
        )

        self.assertEqual(deactivated.status, BaseStatus.INACTIVE)

    def test_deactivate_employee_with_active_dependents(self):
        """Test cannot deactivate employee with active dependents."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create dependent
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )
        self.service.create_dependent(
            profile_id=str(dep_profile.id),
            user_id=str(dep_user.id),
            primary_employee_id=str(employee.id),
            relationship_to_employee=RelationType.CHILD
        )

        # Try to deactivate employee
        with self.assertRaises(ValidationError) as context:
            self.service.deactivate_person(str(employee.id))

        self.assertIn('dependent', str(context.exception).lower())

    def test_update_employment_status(self):
        """Test update_employment_status method."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        # Update status
        updated = self.service.update_employment_status(
            str(employee.id),
            WorkStatus.ON_LEAVE,
            None
        )

        self.assertEqual(updated.employment_status, WorkStatus.ON_LEAVE)

    def test_update_employment_status_with_end_date(self):
        """Test update_employment_status with end date."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        # Update status to terminated
        end_date = date(2023, 12, 31)
        updated = self.service.update_employment_status(
            str(employee.id),
            WorkStatus.TERMINATED,
            end_date
        )

        self.assertEqual(updated.employment_status, WorkStatus.TERMINATED)
        self.assertEqual(updated.employment_end_date, end_date)
        self.assertEqual(updated.status, BaseStatus.INACTIVE)

    def test_update_employment_status_non_employee(self):
        """Test update_employment_status for non-employee."""
        # Create employee
        employee = self.service.create_employee(
            profile_id=str(self.profile.id),
            user_id=str(self.user.id),
            client_id=str(self.client.id),
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create dependent
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )
        dependent = self.service.create_dependent(
            profile_id=str(dep_profile.id),
            user_id=str(dep_user.id),
            primary_employee_id=str(employee.id),
            relationship_to_employee=RelationType.CHILD
        )

        # Try to update employment status for dependent
        with self.assertRaises(ValidationError) as context:
            self.service.update_employment_status(
                str(dependent.id),
                WorkStatus.ON_LEAVE,
                None
            )

        self.assertIn('employee', str(context.exception).lower())
