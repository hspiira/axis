"""Base ViewSets for common patterns."""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from typing import Optional, Type
from django.core.exceptions import ValidationError as DjangoValidationError


class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for all model ViewSets.

    Responsibilities (Single Responsibility Principle):
    - HTTP request/response handling
    - Authentication & permissions
    - Delegating to service layer
    - Standard CRUD operations

    Design Notes (SOLID):
    - Single Responsibility: Only handles HTTP, no business logic
    - Open/Closed: Extend for specific models
    - Dependency Inversion: Depends on service abstraction
    - Interface Segregation: Different serializers for different actions
    """

    # Default configuration
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Service class - must be set in subclass
    service_class = None

    # Serializer classes for different actions
    list_serializer_class = None
    detail_serializer_class = None
    create_serializer_class = None
    update_serializer_class = None

    def __init__(self, *args, **kwargs):
        """
        Initialize ViewSet with service.

        Raises:
            NotImplementedError: If service_class not defined
        """
        super().__init__(*args, **kwargs)

        if self.service_class is None:
            raise NotImplementedError(
                f"{self.__class__.__name__} must define 'service_class'"
            )

        self.service = self.service_class()

    def get_queryset(self):
        """
        Get queryset via service layer.

        Returns:
            QuerySet from repository
        """
        return self.service.repository.get_queryset()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.

        Interface Segregation: Different serializers for different needs

        Returns:
            Serializer class for current action
        """
        if self.action == 'list' and self.list_serializer_class:
            return self.list_serializer_class
        elif self.action == 'retrieve' and self.detail_serializer_class:
            return self.detail_serializer_class
        elif self.action == 'create' and self.create_serializer_class:
            return self.create_serializer_class
        elif self.action in ['update', 'partial_update'] and self.update_serializer_class:
            return self.update_serializer_class

        # Fallback to default serializer_class
        return super().get_serializer_class()

    def list(self, request, *args, **kwargs):
        """
        List instances with filtering, search, and pagination.

        Delegates to service layer for business logic.

        Args:
            request: HTTP request

        Returns:
            Response with paginated results
        """
        # Get filter parameters
        filters = self.get_filters_from_request(request)
        search = request.query_params.get('search', '')
        ordering = self.get_ordering_from_request(request)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))

        # Get data from service
        result = self.service.list(
            filters=filters,
            search=search,
            ordering=ordering,
            page=page,
            page_size=page_size
        )

        # Serialize
        serializer = self.get_serializer(result['results'], many=True)

        return Response({
            'results': serializer.data,
            'count': result['count'],
            'page': result['page'],
            'page_size': result['page_size'],
            'total_pages': result['total_pages']
        })

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve single instance.

        Delegates to service layer.

        Args:
            request: HTTP request
            pk: Primary key

        Returns:
            Response with instance data
        """
        instance = self.service.get(kwargs.get('pk'))

        if not instance:
            return Response(
                {'error': 'Not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create new instance.

        Validates input and delegates to service layer.

        Args:
            request: HTTP request with creation data

        Returns:
            Response with created instance
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            instance = self.service.create(serializer.validated_data)
            response_serializer = self.detail_serializer_class(instance)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except DjangoValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        """
        Update existing instance.

        Validates input and delegates to service layer.

        Args:
            request: HTTP request with update data
            pk: Primary key

        Returns:
            Response with updated instance
        """
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            instance = self.service.update(
                kwargs.get('pk'),
                serializer.validated_data
            )
            response_serializer = self.detail_serializer_class(instance)
            return Response(response_serializer.data)
        except DjangoValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, *args, **kwargs):
        """
        Partially update existing instance.

        Args:
            request: HTTP request with partial update data
            pk: Primary key

        Returns:
            Response with updated instance
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete instance (soft delete if supported).

        Delegates to service layer.

        Args:
            request: HTTP request
            pk: Primary key

        Returns:
            Response with 204 No Content
        """
        try:
            self.service.delete(kwargs.get('pk'))
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DjangoValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Helper methods

    def get_filters_from_request(self, request) -> dict:
        """
        Extract filters from request query parameters.

        Override in subclass to add custom filter extraction.

        Args:
            request: HTTP request

        Returns:
            Dictionary of filters
        """
        filters = {}

        # Get filterset fields if available
        if hasattr(self, 'filterset_fields'):
            for field in self.filterset_fields:
                value = request.query_params.get(field)
                if value is not None:
                    filters[field] = value

        return filters

    def get_ordering_from_request(self, request) -> Optional[list]:
        """
        Extract ordering from request query parameters.

        Args:
            request: HTTP request

        Returns:
            List of ordering fields or None
        """
        ordering = request.query_params.get('ordering')
        if ordering:
            return ordering.split(',')

        # Use default ordering if set
        if hasattr(self, 'ordering') and self.ordering:
            return self.ordering if isinstance(self.ordering, list) else [self.ordering]

        return None

    def handle_exception(self, exc):
        """
        Handle exceptions consistently.

        Args:
            exc: Exception

        Returns:
            Response with error details
        """
        if isinstance(exc, DjangoValidationError):
            return Response(
                {'error': exc.message_dict if hasattr(exc, 'message_dict') else str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return super().handle_exception(exc)


class BaseReadOnlyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Base ViewSet for read-only operations.

    Use for resources that should not be modified via API.

    Responsibilities:
    - List and retrieve only
    - No create, update, or delete
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    service_class = None
    list_serializer_class = None
    detail_serializer_class = None

    def __init__(self, *args, **kwargs):
        """Initialize ViewSet with service."""
        super().__init__(*args, **kwargs)

        if self.service_class is None:
            raise NotImplementedError(
                f"{self.__class__.__name__} must define 'service_class'"
            )

        self.service = self.service_class()

    def get_queryset(self):
        """Get queryset via service layer."""
        return self.service.repository.get_queryset()

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list' and self.list_serializer_class:
            return self.list_serializer_class
        elif self.action == 'retrieve' and self.detail_serializer_class:
            return self.detail_serializer_class

        return super().get_serializer_class()
