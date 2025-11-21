"""SessionFeedback model - session ratings and feedback."""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from axis_backend.models import BaseModel


class SessionFeedback(BaseModel):
    """
    Feedback and rating for completed service sessions.

    Responsibilities:
    - Collect session quality ratings
    - Store participant feedback
    - Support provider performance tracking
    """

    session = models.ForeignKey(
        'services_app.ServiceSession',
        on_delete=models.CASCADE,
        related_name='feedback_entries',
        db_index=True,
        help_text="Session being rated"
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Session rating (1-5 scale)"
    )
    comment = models.TextField(
        null=True,
        blank=True,
        help_text="Written feedback"
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Additional feedback data"
    )

    class Meta:
        db_table = 'session_feedback'
        verbose_name = 'Session Feedback'
        verbose_name_plural = 'Session Feedback'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session']),
            models.Index(fields=['rating']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"Feedback for {self.session} ({self.rating}/5)"
