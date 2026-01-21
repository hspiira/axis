"""Repository for ServiceSession model data access."""
from typing import Optional
from datetime import datetime, date
from django.db.models import QuerySet, Q
from django.utils import timezone

from axis_backend.repositories.base import BaseRepository
from axis_backend.enums import SessionStatus
from apps.services_app.models import ServiceSession


class ServiceSessionRepository(BaseRepository[ServiceSession]):
    """
    Repository for ServiceSession model.

    Responsibilities:
    - ServiceSession data access operations
    - Filtering by service, provider, person, status
    - Session search and scheduling operations
    """

    model = ServiceSession

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships optimized.

        Returns:
            QuerySet with select_related for service, provider, person
        """
        return super().get_queryset().select_related('service', 'provider', 'person')

    # Query Methods

    def filter_by_service(self, service_id: str) -> QuerySet:
        """Get all sessions for a service."""
        return self.get_queryset().filter(service_id=service_id)

    def filter_by_provider(self, provider_id: str) -> QuerySet:
        """Get all sessions for a provider."""
        return self.get_queryset().filter(provider_id=provider_id)

    def filter_by_person(self, person_id: str) -> QuerySet:
        """Get all sessions for a person."""
        return self.get_queryset().filter(person_id=person_id)

    # Status Filters

    def get_scheduled_sessions(self) -> QuerySet:
        """Get all scheduled sessions."""
        return self.get_queryset().filter(status=SessionStatus.SCHEDULED)

    def get_completed_sessions(self) -> QuerySet:
        """Get all completed sessions."""
        return self.get_queryset().filter(status=SessionStatus.COMPLETED)

    def get_canceled_sessions(self) -> QuerySet:
        """Get all canceled sessions."""
        return self.get_queryset().filter(status=SessionStatus.CANCELED)

    def get_no_show_sessions(self) -> QuerySet:
        """Get all no-show sessions."""
        return self.get_queryset().filter(status=SessionStatus.NO_SHOW)

    def filter_by_status(self, status: str) -> QuerySet:
        """Filter sessions by status."""
        return self.get_queryset().filter(status=status)

    # Date/Time Filters

    def get_sessions_on_date(self, session_date: date) -> QuerySet:
        """Get sessions scheduled on a specific date."""
        return self.get_queryset().filter(scheduled_at__date=session_date)

    def get_sessions_in_date_range(self, start_date: datetime, end_date: datetime) -> QuerySet:
        """Get sessions scheduled within date range."""
        return self.get_queryset().filter(
            scheduled_at__gte=start_date,
            scheduled_at__lte=end_date
        )

    def get_upcoming_sessions(self, days: int = 7) -> QuerySet:
        """Get sessions scheduled in the next N days."""
        from datetime import timedelta
        now = timezone.now()
        future_threshold = now + timedelta(days=days)
        return self.get_queryset().filter(
            scheduled_at__gte=now,
            scheduled_at__lte=future_threshold,
            status=SessionStatus.SCHEDULED
        )

    def get_past_sessions(self) -> QuerySet:
        """Get sessions that have already occurred."""
        now = timezone.now()
        return self.get_queryset().filter(scheduled_at__lt=now)

    def get_today_sessions(self) -> QuerySet:
        """Get sessions scheduled for today."""
        today = timezone.now().date()
        return self.get_queryset().filter(scheduled_at__date=today)

    # Session Type Filters

    def get_group_sessions(self) -> QuerySet:
        """Get group sessions."""
        return self.get_queryset().filter(is_group_session=True)

    def get_individual_sessions(self) -> QuerySet:
        """Get individual sessions."""
        return self.get_queryset().filter(is_group_session=False)

    # Completion Filters

    def get_sessions_with_feedback(self) -> QuerySet:
        """Get sessions that have feedback."""
        return self.get_queryset().filter(feedback__isnull=False).exclude(feedback='')

    def get_sessions_without_feedback(self) -> QuerySet:
        """Get completed sessions without feedback."""
        return self.get_queryset().filter(
            status=SessionStatus.COMPLETED
        ).filter(
            Q(feedback__isnull=True) | Q(feedback='')
        )

    # Reschedule Filters

    def get_rescheduled_sessions(self) -> QuerySet:
        """Get sessions that have been rescheduled."""
        return self.get_queryset().filter(reschedule_count__gt=0)

    def get_frequently_rescheduled(self, min_count: int = 3) -> QuerySet:
        """Get sessions rescheduled multiple times."""
        return self.get_queryset().filter(reschedule_count__gte=min_count)

    # Search Methods

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
    ) -> QuerySet:
        """
        Advanced session search with multiple filters.

        Args:
            service_id: Service filter
            provider_id: Provider filter
            person_id: Person filter
            status: Session status
            is_group: Group session flag
            scheduled_from: Minimum scheduled time
            scheduled_to: Maximum scheduled time
            is_upcoming: Filter for upcoming sessions

        Returns:
            Filtered QuerySet
        """
        queryset = self.get_queryset()

        if service_id:
            queryset = queryset.filter(service_id=service_id)
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        if person_id:
            queryset = queryset.filter(person_id=person_id)
        if status:
            queryset = queryset.filter(status=status)
        if is_group is not None:
            queryset = queryset.filter(is_group_session=is_group)
        if scheduled_from:
            queryset = queryset.filter(scheduled_at__gte=scheduled_from)
        if scheduled_to:
            queryset = queryset.filter(scheduled_at__lte=scheduled_to)
        if is_upcoming is True:
            queryset = queryset.filter(
                scheduled_at__gte=timezone.now(),
                status=SessionStatus.SCHEDULED
            )

        return queryset

    # Business Logic Queries

    def get_person_upcoming_sessions(self, person_id: str) -> QuerySet:
        """Get upcoming sessions for a person."""
        return self.get_queryset().filter(
            person_id=person_id,
            scheduled_at__gte=timezone.now(),
            status=SessionStatus.SCHEDULED
        ).order_by('scheduled_at')

    def get_provider_today_sessions(self, provider_id: str) -> QuerySet:
        """Get today's sessions for a provider."""
        today = timezone.now().date()
        return self.get_queryset().filter(
            provider_id=provider_id,
            scheduled_at__date=today
        ).order_by('scheduled_at')

    def get_completed_sessions_without_duration(self) -> QuerySet:
        """Get completed sessions missing duration data."""
        return self.get_queryset().filter(
            status=SessionStatus.COMPLETED,
            duration__isnull=True
        )
