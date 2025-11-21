"""Document model - file and document management."""
from django.db import models
from django.core.validators import MinValueValidator

from axis_backend.models import BaseModel
from axis_backend.enums import DocumentType, DocumentStatus


class Document(BaseModel):
    """
    Document storage and version management.

    Responsibilities:
    - Store document metadata and location
    - Manage document versioning
    - Track document lifecycle
    - Support confidentiality and expiration
    """

    title = models.CharField(
        max_length=255,
        db_index=True,
        help_text="Document title"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Document description and purpose"
    )
    type = models.CharField(
        max_length=30,
        choices=DocumentType.choices,
        db_index=True,
        help_text="Document classification"
    )
    url = models.URLField(
        max_length=500,
        help_text="Document file location (cloud storage URL)"
    )
    file_size = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="File size in bytes"
    )
    file_type = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="MIME type (e.g., 'application/pdf')"
    )

    # === Versioning ===
    version = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Document version number"
    )
    is_latest = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this is the current version"
    )
    previous_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='next_versions',
        help_text="Link to previous version"
    )

    # === Status and Access ===
    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.choices,
        default=DocumentStatus.DRAFT,
        db_index=True,
        help_text="Document publication status"
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        db_index=True,
        help_text="Document expiration date"
    )
    is_confidential = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Restricted access document"
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Document tags for categorization"
    )

    # === Relationships ===
    uploaded_by = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_documents',
        db_index=True,
        help_text="User who uploaded document"
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='documents',
        db_index=True,
        help_text="Associated client"
    )
    contract = models.ForeignKey(
        'contracts.Contract',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='documents',
        db_index=True,
        help_text="Associated contract"
    )

    # === Additional Information ===
    metadata = models.JSONField(
        null=True,
        blank=True,
        default=dict,
        help_text="Document-specific attributes"
    )

    class Meta:
        db_table = 'documents'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['type']),
            models.Index(fields=['status']),
            models.Index(fields=['client']),
            models.Index(fields=['contract']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['is_confidential']),
            models.Index(fields=['is_latest']),
            models.Index(fields=['expiry_date']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return f"{self.title} (v{self.version})"

    def __repr__(self):
        return f"<Document: {self.title} v{self.version}>"

    @property
    def is_expired(self) -> bool:
        """Check if document has passed expiry date."""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.expiry_date

    @property
    def is_active(self) -> bool:
        """Check if document is published and current."""
        return (
            self.status == DocumentStatus.PUBLISHED and
            self.is_latest and
            not self.is_expired and
            self.deleted_at is None
        )

    def publish(self) -> None:
        """Publish document."""
        self.status = DocumentStatus.PUBLISHED
        self.save(update_fields=['status', 'updated_at'])

    def archive(self) -> None:
        """Archive document."""
        self.status = DocumentStatus.ARCHIVED
        self.save(update_fields=['status', 'updated_at'])

    def create_new_version(self, url: str, uploaded_by=None) -> 'Document':
        """
        Create a new version of this document.

        Args:
            url: New document file URL
            uploaded_by: User creating new version

        Returns:
            Document: New version instance
        """
        # Mark current version as not latest
        self.is_latest = False
        self.save(update_fields=['is_latest', 'updated_at'])

        # Create new version
        new_version = Document.objects.create(
            title=self.title,
            description=self.description,
            type=self.type,
            url=url,
            version=self.version + 1,
            is_latest=True,
            previous_version=self,
            status=DocumentStatus.DRAFT,
            is_confidential=self.is_confidential,
            tags=self.tags.copy() if self.tags else [],
            uploaded_by=uploaded_by,
            client=self.client,
            contract=self.contract,
        )
        return new_version

    def get_version_history(self):
        """
        Retrieve all versions of this document.

        Returns:
            QuerySet: All document versions ordered by version number
        """
        # Get the root document
        root = self
        while root.previous_version:
            root = root.previous_version

        # Get all versions from root
        all_versions = [root]
        current = root
        while current.next_versions.exists():
            current = current.next_versions.first()
            all_versions.append(current)

        return all_versions
