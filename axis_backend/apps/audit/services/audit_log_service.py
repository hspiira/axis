"""Service for AuditLog business logic."""
from typing import Optional, List
from datetime import datetime

from apps.audit.models import AuditLog
from apps.audit.repositories import AuditLogRepository


class AuditLogService:
    """
    Service for AuditLog business logic.

    Note: AuditLog is immutable (read-only after creation).
    This service focuses on querying and reporting.

    Responsibilities:
    - Audit log creation
    - Query and search operations
    - Audit reporting
    """

    def __init__(self):
        """Initialize service with repository."""
        self.repository = AuditLogRepository()

    # Read Operations

    def get_by_id(self, audit_id: str) -> Optional[AuditLog]:
        """Get audit log by ID."""
        return self.repository.get_by_id(audit_id)

    def list_logs(self, limit: Optional[int] = None) -> List[AuditLog]:
        """List audit logs."""
        return self.repository.list(limit=limit)

    def get_user_activity(self, user_id: str, limit: Optional[int] = None) -> List[AuditLog]:
        """Get all activity for a user."""
        queryset = self.repository.filter_by_user(user_id)
        if limit:
            queryset = queryset[:limit]
        return list(queryset)

    def get_entity_logs(
        self,
        entity_type: str,
        entity_id: Optional[str] = None
    ) -> List[AuditLog]:
        """Get all logs for an entity type or specific entity."""
        return list(self.repository.filter_by_entity(entity_type, entity_id))

    def get_recent_activity(self, days: int = 7) -> List[AuditLog]:
        """Get recent audit logs."""
        return list(self.repository.get_recent(days))

    def search_logs(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        ip_address: Optional[str] = None
    ) -> List[AuditLog]:
        """Advanced audit log search."""
        return list(self.repository.search_logs(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            start_date=start_date,
            end_date=end_date,
            ip_address=ip_address
        ))

    # Logging Methods (delegates to model class method)

    def log_action(
        self,
        action: str,
        user=None,
        entity_type: str = None,
        entity_id: str = None,
        data: dict = None,
        ip_address: str = None,
        user_agent: str = None
    ) -> AuditLog:
        """
        Create an audit log entry.

        Args:
            action: Action type
            user: User performing action
            entity_type: Type of entity
            entity_id: Entity identifier
            data: Additional context
            ip_address: Client IP
            user_agent: Client user agent

        Returns:
            AuditLog: Created log entry
        """
        return AuditLog.log_action(
            action=action,
            user=user,
            entity_type=entity_type,
            entity_id=entity_id,
            data=data,
            ip_address=ip_address,
            user_agent=user_agent
        )
