"""Role and Permission models - RBAC authorization system."""
from django.db import models

from axis_backend.models import BaseModel


class Role(BaseModel):
    """
    User role for group-based permissions.

    Responsibilities (Single Responsibility Principle):
    - Define named permission groups
    - Enable role-based access control (RBAC)
    - Support role hierarchy through permissions

    Design Notes:
    - Many-to-many with Permission via RolePermission
    - Many-to-many with User via UserRole
    - Soft delete preserves role history for audit
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Role name (e.g., 'Admin', 'Manager', 'Staff')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Role purpose and responsibilities"
    )

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<Role: {self.name}>"

    def add_permission(self, permission: 'Permission') -> 'RolePermission':
        """
        Grant permission to this role.

        Args:
            permission: Permission instance to add

        Returns:
            RolePermission: Created association
        """
        role_permission, created = RolePermission.objects.get_or_create(
            role=self,
            permission=permission
        )
        return role_permission

    def remove_permission(self, permission: 'Permission') -> None:
        """
        Revoke permission from this role.

        Args:
            permission: Permission instance to remove
        """
        RolePermission.objects.filter(role=self, permission=permission).delete()

    def has_permission(self, permission_name: str) -> bool:
        """
        Check if role has specific permission.

        Args:
            permission_name: Permission name to check

        Returns:
            bool: True if role has permission
        """
        return self.permissions.filter(name=permission_name).exists()

    def get_permissions(self):
        """
        Retrieve all permissions for this role.

        Returns:
            QuerySet: Permission objects
        """
        return Permission.objects.filter(
            roles__role=self,
            deleted_at__isnull=True
        )


class Permission(BaseModel):
    """
    Granular permission for specific actions.

    Responsibilities (Single Responsibility Principle):
    - Define atomic permission units
    - Enable fine-grained access control
    - Support permission naming convention

    Design Notes:
    - Convention: action_resource (e.g., 'view_client', 'edit_contract')
    - Soft delete preserves permission history
    - Many-to-many with Role via RolePermission
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Permission identifier (e.g., 'view_clients', 'edit_contracts')"
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Permission scope and purpose"
    )

    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['deleted_at']),
        ]

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"<Permission: {self.name}>"

    def get_roles(self):
        """
        Retrieve all roles that have this permission.

        Returns:
            QuerySet: Role objects
        """
        return Role.objects.filter(
            permissions__permission=self,
            deleted_at__isnull=True
        )


class RolePermission(BaseModel):
    """
    Association between Role and Permission.

    Responsibilities (Single Responsibility Principle):
    - Link roles to permissions
    - Enable many-to-many relationship management
    - Track permission grants for audit

    Design Notes:
    - Explicit through model for extensibility
    - Unique constraint prevents duplicates
    - Could be extended with grant metadata (granted_by, granted_at)
    """

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='permissions',
        db_index=True,
        help_text="Role receiving permission"
    )
    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        related_name='roles',
        db_index=True,
        help_text="Permission being granted"
    )

    class Meta:
        db_table = 'role_permissions'
        verbose_name = 'Role Permission'
        verbose_name_plural = 'Role Permissions'
        ordering = ['role', 'permission']
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['permission']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['role', 'permission'],
                name='unique_role_permission'
            )
        ]

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"

    def __repr__(self):
        return f"<RolePermission: {self.role.name} -> {self.permission.name}>"


class UserRole(BaseModel):
    """
    Association between User and Role.

    Responsibilities (Single Responsibility Principle):
    - Assign roles to users
    - Enable role-based authorization
    - Track role assignments for audit

    Design Notes:
    - Explicit through model for extensibility
    - Unique constraint prevents duplicate assignments
    - Could be extended with assignment metadata (assigned_by, assigned_at)
    """

    user = models.ForeignKey(
        'authentication.User',
        on_delete=models.CASCADE,
        related_name='user_roles',
        db_index=True,
        help_text="User receiving role"
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        related_name='user_assignments',
        db_index=True,
        help_text="Role being assigned"
    )

    class Meta:
        db_table = 'user_roles'
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'
        ordering = ['user', 'role']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['role']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'role'],
                name='unique_user_role'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"

    def __repr__(self):
        return f"<UserRole: {self.user.email} -> {self.role.name}>"
