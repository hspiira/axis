"""Document repository for data access."""
from typing import Dict, List, Any, Optional
from datetime import date, timedelta
from django.db.models import QuerySet, Q
from django.utils import timezone

from axis_backend.repositories import BaseRepository
from apps.documents.models import Document
from axis_backend.enums import DocumentType, DocumentStatus


class DocumentRepository(BaseRepository[Document]):
    """
    Repository for Document model data access.

    Provides optimized queries and filtering for document management.
    """

    model = Document

    def get_queryset(self) -> QuerySet[Document]:
        """
        Get base queryset with common optimizations.
        
        Returns:
            QuerySet: Optimized document queryset
        """
        return Document.objects.select_related(
            'uploaded_by',
            'client',
            'contract',
            'previous_version'
        ).prefetch_related(
            'next_versions'
        )
    
    def _apply_search(self, queryset: QuerySet[Document], search: str) -> QuerySet[Document]:
        """
        Apply search filtering across relevant fields.
        
        Args:
            queryset: Base queryset
            search: Search term
            
        Returns:
            QuerySet: Filtered queryset
        """
        return queryset.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(tags__icontains=search)
        )
    
    def _apply_filters(self, queryset: QuerySet[Document], filters: Dict[str, Any]) -> QuerySet[Document]:
        """
        Apply filters to queryset.
        
        Args:
            queryset: Base queryset
            filters: Filter parameters
            
        Returns:
            QuerySet: Filtered queryset
        """
        if 'type' in filters:
            queryset = queryset.filter(type=filters['type'])
            
        if 'status' in filters:
            queryset = queryset.filter(status=filters['status'])
            
        if 'client_id' in filters:
            queryset = queryset.filter(client_id=filters['client_id'])
            
        if 'contract_id' in filters:
            queryset = queryset.filter(contract_id=filters['contract_id'])
            
        if 'uploaded_by_id' in filters:
            queryset = queryset.filter(uploaded_by_id=filters['uploaded_by_id'])
            
        if 'is_confidential' in filters:
            queryset = queryset.filter(is_confidential=filters['is_confidential'])
            
        if 'is_latest' in filters:
            queryset = queryset.filter(is_latest=filters['is_latest'])
            
        return queryset
    
    # === Custom Query Methods ===
    
    def get_by_type(self, document_type: str) -> QuerySet[Document]:
        """
        Get documents by type.
        
        Args:
            document_type: DocumentType value
            
        Returns:
            QuerySet: Documents of specified type
        """
        return self.get_queryset().filter(type=document_type)
    
    def get_by_client(self, client_id: str) -> QuerySet[Document]:
        """
        Get all documents for a client.
        
        Args:
            client_id: Client ID
            
        Returns:
            QuerySet: Client's documents
        """
        return self.get_queryset().filter(client_id=client_id)
    
    def get_by_contract(self, contract_id: str) -> QuerySet[Document]:
        """
        Get all documents for a contract.
        
        Args:
            contract_id: Contract ID
            
        Returns:
            QuerySet: Contract's documents
        """
        return self.get_queryset().filter(contract_id=contract_id)
    
    def get_by_uploader(self, user_id: str) -> QuerySet[Document]:
        """
        Get documents uploaded by a specific user.
        
        Args:
            user_id: User ID
            
        Returns:
            QuerySet: User's uploaded documents
        """
        return self.get_queryset().filter(uploaded_by_id=user_id)
    
    def get_published(self) -> QuerySet[Document]:
        """
        Get all published documents.
        
        Returns:
            QuerySet: Published documents
        """
        return self.get_queryset().filter(
            status=DocumentStatus.PUBLISHED,
            deleted_at__isnull=True
        )
    
    def get_latest_versions(self) -> QuerySet[Document]:
        """
        Get only the latest version of each document.
        
        Returns:
            QuerySet: Latest versions
        """
        return self.get_queryset().filter(
            is_latest=True,
            deleted_at__isnull=True
        )
    
    def get_expiring_soon(self, days: int = 30) -> QuerySet[Document]:
        """
        Get documents expiring within specified days.
        
        Args:
            days: Number of days to look ahead
            
        Returns:
            QuerySet: Documents expiring soon
        """
        today = timezone.now().date()
        expiry_threshold = today + timedelta(days=days)
        
        return self.get_queryset().filter(
            expiry_date__isnull=False,
            expiry_date__gt=today,
            expiry_date__lte=expiry_threshold,
            status=DocumentStatus.PUBLISHED,
            deleted_at__isnull=True
        )
    
    def get_expired(self) -> QuerySet[Document]:
        """
        Get all expired documents.
        
        Returns:
            QuerySet: Expired documents
        """
        today = timezone.now().date()
        
        return self.get_queryset().filter(
            expiry_date__isnull=False,
            expiry_date__lt=today,
            deleted_at__isnull=True
        )
    
    def get_confidential(self) -> QuerySet[Document]:
        """
        Get all confidential documents.
        
        Returns:
            QuerySet: Confidential documents
        """
        return self.get_queryset().filter(
            is_confidential=True,
            deleted_at__isnull=True
        )
    
    def search_documents(self, query: str) -> QuerySet[Document]:
        """
        Full-text search across document fields.
        
        Args:
            query: Search query
            
        Returns:
            QuerySet: Matching documents
        """
        return self._apply_search(self.get_queryset(), query)
    
    def get_by_tags(self, tags: List[str]) -> QuerySet[Document]:
        """
        Get documents containing any of the specified tags.
        
        Args:
            tags: List of tags to search for
            
        Returns:
            QuerySet: Documents with matching tags
        """
        q_objects = Q()
        for tag in tags:
            q_objects |= Q(tags__contains=tag)
        
        return self.get_queryset().filter(q_objects)
    
    def get_version_chain(self, document_id: str) -> QuerySet[Document]:
        """
        Get all versions of a document (past and future).
        
        Args:
            document_id: Any version of the document
            
        Returns:
            QuerySet: All versions ordered by version number
        """
        document = self.get_by_id(document_id)
        if not document:
            return Document.objects.none()
        
        # Find root document
        root = document
        while root.previous_version:
            root = root.previous_version
        
        # Get all versions starting from root
        version_ids = [root.id]
        current = root
        while current.next_versions.exists():
            current = current.next_versions.first()
            version_ids.append(current.id)
        
        return Document.objects.filter(id__in=version_ids).order_by('version')
