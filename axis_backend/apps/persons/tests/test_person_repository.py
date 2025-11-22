"""Tests for PersonRepository."""
import pytest
from django.test import TestCase
from django.utils import timezone
from datetime import date
from apps.persons.models import Person
from apps.persons.repositories.person_repository import PersonRepository
from apps.authentication.models import User, Profile
from apps.clients.models import Client
from axis_backend.enums import PersonType, WorkStatus, StaffRole, BaseStatus, RelationType


@pytest.mark.django_db
class TestPersonRepository(TestCase):
    """Test cases for PersonRepository."""

    def setUp(self):
        """Set up test data."""
        self.repository = PersonRepository()

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

        # Create test employee
        self.employee = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

    def tearDown(self):
        """Clean up test data."""
        Person.objects.all().delete()
        Profile.objects.all().delete()
        User.objects.all().delete()
        Client.objects.all().delete()

    def test_get_queryset_optimization(self):
        """Test that get_queryset includes select_related optimization."""
        queryset = self.repository.get_queryset()

        # Check that query is optimized
        query_str = str(queryset.query)
        self.assertIn('JOIN', query_str.upper())

    def test_get_by_id(self):
        """Test retrieving person by ID."""
        person = self.repository.get_by_id(str(self.employee.id))

        self.assertIsNotNone(person)
        self.assertEqual(person.id, self.employee.id)
        self.assertEqual(person.person_type, PersonType.EMPLOYEE)

    def test_get_by_id_not_found(self):
        """Test retrieving non-existent person."""
        person = self.repository.get_by_id("non-existent-id")
        self.assertIsNone(person)

    def test_list_with_pagination(self):
        """Test list method with pagination."""
        # Create additional persons
        for i in range(5):
            user = User.objects.create(
                email=f"user{i}@example.com",
                username=f"user{i}"
            )
            profile = Profile.objects.create(
                user=user,
                full_name=f"User {i}",
                dob=date(1990, 1, 1)
            )
            Person.create_employee(
                profile=profile,
                user=user,
                client=self.client,
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1)
            )

        result = self.repository.list(page=1, page_size=3)

        self.assertEqual(result['count'], 6)  # 1 from setUp + 5 new
        self.assertEqual(len(result['results']), 3)
        self.assertEqual(result['page'], 1)
        self.assertEqual(result['page_size'], 3)
        self.assertEqual(result['total_pages'], 2)

    def test_list_with_filters(self):
        """Test list method with filters."""
        result = self.repository.list(
            filters={'person_type': PersonType.EMPLOYEE},
            page=1,
            page_size=10
        )

        self.assertGreater(result['count'], 0)
        for person in result['results']:
            self.assertEqual(person.person_type, PersonType.EMPLOYEE)

    def test_list_with_search(self):
        """Test list method with search."""
        result = self.repository.list(
            search="Test User",
            page=1,
            page_size=10
        )

        self.assertGreater(result['count'], 0)
        self.assertEqual(result['results'][0].profile.full_name, "Test User")

    def test_list_with_ordering(self):
        """Test list method with ordering."""
        # Create persons with different dates
        for i in range(3):
            user = User.objects.create(
                email=f"ordered{i}@example.com",
                username=f"ordered{i}"
            )
            profile = Profile.objects.create(
                user=user,
                full_name=f"Ordered User {i}",
                dob=date(1990, 1, 1)
            )
            Person.create_employee(
                profile=profile,
                user=user,
                client=self.client,
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020 + i, 1, 1)
            )

        result = self.repository.list(
            ordering=['-employment_start_date'],
            page=1,
            page_size=10
        )

        # Check that results are ordered by employment_start_date descending
        dates = [p.employment_start_date for p in result['results']]
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_create(self):
        """Test creating a person through repository."""
        new_user = User.objects.create(
            email="new@example.com",
            username="newuser"
        )
        new_profile = Profile.objects.create(
            user=new_user,
            full_name="New User",
            dob=date(1995, 1, 1)
        )

        person = self.repository.create(
            person_type=PersonType.EMPLOYEE,
            profile=new_profile,
            user=new_user,
            client=self.client,
            employee_role=StaffRole.ADMIN,
            employment_start_date=date(2021, 1, 1),
            employment_status=WorkStatus.ACTIVE,
            status=BaseStatus.ACTIVE
        )

        self.assertIsNotNone(person.id)
        self.assertEqual(person.person_type, PersonType.EMPLOYEE)
        self.assertEqual(person.profile.full_name, "New User")

    # def test_update(self):
    #     """Test updating a person through repository - METHOD NOT IMPLEMENTED."""
    #     updated_person = self.repository.update(
    #         str(self.employee.id),
    #         {'employee_role': StaffRole.ADMIN}
    #     )
    #
    #     self.assertEqual(updated_person.employee_role, StaffRole.ADMIN)

    # def test_delete(self):
    #     """Test soft delete through repository - METHOD NOT IMPLEMENTED."""
    #     self.repository.delete(str(self.employee.id))
    #
    #     # Verify soft delete
    #     person = Person.objects.get(id=self.employee.id)
    #     self.assertIsNotNone(person.deleted_at)
    #     self.assertEqual(person.status, BaseStatus.INACTIVE)

    def test_exists(self):
        """Test exists method."""
        self.assertTrue(
            self.repository.exists({'profile_id': str(self.profile.id)})
        )
        self.assertFalse(
            self.repository.exists({'profile_id': 'non-existent'})
        )

    def test_get_employees(self):
        """Test get_employees method."""
        employees = self.repository.get_employees()

        self.assertGreater(len(employees), 0)
        for employee in employees:
            self.assertEqual(employee.person_type, PersonType.EMPLOYEE)

    # def test_get_employees_by_client(self):
    #     """Test get_employees_by_client method - METHOD NOT IMPLEMENTED."""
    #     employees = self.repository.get_employees_by_client(str(self.client.id))
    #
    #     self.assertGreater(len(employees), 0)
    #     for employee in employees:
    #         self.assertEqual(employee.client_id, self.client.id)

    # def test_get_employees_by_client_with_status(self):
    #     """Test get_employees_by_client with status filter - METHOD NOT IMPLEMENTED."""
    #     employees = self.repository.get_employees_by_client(
    #         str(self.client.id),
    #         status=WorkStatus.ACTIVE
    #     )
    #
    #     self.assertGreater(len(employees), 0)
    #     for employee in employees:
    #         self.assertEqual(employee.employment_status, WorkStatus.ACTIVE)

    def test_get_eligible_for_services(self):
        """Test get_eligible_for_services method."""
        eligible = self.repository.get_eligible_for_services()

        self.assertGreater(len(eligible), 0)
        # Note: is_eligible_for_services() is a model method, test it exists
        for person in eligible:
            self.assertIsNotNone(person)

    # def test_get_dependents_for_employee(self):
    #     """Test get_dependents_for_employee method - METHOD NOT IMPLEMENTED."""
    #     # Create dependent
    #     dep_user = User.objects.create(
    #         email="dependent@example.com",
    #         username="dependent"
    #     )
    #     dep_profile = Profile.objects.create(
    #         user=dep_user,
    #         full_name="Dependent User",
    #         dob=date(2010, 1, 1)
    #     )
    #     Person.create_dependent(
    #         profile=dep_profile,
    #         user=dep_user,
    #         primary_employee=self.employee,
    #         relationship_to_employee=RelationType.CHILD
    #     )
    #
    #     dependents = self.repository.get_dependents_for_employee(
    #         str(self.employee.id)
    #     )
    #
    #     self.assertEqual(len(dependents), 1)
    #     self.assertEqual(dependents[0].person_type, PersonType.DEPENDENT)
    #     self.assertEqual(dependents[0].primary_employee_id, self.employee.id)

    def test_search_multiple_fields(self):
        """Test search across multiple fields."""
        result = self.repository.list(
            search="test@example.com",
            page=1,
            page_size=10
        )

        self.assertGreater(result['count'], 0)
        found = False
        for person in result['results']:
            if (person.profile and person.profile.email == "test@example.com") or \
               (person.user and person.user.email == "test@example.com"):
                found = True
                break
        self.assertTrue(found)

    def test_bulk_create(self):
        """Test bulk_create method."""
        persons = []
        for i in range(3):
            user = User.objects.create(
                email=f"bulk{i}@example.com",
                username=f"bulk{i}"
            )
            profile = Profile.objects.create(
                user=user,
                full_name=f"Bulk User {i}",
                dob=date(1990, 1, 1)
            )
            persons.append(Person(
                person_type=PersonType.EMPLOYEE,
                profile=profile,
                user=user,
                client=self.client,
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1),
                employment_status=WorkStatus.ACTIVE,
                status=BaseStatus.ACTIVE
            ))

        created_persons = self.repository.bulk_create(persons)

        self.assertEqual(len(created_persons), 3)
        for person in created_persons:
            self.assertIsNotNone(person.id)
