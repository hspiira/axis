"""ViewSet for Document model."""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.core.exceptions import ValidationError

from axis_backend.views.base import BaseModelViewSet
from axis_backend.permissions import IsAdminOrManager, CanManageDocuments
from apps.documents.services.document_service import DocumentService
from apps.documents.serializers.document_serializer import (
    DocumentListSerializer,
    DocumentDetailSerializer,
    DocumentCreateSerializer,
    DocumentUpdateSerializer,
    DocumentVersionSerializer
)


@extend_schema_view(
    list=extend_schema(
        summary="List all documents",
        description="Get paginated list of documents with filtering and search",
        parameters=[
            OpenApiParameter('type', OpenApiTypes.STR, description='Filter by document type'),
            OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status (DRAFT/PUBLISHED/ARCHIVED)'),
            OpenApiParameter('client_id', OpenApiTypes.STR, description='Filter by client ID'),
            OpenApiParameter('contract_id', OpenApiTypes.STR, description='Filter by contract ID'),
            OpenApiParameter('uploaded_by_id', OpenApiTypes.STR, description='Filter by uploader user ID'),
            OpenApiParameter('is_confidential', OpenApiTypes.BOOL, description='Filter confidential documents'),
            OpenApiParameter('is_latest', OpenApiTypes.BOOL, description='Filter latest versions only'),
            OpenApiParameter('search', OpenApiTypes.STR, description='Search by title, description, tags'),
            OpenApiParameter('page', OpenApiTypes.INT, description='Page number'),
            OpenApiParameter('page_size', OpenApiTypes.INT, description='Items per page'),
        ]
    ),
    retrieve=extend_schema(
        summary="Get document details",
        description="Get detailed information about a specific document"
    ),
    create=extend_schema(
        summary="Upload new document",
        description="Create new document with metadata"
    ),
    update=extend_schema(
        summary="Update document",
        description="Update document metadata (cannot change version or URL)"
    ),
    partial_update=extend_schema(
        summary="Partially update document",
        description="Partially update document metadata"
    ),
    destroy=extend_schema(
        summary="Delete document",
        description="Soft delete document"
    )
)
class DocumentViewSet(BaseModelViewSet):
    """
    ViewSet for Document management.

    Responsibilities (Single Responsibility Principle):
    - HTTP request/response handling
    - Authentication & permissions
    - Data serialization
    - API documentation

    Design Notes:
    - Extends BaseModelViewSet for standard CRUD
    - Delegates all business logic to DocumentService
    - Uses different serializers per action (Interface Segregation)
    - Custom actions for document workflow operations
    - Supports file uploads via MultiPartParser and JSONParser for flexibility
    """

    # Service and serializer configuration
    service_class = DocumentService
    list_serializer_class = DocumentListSerializer
    detail_serializer_class = DocumentDetailSerializer
    create_serializer_class = DocumentCreateSerializer
    update_serializer_class = DocumentUpdateSerializer

    # Permissions
    permission_classes = [IsAuthenticated]

    # Parser classes for file upload support
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Filtering and search
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'client', 'contract', 'uploaded_by', 'is_confidential', 'is_latest']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'expiry_date', 'version', 'title']
    ordering = ['-created_at']

    def get_permissions(self):
        """
        Return appropriate permissions based on action.

        Different actions require different permission levels:
        - list, retrieve: IsAuthenticated (basic access)
        - create: IsAuthenticated (anyone can upload)
        - update, partial_update, destroy: CanManageDocuments (elevated)
        - publish, archive, create_version: CanManageDocuments (elevated)

        Returns:
            List of permission instances for current action
        """
        if self.action in ['update', 'partial_update', 'destroy', 'publish', 'archive', 'create_version']:
            permission_classes = [CanManageDocuments]
        else:
            # list, retrieve, create - basic authenticated access
            permission_classes = [IsAuthenticated]

        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """
        Create new document.

        Delegates business logic to DocumentService.

        Args:
            request: HTTP request with document data

        Returns:
            Response with created document
        """
        serializer = self.create_serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            document = self.service.create_document(**serializer.validated_data)
            response_serializer = self.detail_serializer_class(document)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Custom Actions

    @extend_schema(
        summary="Publish document",
        description="Publish document (change status from DRAFT to PUBLISHED)",
        responses={200: DocumentDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish document.

        Business logic delegated to DocumentService.

        Args:
            request: HTTP request
            pk: Document ID

        Returns:
            Response with published document
        """
        try:
            document = self.service.publish_document(document_id=pk)
            serializer = self.detail_serializer_class(document)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Archive document",
        description="Archive published document",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'reason': {'type': 'string', 'description': 'Reason for archival'}
                }
            }
        },
        responses={200: DocumentDetailSerializer}
    )
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """
        Archive document.

        Business logic delegated to DocumentService.

        Args:
            request: HTTP request with optional reason
            pk: Document ID

        Returns:
            Response with archived document
        """
        reason = request.data.get('reason')

        try:
            document = self.service.archive_document(document_id=pk, reason=reason)
            serializer = self.detail_serializer_class(document)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Create new version",
        description="Create new version of document with new file or URL (one required)",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {'type': 'string', 'format': 'binary', 'description': 'New document file (alternative to URL)'},
                    'url': {'type': 'string', 'description': 'New document file URL (alternative to file upload)'},
                    'uploaded_by_id': {'type': 'string', 'description': 'User ID creating new version'},
                    'description': {'type': 'string', 'description': 'Optional updated description'}
                },
                'required': ['uploaded_by_id']
            }
        },
        responses={201: DocumentDetailSerializer}
    )
    @action(detail=True, methods=['post'], url_path='create-version')
    def create_version(self, request, pk=None):
        """
        Create new version of document.

        Business logic delegated to DocumentService.
        Supports both file upload and URL-based storage.

        Args:
            request: HTTP request with version data (file or url)
            pk: Original document ID

        Returns:
            Response with new document version
        """
        file = request.data.get('file')
        url = request.data.get('url')
        uploaded_by_id = request.data.get('uploaded_by_id')
        description = request.data.get('description')

        if not file and not url:
            return Response(
                {'error': 'Either file or URL is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not uploaded_by_id:
            return Response(
                {'error': 'uploaded_by_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_version = self.service.create_new_version(
                document_id=pk,
                file=file,
                url=url,
                uploaded_by_id=uploaded_by_id,
                description=description
            )
            serializer = self.detail_serializer_class(new_version)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get version history",
        description="Get all versions of this document ordered by version number",
        responses={200: DocumentVersionSerializer(many=True)}
    )
    @action(detail=True, methods=['get'], url_path='version-history')
    def version_history(self, request, pk=None):
        """
        Get version history for document.

        Business logic delegated to DocumentService.

        Args:
            request: HTTP request
            pk: Document ID (any version)

        Returns:
            Response with all document versions
        """
        try:
            versions = self.service.get_version_history(document_id=pk)
            serializer = DocumentVersionSerializer(versions, many=True)
            return Response(serializer.data)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Check expiry status",
        description="Get expiry information for document",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'has_expiry': {'type': 'boolean'},
                    'is_expired': {'type': 'boolean'},
                    'expiry_date': {'type': 'string', 'format': 'date', 'nullable': True},
                    'days_until_expiry': {'type': 'integer', 'nullable': True},
                    'expires_soon': {'type': 'boolean'}
                }
            }
        }
    )
    @action(detail=True, methods=['get'], url_path='check-expiry')
    def check_expiry(self, request, pk=None):
        """
        Check document expiry status.

        Business logic delegated to DocumentService.

        Args:
            request: HTTP request
            pk: Document ID

        Returns:
            Response with expiry information
        """
        try:
            expiry_info = self.service.check_expiry(document_id=pk)
            return Response(expiry_info)
        except ValidationError as e:
            return Response(
                {'error': e.message_dict if hasattr(e, 'message_dict') else str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get expiring documents",
        description="Get documents expiring within specified days",
        parameters=[
            OpenApiParameter('days', OpenApiTypes.INT, description='Days to look ahead (default: 30)')
        ],
        responses={200: DocumentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='expiring-soon')
    def expiring_soon(self, request):
        """
        Get documents expiring soon.

        Business logic delegated to DocumentService.

        Args:
            request: HTTP request with optional days parameter

        Returns:
            Response with expiring documents
        """
        days = int(request.query_params.get('days', 30))

        try:
            documents = self.service.get_expiring_documents(days=days)
            serializer = self.list_serializer_class(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get expired documents",
        description="Get all documents that have passed their expiry date",
        responses={200: DocumentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def expired(self, request):
        """
        Get expired documents.

        Business logic delegated to DocumentService.

        Args:
            request: HTTP request

        Returns:
            Response with expired documents
        """
        try:
            documents = self.service.get_expired_documents()
            serializer = self.list_serializer_class(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get published documents",
        description="Get all published documents",
        responses={200: DocumentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def published(self, request):
        """
        Get published documents.

        Args:
            request: HTTP request

        Returns:
            Response with published documents
        """
        try:
            documents = list(self.service.repository.get_published())
            serializer = self.list_serializer_class(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get latest versions",
        description="Get only the latest version of each document",
        responses={200: DocumentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='latest-versions')
    def latest_versions(self, request):
        """
        Get latest versions of all documents.

        Args:
            request: HTTP request

        Returns:
            Response with latest document versions
        """
        try:
            documents = list(self.service.repository.get_latest_versions())
            serializer = self.list_serializer_class(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @extend_schema(
        summary="Get confidential documents",
        description="Get all confidential documents (requires elevated permissions)",
        responses={200: DocumentListSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def confidential(self, request):
        """
        Get confidential documents.

        Args:
            request: HTTP request

        Returns:
            Response with confidential documents
        """
        try:
            documents = list(self.service.repository.get_confidential())
            serializer = self.list_serializer_class(documents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
