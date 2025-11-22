"""Service for SessionFeedback business logic."""
from typing import Optional, List
from django.db import transaction
from django.core.exceptions import ValidationError

from axis_backend.services.base import BaseService
from apps.services_app.models import SessionFeedback, ServiceSession
from apps.services_app.repositories import SessionFeedbackRepository


class SessionFeedbackService(BaseService[SessionFeedback]):
    """Service for SessionFeedback business logic."""

    repository_class = SessionFeedbackRepository

    @transaction.atomic
    def create_feedback(
        self,
        session_id: str,
        rating: int,
        comment: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> SessionFeedback:
        """Create feedback for a session."""
        # Validate session exists
        try:
            session = ServiceSession.objects.get(id=session_id)
        except ServiceSession.DoesNotExist:
            raise ValidationError(f"Session with ID '{session_id}' does not exist")

        # Validate rating range
        if rating < 1 or rating > 5:
            raise ValidationError("Rating must be between 1 and 5")

        # Check if feedback already exists
        existing = self.repository.find_by_session(session_id)
        if existing:
            raise ValidationError(f"Feedback for session '{session_id}' already exists")

        feedback_data = {
            'session': session,
            'rating': rating,
            'comment': comment,
            'metadata': metadata or {},
            **kwargs
        }

        return self.repository.create(**feedback_data)

    @transaction.atomic
    def update_feedback(
        self,
        feedback_id: str,
        rating: Optional[int] = None,
        comment: Optional[str] = None,
        metadata: Optional[dict] = None,
        **kwargs
    ) -> SessionFeedback:
        """Update existing feedback."""
        feedback = self.repository.get_by_id(feedback_id)
        if not feedback:
            raise ValidationError(f"Feedback with ID '{feedback_id}' not found")

        update_data = {}

        if rating is not None:
            if rating < 1 or rating > 5:
                raise ValidationError("Rating must be between 1 and 5")
            update_data['rating'] = rating

        if comment is not None:
            update_data['comment'] = comment
        if metadata is not None:
            update_data['metadata'] = metadata

        update_data.update(kwargs)
        return self.repository.update(feedback_id, **update_data)

    def get_average_rating_for_provider(self, provider_id: str) -> float:
        """Calculate average rating for a provider."""
        return self.repository.get_average_rating_for_provider(provider_id)

    def get_average_rating_for_service(self, service_id: str) -> float:
        """Calculate average rating for a service."""
        return self.repository.get_average_rating_for_service(service_id)

    def search_feedback(
        self,
        session_id: Optional[str] = None,
        min_rating: Optional[int] = None,
        max_rating: Optional[int] = None,
        has_comment: Optional[bool] = None
    ) -> List[SessionFeedback]:
        """Search feedback with filters."""
        return list(self.repository.search_feedback(
            session_id=session_id,
            min_rating=min_rating,
            max_rating=max_rating,
            has_comment=has_comment
        ))
