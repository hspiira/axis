"""ViewSet for SessionFeedback model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.services_app.models import SessionFeedback
from apps.services_app.services import SessionFeedbackService
from apps.services_app.serializers import (
    SessionFeedbackListSerializer,
    SessionFeedbackDetailSerializer,
    SessionFeedbackCreateSerializer,
    SessionFeedbackUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import IsClientScopedOrAdmin, CanModifyObject


@extend_schema_view(
    list=extend_schema(summary="List session feedback", tags=["Session Feedback"]),
    retrieve=extend_schema(summary="Get feedback details", tags=["Session Feedback"]),
    create=extend_schema(summary="Create feedback", tags=["Session Feedback"]),
    update=extend_schema(summary="Update feedback", tags=["Session Feedback"]),
    partial_update=extend_schema(summary="Partially update feedback", tags=["Session Feedback"]),
    destroy=extend_schema(summary="Delete feedback", tags=["Session Feedback"]),
)
class SessionFeedbackViewSet(BaseModelViewSet):
    """ViewSet for SessionFeedback CRUD operations."""

    queryset = SessionFeedback.objects.all()
    permission_classes = [IsAuthenticated, IsClientScopedOrAdmin]
    service_class = SessionFeedbackService
    list_serializer_class = SessionFeedbackListSerializer
    detail_serializer_class = SessionFeedbackDetailSerializer
    create_serializer_class = SessionFeedbackCreateSerializer
    update_serializer_class = SessionFeedbackUpdateSerializer

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Permissions:
        - list, retrieve: IsAuthenticated + IsClientScopedOrAdmin
        - create, update, partial_update, destroy: + CanModifyObject
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsClientScopedOrAdmin(), CanModifyObject()]
        else:
            return [IsAuthenticated(), IsClientScopedOrAdmin()]

    @extend_schema(
        summary="Get average rating for provider",
        tags=["Session Feedback"],
        responses={200: {'type': 'object', 'properties': {'average_rating': {'type': 'number'}}}}
    )
    @action(detail=False, methods=['get'], url_path='provider-rating/(?P<provider_id>[^/.]+)')
    def provider_rating(self, request, provider_id=None):
        """Calculate average rating for a provider."""
        avg_rating = self.service.get_average_rating_for_provider(provider_id)
        return Response({'provider_id': provider_id, 'average_rating': avg_rating})

    @extend_schema(
        summary="Get average rating for service",
        tags=["Session Feedback"],
        responses={200: {'type': 'object', 'properties': {'average_rating': {'type': 'number'}}}}
    )
    @action(detail=False, methods=['get'], url_path='service-rating/(?P<service_id>[^/.]+)')
    def service_rating(self, request, service_id=None):
        """Calculate average rating for a service."""
        avg_rating = self.service.get_average_rating_for_service(service_id)
        return Response({'service_id': service_id, 'average_rating': avg_rating})

    @extend_schema(
        summary="Search feedback",
        tags=["Session Feedback"],
        responses={200: SessionFeedbackListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search feedback with filters."""
        session_id = request.query_params.get('session_id')
        min_rating = request.query_params.get('min_rating')
        max_rating = request.query_params.get('max_rating')
        has_comment = request.query_params.get('has_comment')

        if min_rating:
            min_rating = int(min_rating)
        if max_rating:
            max_rating = int(max_rating)
        if has_comment is not None:
            has_comment = has_comment.lower() in ('true', '1', 'yes')

        feedback_list = self.service.search_feedback(
            session_id=session_id,
            min_rating=min_rating,
            max_rating=max_rating,
            has_comment=has_comment
        )
        serializer = SessionFeedbackListSerializer(feedback_list, many=True)
        return Response(serializer.data)
