"""Repository for AuditLog model data access."""
from typing import Optional
from datetime import datetime
from django.db.models import QuerySet

from apps.audit.models import AuditLog


class AuditLogRepository:
    """
    Repository for AuditLog model.

    Note: AuditLog doesn't use BaseRepository since it's immutable
    and doesn't extend BaseModel.

    Responsibilities:
    - AuditLog data access operations
    - Filtering by user, action, entity, time
    - Read-only access (audit logs are immutable)
    """

    model = AuditLog

    def get_queryset(self) -> QuerySet:
        """
        Get base queryset with relationships.

        Returns:
            QuerySet with select_related for user
        """
        return self.model.objects.select_related('user')

    def get_by_id(self, audit_id: str) -> Optional[AuditLog]:
        """Get audit log by ID."""
        return self.get_queryset().filter(id=audit_id).first()

    def list(self, limit: Optional[int] = None) -> list[AuditLog]:
        """List audit logs."""
        queryset = self.get_queryset()
        if limit is not None:
            queryset = queryset[:limit]
        return list(queryset)

    # Query Methods

    def filter_by_user(self, user_id: str) -> QuerySet:
        """Filter logs by user."""
        return self.get_queryset().filter(user_id=user_id)

    def filter_by_action(self, action: str) -> QuerySet:
        """Filter logs by action type."""
        return self.get_queryset().filter(action=action)

    def filter_by_entity(self, entity_type: str, entity_id: Optional[str] = None) -> QuerySet:
        """Filter logs by entity type and optionally ID."""
        queryset = self.get_queryset().filter(entity_type=entity_type)
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
        return queryset

    def filter_by_date_range(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> QuerySet:
        """Filter logs by timestamp range."""
        queryset = self.get_queryset()
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        return queryset

    def filter_by_ip(self, ip_address: str) -> QuerySet:
        """Filter logs by IP address."""
        return self.get_queryset().filter(ip_address=ip_address)

    def get_recent(self, days: int = 7) -> QuerySet:
        """Get logs from recent days."""
        from django.utils import timezone
        cutoff = timezone.now() - timezone.timedelta(days=days)
        return self.get_queryset().filter(timestamp__gte=cutoff)

    def search_logs(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        ip_address: Optional[str] = None
    ) -> QuerySet:
        """Advanced audit log search."""
        queryset = self.get_queryset()

        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if action:
            queryset = queryset.filter(action=action)
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        if ip_address:
            queryset = queryset.filter(ip_address=ip_address)

        return queryset
