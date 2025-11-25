"""Service for Document business logic."""
from typing import Optional, Dict, Any, List
from datetime import date, timedelta
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from axis_backend.services.base import BaseService
from apps.documents.repositories.document_repository import DocumentRepository
from apps.documents.models import Document
from axis_backend.enums import DocumentType, DocumentStatus


class DocumentService(BaseService[Document]):
    """
    Service for Document business logic.

    Responsibilities (Single Responsibility Principle):
    - Document creation and upload validation
    - Version management and history tracking
    - Publication and archival workflows
    - Expiry date validation and monitoring
    - Access control and confidentiality rules
    - Business rule enforcement

    Design Notes:
    - All database access through DocumentRepository
    - Transaction management for multi-step operations
    - Event triggers for external systems (future)
    """

    repository_class = DocumentRepository

    # === Document Creation and Upload ===

    @transaction.atomic
    def create_document(
        self,
        title: str,
        type: str,
        uploaded_by_id: str,
        file=None,
        url: Optional[str] = None,
        description: Optional[str] = None,
        file_size: Optional[int] = None,
        file_type: Optional[str] = None,
        client_id: Optional[str] = None,
        contract_id: Optional[str] = None,
        expiry_date: Optional[date] = None,
        is_confidential: bool = False,
        tags: Optional[List[str]] = None,
        **kwargs
    ) -> Document:
        """
        Create new document with validation.

        Business Rules:
        - Title and either file or URL are required
        - Document type must be valid
        - File size must be positive if provided
        - Expiry date must be in future if provided
        - Contract must belong to client if both specified
        - Uploaded by user must exist

        Args:
            title: Document title
            type: DocumentType choice
            uploaded_by_id: User ID who uploaded
            file: Document file upload (alternative to URL)
            url: Document file URL (alternative to file upload)
            description: Optional description
            file_size: File size in bytes
            file_type: MIME type
            client_id: Optional client ID
            contract_id: Optional contract ID
            expiry_date: Optional expiry date
            is_confidential: Confidential flag
            tags: Optional list of tags
            **kwargs: Additional fields

        Returns:
            Created Document instance

        Raises:
            ValidationError: If validation fails
        """
        # Validate required fields
        if not title or not title.strip():
            raise ValidationError({'title': 'Document title is required'})

        if not file and not url:
            raise ValidationError({'file': 'Either file upload or URL is required'})

        if not type:
            raise ValidationError({'type': 'Document type is required'})

        # Validate document type
        if type not in dict(DocumentType.choices):
            raise ValidationError({
                'type': f'Invalid document type: {type}'
            })

        # Validate file size
        if file_size is not None and file_size < 0:
            raise ValidationError({
                'file_size': 'File size must be positive'
            })

        # Validate expiry date
        if expiry_date and expiry_date <= timezone.now().date():
            raise ValidationError({
                'expiry_date': 'Expiry date must be in the future'
            })

        # Validate uploaded_by user exists
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=uploaded_by_id)
        except User.DoesNotExist:
            raise ValidationError({
                'uploaded_by_id': f'User with id {uploaded_by_id} does not exist'
            })

        # Validate client exists if provided
        if client_id:
            from apps.clients.models import Client
            try:
                client = Client.objects.get(id=client_id)
            except Client.DoesNotExist:
                raise ValidationError({
                    'client_id': f'Client with id {client_id} does not exist'
                })

        # Validate contract exists and belongs to client if provided
        if contract_id:
            from apps.contracts.models import Contract
            try:
                contract = Contract.objects.get(id=contract_id)

                # Validate contract belongs to client if both specified
                if client_id and str(contract.client_id) != client_id:
                    raise ValidationError({
                        'contract_id': 'Contract does not belong to specified client'
                    })
            except Contract.DoesNotExist:
                raise ValidationError({
                    'contract_id': f'Contract with id {contract_id} does not exist'
                })

        # Create document
        document = self.repository.create(
            title=title.strip(),
            description=description.strip() if description else None,
            type=type,
            file=file,
            url=url.strip() if url else None,
            file_size=file_size,
            file_type=file_type,
            uploaded_by_id=uploaded_by_id,
            client_id=client_id,
            contract_id=contract_id,
            expiry_date=expiry_date,
            is_confidential=is_confidential,
            tags=tags or [],
            status=DocumentStatus.DRAFT,
            version=1,
            is_latest=True,
            **kwargs
        )

        return document

    @transaction.atomic
    def update_document(
        self,
        document_id: str,
        **updates
    ) -> Document:
        """
        Update document metadata with validation.

        Business Rules:
        - Cannot change version number directly
        - Cannot change previous_version directly
        - Cannot change is_latest directly (use create_new_version)
        - Expiry date must be in future if changed
        - Contract must belong to client if both changed

        Args:
            document_id: Document ID
            **updates: Fields to update

        Returns:
            Updated Document instance

        Raises:
            ValidationError: If validation fails
        """
        document = self.repository.get_by_id(document_id)
        if not document:
            raise ValidationError({
                'document_id': f'Document with id {document_id} does not exist'
            })

        # Prevent direct modification of version fields
        forbidden_fields = ['version', 'previous_version', 'is_latest']
        for field in forbidden_fields:
            if field in updates:
                raise ValidationError({
                    field: f'Cannot modify {field} directly. Use create_new_version() instead.'
                })

        # Validate expiry date if being updated
        if 'expiry_date' in updates:
            expiry_date = updates['expiry_date']
            if expiry_date and expiry_date <= timezone.now().date():
                raise ValidationError({
                    'expiry_date': 'Expiry date must be in the future'
                })

        # Validate contract belongs to client if both being updated
        if 'contract_id' in updates and 'client_id' in updates:
            from apps.contracts.models import Contract
            try:
                contract = Contract.objects.get(id=updates['contract_id'])
                if str(contract.client_id) != updates['client_id']:
                    raise ValidationError({
                        'contract_id': 'Contract does not belong to specified client'
                    })
            except Contract.DoesNotExist:
                raise ValidationError({
                    'contract_id': f'Contract with id {updates["contract_id"]} does not exist'
                })

        # Update document
        return self.repository.update(document, **updates)

    # === Publication Workflow ===

    @transaction.atomic
    def publish_document(self, document_id: str) -> Document:
        """
        Publish document with validation.

        Business Rules:
        - Document must be in DRAFT status
        - Document must be latest version
        - Document must not be expired
        - Document must have valid URL

        Args:
            document_id: Document ID

        Returns:
            Published Document instance

        Raises:
            ValidationError: If validation fails
        """
        document = self.repository.get_by_id(document_id)
        if not document:
            raise ValidationError({
                'document_id': f'Document with id {document_id} does not exist'
            })

        # Validate document is in DRAFT status
        if document.status != DocumentStatus.DRAFT:
            raise ValidationError({
                'status': f'Can only publish documents in DRAFT status. Current status: {document.status}'
            })

        # Validate document is latest version
        if not document.is_latest:
            raise ValidationError({
                'is_latest': 'Can only publish the latest version of a document'
            })

        # Validate document is not expired
        if document.is_expired:
            raise ValidationError({
                'expiry_date': 'Cannot publish expired document'
            })

        # Validate either file or URL exists
        if not document.file and not document.url:
            raise ValidationError({
                'file': 'Document must have a valid file or URL to be published'
            })

        # Publish document
        document.publish()

        return document

    @transaction.atomic
    def archive_document(self, document_id: str, reason: Optional[str] = None) -> Document:
        """
        Archive document with validation.

        Business Rules:
        - Document must be PUBLISHED
        - Archived documents cannot be restored to published status
        - Reason is optional but recommended for audit trail

        Args:
            document_id: Document ID
            reason: Optional reason for archival

        Returns:
            Archived Document instance

        Raises:
            ValidationError: If validation fails
        """
        document = self.repository.get_by_id(document_id)
        if not document:
            raise ValidationError({
                'document_id': f'Document with id {document_id} does not exist'
            })

        # Validate document is published
        if document.status != DocumentStatus.PUBLISHED:
            raise ValidationError({
                'status': f'Can only archive PUBLISHED documents. Current status: {document.status}'
            })

        # Archive document
        document.archive()

        # Store reason in metadata if provided
        if reason:
            metadata = document.metadata or {}
            metadata['archive_reason'] = reason
            metadata['archived_at'] = timezone.now().isoformat()
            document.metadata = metadata
            document.save(update_fields=['metadata', 'updated_at'])

        return document

    # === Version Management ===

    @transaction.atomic
    def create_new_version(
        self,
        document_id: str,
        uploaded_by_id: str,
        file=None,
        url: Optional[str] = None,
        description: Optional[str] = None
    ) -> Document:
        """
        Create new version of document.

        Business Rules:
        - Original document must exist
        - Original must be latest version
        - Either file or URL must be provided
        - New version starts in DRAFT status
        - Previous version is marked as not latest

        Args:
            document_id: Original document ID
            uploaded_by_id: User creating new version
            file: New document file (alternative to URL)
            url: New document file URL (alternative to file)
            description: Optional updated description

        Returns:
            New Document version instance

        Raises:
            ValidationError: If validation fails
        """
        original = self.repository.get_by_id(document_id)
        if not original:
            raise ValidationError({
                'document_id': f'Document with id {document_id} does not exist'
            })

        # Validate original is latest version
        if not original.is_latest:
            raise ValidationError({
                'is_latest': 'Can only create new version from the latest version'
            })

        # Validate either file or URL is provided
        if not file and not url:
            raise ValidationError({
                'file': 'Either file upload or URL is required for new version'
            })

        # Validate uploader exists
        from apps.authentication.models import User
        try:
            user = User.objects.get(id=uploaded_by_id)
        except User.DoesNotExist:
            raise ValidationError({
                'uploaded_by_id': f'User with id {uploaded_by_id} does not exist'
            })

        # Create new version using model method
        new_version = original.create_new_version(file=file, url=url, uploaded_by=user)

        # Update description if provided
        if description:
            new_version.description = description
            new_version.save(update_fields=['description', 'updated_at'])

        return new_version

    def get_version_history(self, document_id: str) -> List[Document]:
        """
        Get all versions of a document.

        Args:
            document_id: Any version of the document

        Returns:
            List of all Document versions ordered by version number

        Raises:
            ValidationError: If document doesn't exist
        """
        document = self.repository.get_by_id(document_id)
        if not document:
            raise ValidationError({
                'document_id': f'Document with id {document_id} does not exist'
            })

        return document.get_version_history()

    # === Expiry Management ===

    def check_expiry(self, document_id: str) -> Dict[str, Any]:
        """
        Check document expiry status.

        Args:
            document_id: Document ID

        Returns:
            Dictionary with expiry information

        Raises:
            ValidationError: If document doesn't exist
        """
        document = self.repository.get_by_id(document_id)
        if not document:
            raise ValidationError({
                'document_id': f'Document with id {document_id} does not exist'
            })

        if not document.expiry_date:
            return {
                'has_expiry': False,
                'is_expired': False,
                'expiry_date': None,
                'days_until_expiry': None
            }

        today = timezone.now().date()
        days_until_expiry = (document.expiry_date - today).days

        return {
            'has_expiry': True,
            'is_expired': document.is_expired,
            'expiry_date': document.expiry_date,
            'days_until_expiry': days_until_expiry,
            'expires_soon': 0 < days_until_expiry <= 30
        }

    def get_expiring_documents(self, days: int = 30) -> List[Document]:
        """
        Get documents expiring within specified days.

        Args:
            days: Number of days to look ahead (default: 30)

        Returns:
            List of expiring documents
        """
        return list(self.repository.get_expiring_soon(days=days))

    def get_expired_documents(self) -> List[Document]:
        """
        Get all expired documents.

        Returns:
            List of expired documents
        """
        return list(self.repository.get_expired())
