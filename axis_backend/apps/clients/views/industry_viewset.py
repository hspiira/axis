"""ViewSet for Industry model."""
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view

from apps.clients.models import Industry
from apps.clients.services import IndustryService
from apps.clients.serializers import (
    IndustryListSerializer,
    IndustryDetailSerializer,
    IndustryCreateSerializer,
    IndustryUpdateSerializer,
)
from axis_backend.views import BaseModelViewSet


@extend_schema_view(
    list=extend_schema(summary="List industries", tags=["Industries"]),
    retrieve=extend_schema(summary="Get industry details", tags=["Industries"]),
    create=extend_schema(summary="Create industry", tags=["Industries"]),
    update=extend_schema(summary="Update industry", tags=["Industries"]),
    partial_update=extend_schema(summary="Partially update industry", tags=["Industries"]),
    destroy=extend_schema(summary="Delete industry", tags=["Industries"]),
)
class IndustryViewSet(BaseModelViewSet):
    """
    ViewSet for Industry CRUD operations.

    Provides industry classification management with hierarchical support.
    """

    queryset = Industry.objects.all()
    permission_classes = [IsAuthenticated]
    service_class = IndustryService
    list_serializer_class = IndustryListSerializer
    detail_serializer_class = IndustryDetailSerializer
    create_serializer_class = IndustryCreateSerializer
    update_serializer_class = IndustryUpdateSerializer

    @extend_schema(
        summary="Get root industries",
        tags=["Industries"],
        responses={200: IndustryListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def roots(self, request):
        """Get all top-level industries (no parent)."""
        industries = self.service.get_root_industries()
        serializer = IndustryListSerializer(industries, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get industry children",
        tags=["Industries"],
        responses={200: IndustryListSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """Get direct children of an industry."""
        children = self.service.get_children(pk)
        serializer = IndustryListSerializer(children, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get industry descendants",
        tags=["Industries"],
        responses={200: IndustryListSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def descendants(self, request, pk=None):
        """Get all descendants of an industry."""
        descendants = self.service.get_descendants(pk)
        serializer = IndustryListSerializer(descendants, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get industry tree",
        tags=["Industries"],
        responses={200: dict}
    )
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get complete industry hierarchy as tree structure."""
        tree = self.service.get_industry_tree()
        return Response(tree)

    @extend_schema(
        summary="Get industry subtree",
        tags=["Industries"],
        responses={200: dict}
    )
    @action(detail=True, methods=['get'])
    def subtree(self, request, pk=None):
        """Get industry hierarchy starting from specific industry."""
        tree = self.service.get_industry_tree(root_id=pk)
        return Response(tree)

    @extend_schema(
        summary="Search industries",
        tags=["Industries"],
        responses={200: IndustryListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search industries with filters."""
        name = request.query_params.get('name')
        code = request.query_params.get('code')
        parent_id = request.query_params.get('parent_id')
        has_children = request.query_params.get('has_children')

        # Convert has_children to boolean if provided
        if has_children is not None:
            has_children = has_children.lower() in ('true', '1', 'yes')

        industries = self.service.search_industries(
            name=name,
            code=code,
            parent_id=parent_id,
            has_children=has_children
        )
        serializer = IndustryListSerializer(industries, many=True)
        return Response(serializer.data)
