"""Repository for SessionFeedback model data access."""
from typing import Optional
from django.db.models import QuerySet, Avg

from axis_backend.repositories.base import BaseRepository
from apps.services_app.models import SessionFeedback


class SessionFeedbackRepository(BaseRepository[SessionFeedback]):
    """
    Repository for SessionFeedback model.

    Responsibilities:
    - SessionFeedback data access operations
    - Filtering by session, rating
    - Feedback search and rating aggregation
    """

    model = SessionFeedback

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with relationships optimized.

        Returns:
            QuerySet with select_related for session
        """
        return super().get_queryset().select_related('session')

    # Query Methods

    def filter_by_session(self, session_id: str) -> QuerySet:
        """Get all feedback for a session."""
        return self.get_queryset().filter(session_id=session_id)

    def find_by_session(self, session_id: str) -> Optional[SessionFeedback]:
        """Find feedback for a specific session (usually only one)."""
        return self.get_queryset().filter(session_id=session_id).first()

    # Rating Filters

    def get_high_rated_feedback(self, min_rating: int = 4) -> QuerySet:
        """Get feedback with high ratings."""
        return self.get_queryset().filter(rating__gte=min_rating)

    def get_low_rated_feedback(self, max_rating: int = 2) -> QuerySet:
        """Get feedback with low ratings."""
        return self.get_queryset().filter(rating__lte=max_rating)

    def filter_by_rating(self, rating: int) -> QuerySet:
        """Filter feedback by exact rating."""
        return self.get_queryset().filter(rating=rating)

    def get_feedback_by_rating_range(self, min_rating: int, max_rating: int) -> QuerySet:
        """Get feedback within rating range."""
        return self.get_queryset().filter(
            rating__gte=min_rating,
            rating__lte=max_rating
        )

    # Comment Filters

    def get_feedback_with_comments(self) -> QuerySet:
        """Get feedback that includes written comments."""
        return self.get_queryset().filter(comment__isnull=False).exclude(comment='')

    def get_feedback_without_comments(self) -> QuerySet:
        """Get feedback with rating only (no comments)."""
        from django.db.models import Q
        return self.get_queryset().filter(
            Q(comment__isnull=True) | Q(comment='')
        )

    # Search Methods

    def search_feedback(
        self,
        session_id: Optional[str] = None,
        min_rating: Optional[int] = None,
        max_rating: Optional[int] = None,
        has_comment: Optional[bool] = None
    ) -> QuerySet:
        """
        Advanced feedback search with multiple filters.

        Args:
            session_id: Session filter
            min_rating: Minimum rating
            max_rating: Maximum rating
            has_comment: Filter by comment presence

        Returns:
            Filtered QuerySet
        """
        from django.db.models import Q
        queryset = self.get_queryset()

        if session_id:
            queryset = queryset.filter(session_id=session_id)
        if min_rating is not None:
            queryset = queryset.filter(rating__gte=min_rating)
        if max_rating is not None:
            queryset = queryset.filter(rating__lte=max_rating)
        if has_comment is True:
            queryset = queryset.filter(comment__isnull=False).exclude(comment='')
        elif has_comment is False:
            queryset = queryset.filter(Q(comment__isnull=True) | Q(comment=''))

        return queryset

    # Aggregation Methods

    def get_average_rating_for_provider(self, provider_id: str) -> float:
        """Calculate average rating for a provider's sessions."""
        result = self.get_queryset().filter(
            session__provider_id=provider_id
        ).aggregate(avg_rating=Avg('rating'))
        return result['avg_rating'] or 0.0

    def get_average_rating_for_service(self, service_id: str) -> float:
        """Calculate average rating for a service."""
        result = self.get_queryset().filter(
            session__service_id=service_id
        ).aggregate(avg_rating=Avg('rating'))
        return result['avg_rating'] or 0.0

    def get_feedback_count_for_provider(self, provider_id: str) -> int:
        """Count feedback entries for a provider."""
        return self.get_queryset().filter(session__provider_id=provider_id).count()

    def get_feedback_count_for_service(self, service_id: str) -> int:
        """Count feedback entries for a service."""
        return self.get_queryset().filter(session__service_id=service_id).count()

    # Business Logic Queries

    def get_recent_feedback(self, days: int = 30) -> QuerySet:
        """Get feedback from the last N days."""
        from django.utils import timezone
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff_date)

    def get_provider_low_ratings(self, provider_id: str, max_rating: int = 2) -> QuerySet:
        """Get low-rated feedback for a provider (for quality monitoring)."""
        return self.get_queryset().filter(
            session__provider_id=provider_id,
            rating__lte=max_rating
        )
