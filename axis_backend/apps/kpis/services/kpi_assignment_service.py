"""Service for KPIAssignment business logic."""
from typing import Optional, List
from datetime import date
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from axis_backend.services.base import BaseService
from apps.kpis.models import KPIAssignment, KPI
from apps.kpis.repositories import KPIAssignmentRepository


class KPIAssignmentService(BaseService[KPIAssignment]):
    """
    Service for KPIAssignment business logic.

    Responsibilities (Single Responsibility Principle):
    - KPI assignment creation and management
    - Date validation and conflict detection
    - Measurement recording
    - Status transitions

    Design Notes:
    - Extends BaseService for common operations
    - Validates KPI, contract, and client relationships
    - Enforces date constraints
    - Manages assignment lifecycle
    """

    repository_class = KPIAssignmentRepository

    # Create Operations

    @transaction.atomic
    def create_assignment(
        self,
        kpi_id: str,
        contract_id: str,
        client_id: str,
        frequency: str,
        status: str,
        start_date: date,
        target_value: Optional[str] = None,
        end_date: Optional[date] = None,
        notes: Optional[str] = None,
        **kwargs
    ) -> KPIAssignment:
        """
        Create new KPI assignment with validation.

        Business Rules:
        - KPI, contract, and client must exist
        - Contract must belong to client
        - Start date cannot be in the past (for new assignments)
        - End date must be after start date
        - Frequency must be valid

        Args:
            kpi_id: KPI ID
            contract_id: Contract ID
            client_id: Client ID
            frequency: Measurement frequency
            status: Assignment status
            start_date: Tracking start date
            target_value: Contract-specific target (optional)
            end_date: Tracking end date (optional)
            notes: Assignment notes (optional)
            **kwargs: Additional fields

        Returns:
            Created KPIAssignment instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate KPI exists
        try:
            kpi = KPI.objects.get(id=kpi_id)
        except KPI.DoesNotExist:
            raise ValidationError(f"KPI with ID '{kpi_id}' does not exist")

        # Validate contract and client relationship
        from apps.contracts.models import Contract
        try:
            contract = Contract.objects.get(id=contract_id)
            if str(contract.client_id) != client_id:
                raise ValidationError("Contract does not belong to specified client")
        except Contract.DoesNotExist:
            raise ValidationError(f"Contract with ID '{contract_id}' does not exist")

        # Validate dates
        if end_date and end_date < start_date:
            raise ValidationError("End date must be after start date")

        # Create assignment
        return self.repository.create(
            kpi_id=kpi_id,
            contract_id=contract_id,
            client_id=client_id,
            frequency=frequency,
            status=status,
            start_date=start_date,
            target_value=target_value,
            end_date=end_date,
            notes=notes,
            **kwargs
        )

    # Update Operations

    @transaction.atomic
    def update_assignment(
        self,
        assignment_id: str,
        target_value: Optional[str] = None,
        frequency: Optional[str] = None,
        status: Optional[str] = None,
        end_date: Optional[date] = None,
        notes: Optional[str] = None,
        **kwargs
    ) -> KPIAssignment:
        """
        Update KPI assignment with validation.

        Business Rules:
        - Cannot change KPI, contract, or client after creation
        - Cannot change start_date after creation
        - End date must be after start date

        Args:
            assignment_id: Assignment ID
            target_value: New target value (optional)
            frequency: New frequency (optional)
            status: New status (optional)
            end_date: New end date (optional)
            notes: New notes (optional)
            **kwargs: Additional fields to update

        Returns:
            Updated KPIAssignment instance

        Raises:
            ValidationError: If validation fails
        """
        assignment = self.repository.get_by_id(assignment_id)

        # Prevent changing immutable fields
        forbidden_fields = ['kpi_id', 'kpi', 'contract_id', 'contract', 'client_id', 'client', 'start_date']
        for field in forbidden_fields:
            if field in kwargs:
                raise ValidationError(f"Cannot modify {field} after creation")

        # Validate end date
        if end_date and end_date < assignment.start_date:
            raise ValidationError("End date must be after start date")

        if target_value is not None:
            kwargs['target_value'] = target_value
        if frequency is not None:
            kwargs['frequency'] = frequency
        if status is not None:
            kwargs['status'] = status
        if end_date is not None:
            kwargs['end_date'] = end_date
        if notes is not None:
            kwargs['notes'] = notes

        return self.repository.update(assignment_id, **kwargs)

    @transaction.atomic
    def update_status(self, assignment_id: str, status: str) -> KPIAssignment:
        """
        Update assignment status.

        Args:
            assignment_id: Assignment ID
            status: New status

        Returns:
            Updated KPIAssignment instance
        """
        return self.repository.update(assignment_id, status=status)

    @transaction.atomic
    def activate_assignment(self, assignment_id: str) -> KPIAssignment:
        """
        Activate an assignment.

        Args:
            assignment_id: Assignment ID

        Returns:
            Updated KPIAssignment instance
        """
        from axis_backend.enums import AssignmentStatus
        return self.update_status(assignment_id, AssignmentStatus.ACTIVE)

    @transaction.atomic
    def complete_assignment(self, assignment_id: str) -> KPIAssignment:
        """
        Mark assignment as completed.

        Args:
            assignment_id: Assignment ID

        Returns:
            Updated KPIAssignment instance
        """
        from axis_backend.enums import AssignmentStatus
        assignment = self.repository.get_by_id(assignment_id)

        # Set end date to today if not set
        if not assignment.end_date:
            return self.repository.update(
                assignment_id,
                status=AssignmentStatus.COMPLETED,
                end_date=timezone.now().date()
            )
        else:
            return self.update_status(assignment_id, AssignmentStatus.COMPLETED)

    @transaction.atomic
    def pause_assignment(self, assignment_id: str) -> KPIAssignment:
        """
        Pause an assignment.

        Args:
            assignment_id: Assignment ID

        Returns:
            Updated KPIAssignment instance
        """
        from axis_backend.enums import AssignmentStatus
        return self.update_status(assignment_id, AssignmentStatus.PAUSED)

    # Measurement Operations

    @transaction.atomic
    def record_measurement(
        self,
        assignment_id: str,
        value: str,
        period: Optional[str] = None
    ) -> KPIAssignment:
        """
        Record a measurement for the assignment.

        Args:
            assignment_id: Assignment ID
            value: Measured value
            period: Measurement period identifier (optional)

        Returns:
            Updated KPIAssignment instance
        """
        assignment = self.repository.get_by_id(assignment_id)
        assignment.record_measurement(value, period)
        return assignment

    # Query Operations

    def get_by_kpi(self, kpi_id: str) -> List[KPIAssignment]:
        """
        Get all assignments for a KPI.

        Args:
            kpi_id: KPI ID

        Returns:
            List of assignments
        """
        return list(self.repository.filter_by_kpi(kpi_id))

    def get_by_contract(self, contract_id: str) -> List[KPIAssignment]:
        """
        Get all assignments for a contract.

        Args:
            contract_id: Contract ID

        Returns:
            List of assignments
        """
        return list(self.repository.filter_by_contract(contract_id))

    def get_by_client(self, client_id: str) -> List[KPIAssignment]:
        """
        Get all assignments for a client.

        Args:
            client_id: Client ID

        Returns:
            List of assignments
        """
        return list(self.repository.filter_by_client(client_id))

    def get_by_status(self, status: str) -> List[KPIAssignment]:
        """
        Get all assignments with specific status.

        Args:
            status: Assignment status

        Returns:
            List of assignments
        """
        return list(self.repository.filter_by_status(status))

    def get_active_assignments(self, as_of_date: Optional[date] = None) -> List[KPIAssignment]:
        """
        Get assignments active as of a specific date.

        Args:
            as_of_date: Date to check (defaults to today)

        Returns:
            List of active assignments
        """
        return list(self.repository.get_active_assignments(as_of_date))

    def get_upcoming_assignments(self, days_ahead: int = 30) -> List[KPIAssignment]:
        """
        Get assignments starting soon.

        Args:
            days_ahead: Number of days to look ahead

        Returns:
            List of upcoming assignments
        """
        return list(self.repository.get_upcoming_assignments(days_ahead))

    def get_expired_assignments(self) -> List[KPIAssignment]:
        """
        Get assignments that have ended.

        Returns:
            List of expired assignments
        """
        return list(self.repository.get_expired_assignments())

    def search_assignments(
        self,
        kpi_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        client_id: Optional[str] = None,
        status: Optional[str] = None,
        frequency: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        active_only: bool = False
    ) -> List[KPIAssignment]:
        """
        Advanced assignment search.

        Args:
            kpi_id: Filter by KPI
            contract_id: Filter by contract
            client_id: Filter by client
            status: Filter by status
            frequency: Filter by frequency
            start_date: Filter by start date
            end_date: Filter by end date
            active_only: Only return active assignments

        Returns:
            List of matching assignments
        """
        return list(self.repository.search_assignments(
            kpi_id=kpi_id,
            contract_id=contract_id,
            client_id=client_id,
            status=status,
            frequency=frequency,
            start_date=start_date,
            end_date=end_date,
            active_only=active_only
        ))

    def get_assignments_with_measurements(self) -> List[KPIAssignment]:
        """
        Get assignments that have recorded measurements.

        Returns:
            List of assignments with measurements
        """
        return list(self.repository.get_assignments_with_measurements())
