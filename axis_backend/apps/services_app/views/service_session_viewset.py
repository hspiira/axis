"""ViewSet for ServiceSession model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.services_app.models import ServiceSession
from apps.services_app.services import ServiceSessionService
from apps.services_app.serializers import (
    ServiceSessionListSerializer,
    ServiceSessionDetailSerializer,
    ServiceSessionCreateSerializer,
    ServiceSessionUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet
from axis_backend.permissions import IsClientScopedOrAdmin, CanModifyObject


@extend_schema_view(
    list=extend_schema(summary="List service sessions", tags=["Service Sessions"]),
    retrieve=extend_schema(summary="Get session details", tags=["Service Sessions"]),
    create=extend_schema(summary="Create session", tags=["Service Sessions"]),
    update=extend_schema(summary="Update session", tags=["Service Sessions"]),
    partial_update=extend_schema(summary="Partially update session", tags=["Service Sessions"]),
    destroy=extend_schema(summary="Delete session", tags=["Service Sessions"]),
)
class ServiceSessionViewSet(BaseModelViewSet):
    """ViewSet for ServiceSession CRUD operations."""

    queryset = ServiceSession.objects.all()
    permission_classes = [IsAuthenticated, IsClientScopedOrAdmin]
    service_class = ServiceSessionService
    list_serializer_class = ServiceSessionListSerializer
    detail_serializer_class = ServiceSessionDetailSerializer
    create_serializer_class = ServiceSessionCreateSerializer
    update_serializer_class = ServiceSessionUpdateSerializer

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
        summary="Get upcoming sessions",
        tags=["Service Sessions"],
        responses={200: ServiceSessionListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get sessions scheduled in the next N days."""
        days = int(request.query_params.get('days', 7))
        sessions = self.service.get_upcoming_sessions(days)
        serializer = ServiceSessionListSerializer(sessions, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get sessions by person",
        tags=["Service Sessions"],
        responses={200: ServiceSessionListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='person/(?P<person_id>[^/.]+)')
    def by_person(self, request, person_id=None):
        """Get upcoming sessions for a person."""
        sessions = self.service.get_person_upcoming_sessions(person_id)
        serializer = ServiceSessionListSerializer(sessions, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Complete session",
        tags=["Service Sessions"],
        responses={200: ServiceSessionDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark session as completed."""
        duration = request.data.get('duration')
        notes = request.data.get('notes')
        session = self.service.complete_session(pk, duration, notes)
        serializer = ServiceSessionDetailSerializer(session)
        return Response(serializer.data)

    @extend_schema(
        summary="Cancel session",
        tags=["Service Sessions"],
        responses={200: ServiceSessionDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a session."""
        reason = request.data.get('reason')
        session = self.service.cancel_session(pk, reason)
        serializer = ServiceSessionDetailSerializer(session)
        return Response(serializer.data)

    @extend_schema(
        summary="Reschedule session",
        tags=["Service Sessions"],
        responses={200: ServiceSessionDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reschedule a session."""
        from datetime import datetime
        new_datetime = datetime.fromisoformat(request.data.get('new_datetime'))
        session = self.service.reschedule_session(pk, new_datetime)
        serializer = ServiceSessionDetailSerializer(session)
        return Response(serializer.data)

    @extend_schema(
        summary="Search sessions",
        tags=["Service Sessions"],
        responses={200: ServiceSessionListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search sessions with filters."""
        service_id = request.query_params.get('service_id')
        provider_id = request.query_params.get('provider_id')
        person_id = request.query_params.get('person_id')
        status = request.query_params.get('status')
        is_group = request.query_params.get('is_group')
        is_upcoming = request.query_params.get('is_upcoming')

        if is_group is not None:
            is_group = is_group.lower() in ('true', '1', 'yes')
        if is_upcoming is not None:
            is_upcoming = is_upcoming.lower() in ('true', '1', 'yes')

        sessions = self.service.search_sessions(
            service_id=service_id,
            provider_id=provider_id,
            person_id=person_id,
            status=status,
            is_group=is_group,
            is_upcoming=is_upcoming
        )
        serializer = ServiceSessionListSerializer(sessions, many=True)
        return Response(serializer.data)
