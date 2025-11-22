"""Comprehensive tests for ServiceAssignment model."""
from datetime import date, timedelta
from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.authentication.models import User, Profile
from apps.persons.models import Person
from apps.clients.models import Client
from apps.contracts.models import Contract
from apps.services_app.models import ServiceCategory, Service, ServiceAssignment
from axis_backend.enums import (
    BaseStatus, AssignmentStatus, Frequency, UserStatus,
    Gender, Language, PersonType, ContractStatus
)


class ServiceAssignmentModelTestCase(TestCase):
    """Test ServiceAssignment model fields, properties, and methods."""

    def setUp(self):
        """Set up test data."""
        # Create user and profile
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            status=UserStatus.ACTIVE
        )
        self.profile = Profile.objects.create(
            user=self.user,
            full_name='John Doe',
            dob=date(1985, 5, 15),
            gender=Gender.MALE,
            preferred_language=Language.ENGLISH
        )

        # Create client
        self.client = Client.objects.create(
            name='ABC Corporation',
            contact_email='contact@abc.com',
            status=BaseStatus.ACTIVE
        )

        # Create person
        self.person = Person.objects.create(
            profile=self.profile,
            user=self.user,
            person_type=PersonType.EMPLOYEE,
            client=self.client
        )

        # Create contract
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            status=ContractStatus.ACTIVE,
            coverage_limit=100000,
            employee_count=100
        )

        # Create category and service
        self.category = ServiceCategory.objects.create(
            name='Counseling',
            description='Mental health counseling'
        )
        self.service = Service.objects.create(
            name='Individual Counseling',
            category=self.category,
            status=BaseStatus.ACTIVE
        )

        # Create service assignment
        self.assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            status=AssignmentStatus.PENDING,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=180),
            frequency=Frequency.WEEKLY
        )

    def tearDown(self):
        """Clean up test data."""
        # Delete in correct order to avoid FK constraint violations
        ServiceAssignment.objects.all().delete()
        Person.objects.all().delete()
        Contract.objects.all().delete()
        Service.objects.all().delete()
        ServiceCategory.objects.all().delete()
        Client.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()

    def test_assignment_creation_success(self):
        """Test creating a service assignment."""
        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            status=AssignmentStatus.ONGOING,
            start_date=date.today(),
            frequency=Frequency.MONTHLY
        )
        self.assertEqual(assignment.service, self.service)
        self.assertEqual(assignment.contract, self.contract)
        self.assertEqual(assignment.client, self.client)
        self.assertEqual(assignment.status, AssignmentStatus.ONGOING)
        self.assertEqual(assignment.frequency, Frequency.MONTHLY)
        self.assertIsNotNone(assignment.id)
        self.assertIsNotNone(assignment.created_at)

    def test_assignment_service_required(self):
        """Test that service field is required."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                contract=self.contract,
                client=self.client,
                start_date=date.today(),
                frequency=Frequency.WEEKLY
            )
            assignment.full_clean()

    def test_assignment_contract_required(self):
        """Test that contract field is required."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                service=self.service,
                client=self.client,
                start_date=date.today(),
                frequency=Frequency.WEEKLY
            )
            assignment.full_clean()

    def test_assignment_client_required(self):
        """Test that client field is required."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                service=self.service,
                contract=self.contract,
                start_date=date.today(),
                frequency=Frequency.WEEKLY
            )
            assignment.full_clean()

    def test_assignment_start_date_required(self):
        """Test that start_date field is required."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                service=self.service,
                contract=self.contract,
                client=self.client,
                frequency=Frequency.WEEKLY
            )
            assignment.full_clean()

    def test_assignment_frequency_required(self):
        """Test that frequency field is required."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                service=self.service,
                contract=self.contract,
                client=self.client,
                start_date=date.today()
            )
            assignment.full_clean()

    def test_assignment_status_default(self):
        """Test that status defaults to PENDING."""
        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=date.today(),
            frequency=Frequency.WEEKLY
        )
        self.assertEqual(assignment.status, AssignmentStatus.PENDING)

    def test_assignment_status_choices(self):
        """Test all valid status choices."""
        for status in [AssignmentStatus.PENDING, AssignmentStatus.ONGOING,
                       AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]:
            assignment = ServiceAssignment.objects.create(
                service=self.service,
                contract=self.contract,
                client=self.client,
                start_date=date.today(),
                frequency=Frequency.WEEKLY,
                status=status
            )
            self.assertEqual(assignment.status, status)

    def test_assignment_frequency_choices(self):
        """Test all valid frequency choices."""
        for frequency in [Frequency.ONCE, Frequency.WEEKLY, Frequency.MONTHLY,
                          Frequency.QUARTERLY, Frequency.ANNUALLY]:
            assignment = ServiceAssignment.objects.create(
                service=self.service,
                contract=self.contract,
                client=self.client,
                start_date=date.today(),
                frequency=frequency
            )
            self.assertEqual(assignment.frequency, frequency)

    def test_assignment_end_date_optional(self):
        """Test that end_date is optional."""
        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=date.today(),
            frequency=Frequency.WEEKLY,
            end_date=None
        )
        self.assertIsNone(assignment.end_date)

    def test_assignment_end_date_validation(self):
        """Test that end_date must be after start_date."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                service=self.service,
                contract=self.contract,
                client=self.client,
                start_date=date.today(),
                end_date=date.today() - timedelta(days=1),
                frequency=Frequency.WEEKLY
            )
            assignment.full_clean()

    def test_assignment_same_start_end_date_invalid(self):
        """Test that start and end date cannot be the same."""
        with self.assertRaises(ValidationError):
            assignment = ServiceAssignment(
                service=self.service,
                contract=self.contract,
                client=self.client,
                start_date=date.today(),
                end_date=date.today(),
                frequency=Frequency.WEEKLY
            )
            assignment.full_clean()

    def test_assignment_metadata_defaults_to_dict(self):
        """Test that metadata defaults to empty dict."""
        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=date.today(),
            frequency=Frequency.WEEKLY
        )
        self.assertEqual(assignment.metadata, {})

    def test_assignment_metadata_storage(self):
        """Test storing metadata."""
        metadata = {
            'notes': 'Special requirements for this assignment',
            'priority': 'high',
            'max_sessions': 10
        }
        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=date.today(),
            frequency=Frequency.WEEKLY,
            metadata=metadata
        )
        self.assertEqual(assignment.metadata['notes'], 'Special requirements for this assignment')
        self.assertEqual(assignment.metadata['priority'], 'high')
        self.assertEqual(assignment.metadata['max_sessions'], 10)

    def test_assignment_string_representation(self):
        """Test __str__ method."""
        expected = f'{self.service.name} for {self.client.name}'
        self.assertEqual(str(self.assignment), expected)

    def test_assignment_ordering(self):
        """Test that assignments are ordered by start_date (descending)."""
        today = date.today()

        assignment1 = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=today - timedelta(days=10),
            frequency=Frequency.WEEKLY
        )
        assignment2 = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=today - timedelta(days=5),
            frequency=Frequency.WEEKLY
        )

        assignments = list(ServiceAssignment.objects.all())
        # Most recent first
        self.assertEqual(assignments[0], self.assignment)  # today
        self.assertEqual(assignments[1], assignment2)  # today - 5
        self.assertEqual(assignments[2], assignment1)  # today - 10

    def test_related_service_access(self):
        """Test accessing service via foreign key."""
        self.assertEqual(self.assignment.service.name, 'Individual Counseling')

    def test_related_contract_access(self):
        """Test accessing contract via foreign key."""
        self.assertEqual(self.assignment.contract.client, self.client)

    def test_related_client_access(self):
        """Test accessing client via foreign key."""
        self.assertEqual(self.assignment.client.name, 'ABC Corporation')

    def test_service_assignments_reverse_relationship(self):
        """Test reverse relationship from service to assignments."""
        assignment2 = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=date.today() + timedelta(days=10),
            frequency=Frequency.MONTHLY
        )

        assignments = list(self.service.assignments.all())
        self.assertEqual(len(assignments), 2)
        self.assertIn(self.assignment, assignments)
        self.assertIn(assignment2, assignments)

    def test_contract_assignments_reverse_relationship(self):
        """Test reverse relationship from contract to assignments."""
        assignments = list(self.contract.service_assignments.all())
        self.assertEqual(len(assignments), 1)
        self.assertEqual(assignments[0], self.assignment)

    def test_client_assignments_reverse_relationship(self):
        """Test reverse relationship from client to assignments."""
        assignments = list(self.client.service_assignments.all())
        self.assertEqual(len(assignments), 1)
        self.assertEqual(assignments[0], self.assignment)

    def test_soft_delete_assignment(self):
        """Test soft delete functionality."""
        self.assertIsNone(self.assignment.deleted_at)
        self.assignment.soft_delete()
        self.assertIsNotNone(self.assignment.deleted_at)

    def test_restore_assignment(self):
        """Test restore functionality."""
        self.assignment.soft_delete()
        self.assertIsNotNone(self.assignment.deleted_at)
        self.assignment.restore()
        self.assertIsNone(self.assignment.deleted_at)

    def test_assignment_update(self):
        """Test updating assignment fields."""
        original_updated_at = self.assignment.updated_at

        self.assignment.status = AssignmentStatus.ONGOING
        self.assignment.frequency = Frequency.MONTHLY
        self.assignment.save()

        updated = ServiceAssignment.objects.get(id=self.assignment.id)
        self.assertEqual(updated.status, AssignmentStatus.ONGOING)
        self.assertEqual(updated.frequency, Frequency.MONTHLY)
        self.assertGreater(updated.updated_at, original_updated_at)

    def test_cascade_protect_on_service_delete(self):
        """Test that assignment prevents service deletion."""
        with self.assertRaises(Exception):
            self.service.delete()

    def test_cascade_protect_on_contract_delete(self):
        """Test that assignment prevents contract deletion."""
        with self.assertRaises(Exception):
            self.contract.delete()

    def test_cascade_protect_on_client_delete(self):
        """Test that assignment prevents client deletion."""
        with self.assertRaises(Exception):
            self.client.delete()

    def test_assignment_with_future_dates(self):
        """Test assignment with future start and end dates."""
        future_start = date.today() + timedelta(days=30)
        future_end = date.today() + timedelta(days=180)

        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=future_start,
            end_date=future_end,
            frequency=Frequency.MONTHLY
        )
        self.assertEqual(assignment.start_date, future_start)
        self.assertEqual(assignment.end_date, future_end)

    def test_assignment_metadata_complex(self):
        """Test complex metadata storage and retrieval."""
        metadata = {
            'approval_workflow': {
                'approved_by': 'manager@abc.com',
                'approval_date': '2024-01-15'
            },
            'billing_info': {
                'cost_center': 'HR-001',
                'budget_code': 'EAP-2024'
            },
            'restrictions': ['after_hours_only', 'telehealth_preferred']
        }
        assignment = ServiceAssignment.objects.create(
            service=self.service,
            contract=self.contract,
            client=self.client,
            start_date=date.today(),
            frequency=Frequency.WEEKLY,
            metadata=metadata
        )

        retrieved = ServiceAssignment.objects.get(id=assignment.id)
        self.assertEqual(retrieved.metadata['approval_workflow']['approved_by'], 'manager@abc.com')
        self.assertEqual(retrieved.metadata['billing_info']['cost_center'], 'HR-001')
        self.assertEqual(len(retrieved.metadata['restrictions']), 2)
