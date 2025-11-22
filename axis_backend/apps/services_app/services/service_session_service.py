"""Service for ServiceSession business logic."""
from typing import Optional, List
from datetime import datetime
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from axis_backend.services.base import BaseService
from axis_backend.enums import SessionStatus
from apps.services_app.models import ServiceSession, Service, ServiceProvider
from apps.services_app.repositories import ServiceSessionRepository


class ServiceSessionService(BaseService[ServiceSession]):
    """Service for ServiceSession business logic."""

    repository_class = ServiceSessionRepository

    @transaction.atomic
    def create_session(
        self,
        service_id: str,
        provider_id: str,
        person_id: str,
        scheduled_at: datetime,
        status: str = SessionStatus.SCHEDULED,
        location: Optional[str] = None,
        is_group_session: bool = False,
        notes: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> ServiceSession:
        """Create a new service session."""
        # Validate service exists
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            raise ValidationError(f"Service with ID '{service_id}' does not exist")

        # Validate provider exists
        try:
            provider = ServiceProvider.objects.get(id=provider_id)
        except ServiceProvider.DoesNotExist:
            raise ValidationError(f"Provider with ID '{provider_id}' does not exist")

        # Validate person exists
        from apps.persons.models import Person
        try:
            person = Person.objects.get(id=person_id)
        except Person.DoesNotExist:
            raise ValidationError(f"Person with ID '{person_id}' does not exist")

        # Validate scheduled time is in future
        if scheduled_at < timezone.now():
            raise ValidationError("Cannot schedule session in the past")

        session_data = {
            'service': service,
            'provider': provider,
            'person': person,
            'scheduled_at': scheduled_at,
            'status': status,
            'location': location,
            'is_group_session': is_group_session,
            'notes': notes,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**session_data)

    @transaction.atomic
    def complete_session(
        self,
        session_id: str,
        duration: Optional[int] = None,
        notes: Optional[str] = None
    ) -> ServiceSession:
        """Mark session as completed."""
        session = self.repository.get_by_id(session_id)
        if not session:
            raise ValidationError(f"Session with ID '{session_id}' not found")
        session.complete(duration, notes)
        return session

    @transaction.atomic
    def cancel_session(self, session_id: str, reason: str) -> ServiceSession:
        """Cancel a session."""
        session = self.repository.get_by_id(session_id)
        if not session:
            raise ValidationError(f"Session with ID '{session_id}' not found")
        if not reason:
            raise ValidationError("Cancellation reason is required")
        session.cancel(reason)
        return session

    @transaction.atomic
    def reschedule_session(
        self,
        session_id: str,
        new_datetime: datetime
    ) -> ServiceSession:
        """Reschedule a session."""
        session = self.repository.get_by_id(session_id)
        if not session:
            raise ValidationError(f"Session with ID '{session_id}' not found")
        if new_datetime < timezone.now():
            raise ValidationError("Cannot reschedule to past time")
        session.reschedule(new_datetime)
        return session

    def get_upcoming_sessions(self, days: int = 7) -> List[ServiceSession]:
        """Get sessions scheduled in the next N days."""
        return list(self.repository.get_upcoming_sessions(days))

    def get_person_upcoming_sessions(self, person_id: str) -> List[ServiceSession]:
        """Get upcoming sessions for a person."""
        return list(self.repository.get_person_upcoming_sessions(person_id))

    def search_sessions(
        self,
        service_id: Optional[str] = None,
        provider_id: Optional[str] = None,
        person_id: Optional[str] = None,
        status: Optional[str] = None,
        is_group: Optional[bool] = None,
        scheduled_from: Optional[datetime] = None,
        scheduled_to: Optional[datetime] = None,
        is_upcoming: Optional[bool] = None
    ) -> List[ServiceSession]:
        """Search sessions with filters."""
        return list(self.repository.search_sessions(
            service_id=service_id,
            provider_id=provider_id,
            person_id=person_id,
            status=status,
            is_group=is_group,
            scheduled_from=scheduled_from,
            scheduled_to=scheduled_to,
            is_upcoming=is_upcoming
        ))
