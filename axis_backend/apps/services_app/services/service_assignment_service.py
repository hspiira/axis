"""Service for ServiceAssignment business logic."""
from typing import Optional, List
from datetime import date
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from axis_backend.enums import AssignmentStatus
from apps.services_app.models import ServiceAssignment, Service
from apps.services_app.repositories import ServiceAssignmentRepository
from apps.contracts.models import Contract
from apps.clients.models import Client


class ServiceAssignmentService(BaseService[ServiceAssignment]):
    """Service for ServiceAssignment business logic."""

    repository_class = ServiceAssignmentRepository

    @transaction.atomic
    def create_assignment(
        self,
        service_id: str,
        contract_id: str,
        client_id: str,
        start_date: date,
        frequency: str,
        end_date: Optional[date] = None,
        status: str = AssignmentStatus.PENDING,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> ServiceAssignment:
        """Create a new service assignment."""
        # Validate service exists
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            raise ValidationError(f"Service with ID '{service_id}' does not exist")

        # Validate contract exists
        try:
            contract = Contract.objects.get(id=contract_id)
        except Contract.DoesNotExist:
            raise ValidationError(f"Contract with ID '{contract_id}' does not exist")

        # Validate client exists
        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            raise ValidationError(f"Client with ID '{client_id}' does not exist")

        # Validate dates
        if end_date and end_date < start_date:
            raise ValidationError("End date must be after start date")

        assignment_data = {
            'service': service,
            'contract': contract,
            'client': client,
            'start_date': start_date,
            'end_date': end_date,
            'frequency': frequency,
            'status': status,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**assignment_data)

    @transaction.atomic
    def update_assignment(
        self,
        assignment_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        frequency: Optional[str] = None,
        status: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> ServiceAssignment:
        """Update an existing assignment."""
        assignment = self.repository.get_by_id(assignment_id)
        if not assignment:
            raise ValidationError(f"Assignment with ID '{assignment_id}' not found")

        update_data = {}

        if start_date is not None or end_date is not None:
            new_start = start_date if start_date is not None else assignment.start_date
            new_end = end_date if end_date is not None else assignment.end_date

            if new_end and new_end < new_start:
                raise ValidationError("End date must be after start date")

            if start_date is not None:
                update_data['start_date'] = start_date
            if end_date is not None:
                update_data['end_date'] = end_date

        if frequency is not None:
            update_data['frequency'] = frequency
        if status is not None:
            update_data['status'] = status
        if metadata is not None:
            update_data['metadata'] = metadata

        update_data.update(kwargs)
        return self.repository.update(assignment_id, **update_data)

    def get_current_assignments(self, as_of_date: Optional[date] = None) -> List[ServiceAssignment]:
        """Get assignments currently in effect."""
        return list(self.repository.get_current_assignments(as_of_date))

    def get_client_active_assignments(self, client_id: str) -> List[ServiceAssignment]:
        """Get active assignments for a client."""
        return list(self.repository.get_client_active_assignments(client_id))

    def search_assignments(
        self,
        service_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        frequency: Optional[str] = None,
        start_date_from: Optional[date] = None,
        start_date_to: Optional[date] = None,
        is_current: Optional[bool] = None
    ) -> List[ServiceAssignment]:
        """Search assignments with filters."""
        return list(self.repository.search_assignments(
            service_id=service_id,
            contract_id=contract_id,
            client_id=client_id,
            status=status,
            frequency=frequency,
            start_date_from=start_date_from,
            start_date_to=start_date_to,
            is_current=is_current
        ))
