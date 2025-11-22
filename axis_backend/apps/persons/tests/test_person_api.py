"""Tests for Person API endpoints."""
import pytest
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.persons.models import Person
from apps.authentication.models import User, Profile
from apps.clients.models import Client
from axis_backend.enums import PersonType, WorkStatus, StaffRole, BaseStatus, RelationType


@pytest.mark.django_db
class TestPersonAPI(TestCase):
    """Test cases for Person API endpoints."""

    def setUp(self):
        """Set up test data and API client."""
        self.client_api = APIClient()

        # Create test user with authentication
        self.user = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="testpass123"
        )
        self.user.is_superuser = True
        self.user.save()

        # Authenticate client
        self.client_api.force_authenticate(user=self.user)

        # Create test profile
        self.profile = Profile.objects.create(
            user=self.user,
            full_name="Admin User",
            dob=date(1990, 1, 1),
            gender="M"
        )

        # Create test client
        self.test_client = Client.objects.create(
            name="Test Client",
            status=BaseStatus.ACTIVE
        )

    def tearDown(self):
        """Clean up test data."""
        # Delete in proper order due to PROTECT foreign keys
        # Need to handle soft-deleted records that prevent deletion
        from django.db.models.deletion import ProtectedError

        # 1. Try to delete dependents first (they reference employees)
        try:
            Person.objects.filter(person_type=PersonType.DEPENDENT).delete()
        except ProtectedError:
            # Clear primary_employee FK for any remaining dependents
            Person.objects.filter(person_type=PersonType.DEPENDENT).update(primary_employee=None)
            Person.objects.filter(person_type=PersonType.DEPENDENT).delete()

        # 2. Delete employees
        Person.objects.filter(person_type=PersonType.EMPLOYEE).delete()

        # 3. Delete profiles - handle soft-deleted persons that still reference profiles
        try:
            Profile.objects.all().delete()
        except ProtectedError:
            # Soft-deleted persons still reference profiles, hard delete them using all_objects manager
            Person.all_objects.all().delete()
            Profile.objects.all().delete()

        # 4. Delete users and clients
        User.objects.all().delete()
        Client.objects.all().delete()

    def test_list_persons(self):
        """Test GET /api/persons/ - List all persons."""
        # Create test person
        Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        response = self.client_api.get('/api/persons/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)
        self.assertGreater(response.data['count'], 0)

    def test_list_persons_with_pagination(self):
        """Test GET /api/persons/ with pagination."""
        # Create multiple persons
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
                client=self.test_client,
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1)
            )

        response = self.client_api.get('/api/persons/?page=1&page_size=2')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        self.assertEqual(response.data['page'], 1)
        self.assertEqual(response.data['page_size'], 2)

    def test_list_persons_with_filters(self):
        """Test GET /api/persons/ with filters."""
        # Create test person
        Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        response = self.client_api.get(f'/api/persons/?person_type={PersonType.EMPLOYEE}')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for person in response.data['results']:
            self.assertEqual(person['person_type'], PersonType.EMPLOYEE)

    def test_list_persons_with_search(self):
        """Test GET /api/persons/ with search."""
        # Create test person
        Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        response = self.client_api.get('/api/persons/?search=Admin')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_list_persons_unauthorized(self):
        """Test GET /api/persons/ without authentication."""
        self.client_api.force_authenticate(user=None)
        response = self.client_api.get('/api/persons/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_person(self):
        """Test GET /api/persons/{id}/ - Get person details."""
        # Create test person
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        response = self.client_api.get(f'/api/persons/{person.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(person.id))
        self.assertEqual(response.data['person_type'], PersonType.EMPLOYEE)

    def test_retrieve_person_not_found(self):
        """Test GET /api/persons/{id}/ with invalid ID."""
        response = self.client_api.get('/api/persons/non-existent-id/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_employee(self):
        """Test POST /api/persons/create-employee/ - Create employee."""
        new_user = User.objects.create(
            email="newemployee@example.com",
            username="newemployee"
        )
        new_profile = Profile.objects.create(
            user=new_user,
            full_name="New Employee",
            dob=date(1992, 1, 1)
        )

        data = {
            'profile_id': str(new_profile.id),
            'user_id': str(new_user.id),
            'client_id': str(self.test_client.id),
            'employee_role': StaffRole.STAFF,
            'employment_start_date': '2021-01-01',
            'employment_status': WorkStatus.ACTIVE
        }

        response = self.client_api.post('/api/persons/create-employee/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['person_type'], PersonType.EMPLOYEE)
        self.assertEqual(response.data['profile']['full_name'], "New Employee")

    def test_create_employee_invalid_data(self):
        """Test POST /api/persons/create-employee/ with invalid data."""
        data = {
            'profile_id': 'invalid',
            'user_id': 'invalid',
            'client_id': 'invalid',
            'employee_role': StaffRole.STAFF,
            'employment_start_date': '2021-01-01'
        }

        response = self.client_api.post('/api/persons/create-employee/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_dependent(self):
        """Test POST /api/persons/create-dependent/ - Create dependent."""
        # Create employee first
        employee = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        # Create dependent user and profile
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )

        data = {
            'profile_id': str(dep_profile.id),
            'user_id': str(dep_user.id),
            'primary_employee_id': str(employee.id),
            'relationship_to_employee': RelationType.CHILD,
            'guardian_id': str(self.user.id)  # Required for minors
        }

        response = self.client_api.post('/api/persons/create-dependent/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['person_type'], PersonType.DEPENDENT)
        self.assertEqual(response.data['relationship_to_employee'], RelationType.CHILD)

    def test_create_dependent_invalid_employee(self):
        """Test POST /api/persons/create-dependent/ with invalid employee."""
        dep_user = User.objects.create(
            email="dependent@example.com",
            username="dependent"
        )
        dep_profile = Profile.objects.create(
            user=dep_user,
            full_name="Dependent User",
            dob=date(2010, 1, 1)
        )

        data = {
            'profile_id': str(dep_profile.id),
            'user_id': str(dep_user.id),
            'primary_employee_id': 'invalid-id',
            'relationship_to_employee': RelationType.CHILD
        }

        response = self.client_api.post('/api/persons/create-dependent/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_person(self):
        """Test PATCH /api/persons/{id}/ - Update person."""
        # Create test person
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        data = {'employee_role': StaffRole.ADMIN}

        response = self.client_api.patch(f'/api/persons/{person.id}/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employee_role'], StaffRole.ADMIN)

    def test_delete_person(self):
        """Test DELETE /api/persons/{id}/ - Soft delete person."""
        # Create test person
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        response = self.client_api.delete(f'/api/persons/{person.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Verify soft delete
        person.refresh_from_db()
        self.assertIsNotNone(person.deleted_at)

    def test_get_eligible_persons(self):
        """Test GET /api/persons/eligible/ - Get eligible persons."""
        # Create active employee
        Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        response = self.client_api.get('/api/persons/eligible/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data['count'], 0)

    def test_get_family_members(self):
        """Test GET /api/persons/{id}/family/ - Get family members."""
        # Create employee
        employee = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
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
        Person.create_dependent(
            profile=dep_profile,
            user=dep_user,
            primary_employee=employee,
            relationship_to_employee=RelationType.CHILD,
            guardian=self.user  # Required for minors
        )

        response = self.client_api.get(f'/api/persons/{employee.id}/family/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('employee', response.data)
        self.assertIn('dependents', response.data)
        self.assertEqual(response.data['total_members'], 2)

    def test_get_employees_by_client(self):
        """Test GET /api/persons/by-client/{client_id}/ - Get employees by client."""
        # Create employees
        for i in range(2):
            user = User.objects.create(
                email=f"emp{i}@example.com",
                username=f"emp{i}"
            )
            profile = Profile.objects.create(
                user=user,
                full_name=f"Employee {i}",
                dob=date(1990, 1, 1)
            )
            Person.create_employee(
                profile=profile,
                user=user,
                client=self.test_client,
                employee_role=StaffRole.STAFF,
                employment_start_date=date(2020, 1, 1)
            )

        response = self.client_api.get(f'/api/persons/by-client/{self.test_client.id}/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['count'], 2)

    def test_activate_person(self):
        """Test POST /api/persons/{id}/activate/ - Activate person."""
        # Create inactive person
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )
        person.status = BaseStatus.INACTIVE
        person.save()

        response = self.client_api.post(f'/api/persons/{person.id}/activate/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], BaseStatus.ACTIVE)

    def test_deactivate_person(self):
        """Test POST /api/persons/{id}/deactivate/ - Deactivate person."""
        # Create active person
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1)
        )

        data = {'reason': 'Test deactivation'}

        response = self.client_api.post(f'/api/persons/{person.id}/deactivate/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], BaseStatus.INACTIVE)

    def test_update_employment_status(self):
        """Test POST /api/persons/{id}/update-employment-status/ - Update employment status."""
        # Create employee
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        data = {'employment_status': WorkStatus.ON_LEAVE}

        response = self.client_api.post(
            f'/api/persons/{person.id}/update-employment-status/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employment_status'], WorkStatus.ON_LEAVE)

    def test_update_employment_status_with_end_date(self):
        """Test POST /api/persons/{id}/update-employment-status/ with end date."""
        # Create employee
        person = Person.create_employee(
            profile=self.profile,
            user=self.user,
            client=self.test_client,
            employee_role=StaffRole.STAFF,
            employment_start_date=date(2020, 1, 1),
            employment_status=WorkStatus.ACTIVE
        )

        data = {
            'employment_status': WorkStatus.TERMINATED,
            'employment_end_date': '2023-12-31'
        }

        response = self.client_api.post(
            f'/api/persons/{person.id}/update-employment-status/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['employment_status'], WorkStatus.TERMINATED)
        self.assertIsNotNone(response.data['employment_end_date'])
