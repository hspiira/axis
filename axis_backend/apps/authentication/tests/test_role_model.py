"""Comprehensive tests for Role, Permission, RolePermission, and UserRole models."""
from django.test import TestCase
from django.db import IntegrityError

from apps.authentication.models import (
    User, Role, Permission, RolePermission, UserRole
)
from axis_backend.enums import UserStatus


class RoleModelTestCase(TestCase):
    """Test Role model fields and basic functionality."""

    def setUp(self):
        """Set up test role."""
        self.role = Role.objects.create(
            name='Admin',
            description='System administrator'
        )

    def test_role_creation_generates_cuid(self):
        """Test that role ID is auto-generated as CUID."""
        self.assertIsNotNone(self.role.id)
        self.assertTrue(len(self.role.id) > 0)
        self.assertTrue(isinstance(self.role.id, str))

    def test_role_string_representation(self):
        """Test Role __str__ returns name."""
        self.assertEqual(str(self.role), 'Admin')

    def test_role_repr(self):
        """Test Role __repr__ includes name."""
        repr_str = repr(self.role)
        self.assertIn('Admin', repr_str)

    def test_role_name_is_unique(self):
        """Test that duplicate role names are not allowed."""
        with self.assertRaises(IntegrityError):
            Role.objects.create(name='Admin')

    def test_role_with_description(self):
        """Test creating role with description."""
        role = Role.objects.create(
            name='Manager',
            description='Department manager'
        )
        self.assertEqual(role.description, 'Department manager')

    def test_role_without_description(self):
        """Test creating role without description."""
        role = Role.objects.create(name='Staff')
        self.assertIsNone(role.description)

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.role.created_at)
        self.assertIsNotNone(self.role.updated_at)


class PermissionModelTestCase(TestCase):
    """Test Permission model fields and basic functionality."""

    def setUp(self):
        """Set up test permission."""
        self.permission = Permission.objects.create(
            name='view_clients',
            description='Can view client information'
        )

    def test_permission_creation_generates_cuid(self):
        """Test that permission ID is auto-generated as CUID."""
        self.assertIsNotNone(self.permission.id)
        self.assertTrue(len(self.permission.id) > 0)
        self.assertTrue(isinstance(self.permission.id, str))

    def test_permission_string_representation(self):
        """Test Permission __str__ returns name."""
        self.assertEqual(str(self.permission), 'view_clients')

    def test_permission_repr(self):
        """Test Permission __repr__ includes name."""
        repr_str = repr(self.permission)
        self.assertIn('view_clients', repr_str)

    def test_permission_name_is_unique(self):
        """Test that duplicate permission names are not allowed."""
        with self.assertRaises(IntegrityError):
            Permission.objects.create(name='view_clients')

    def test_permission_with_description(self):
        """Test creating permission with description."""
        perm = Permission.objects.create(
            name='edit_clients',
            description='Can edit client information'
        )
        self.assertEqual(perm.description, 'Can edit client information')

    def test_permission_without_description(self):
        """Test creating permission without description."""
        perm = Permission.objects.create(name='delete_clients')
        self.assertIsNone(perm.description)

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.permission.created_at)
        self.assertIsNotNone(self.permission.updated_at)


class RolePermissionTestCase(TestCase):
    """Test RolePermission association model."""

    def setUp(self):
        """Set up test role and permissions."""
        self.role = Role.objects.create(name='Manager')
        self.permission1 = Permission.objects.create(name='view_clients')
        self.permission2 = Permission.objects.create(name='edit_clients')

    def test_role_permission_creation(self):
        """Test creating RolePermission association."""
        role_perm = RolePermission.objects.create(
            role=self.role,
            permission=self.permission1
        )
        self.assertEqual(role_perm.role, self.role)
        self.assertEqual(role_perm.permission, self.permission1)

    def test_role_permission_string_representation(self):
        """Test RolePermission __str__ includes role and permission names."""
        role_perm = RolePermission.objects.create(
            role=self.role,
            permission=self.permission1
        )
        str_rep = str(role_perm)
        self.assertIn('Manager', str_rep)
        self.assertIn('view_clients', str_rep)

    def test_role_permission_unique_constraint(self):
        """Test that duplicate role-permission associations are prevented."""
        RolePermission.objects.create(
            role=self.role,
            permission=self.permission1
        )
        with self.assertRaises(IntegrityError):
            RolePermission.objects.create(
                role=self.role,
                permission=self.permission1
            )

    def test_role_can_have_multiple_permissions(self):
        """Test that a role can have multiple permissions."""
        RolePermission.objects.create(role=self.role, permission=self.permission1)
        RolePermission.objects.create(role=self.role, permission=self.permission2)

        self.assertEqual(self.role.permissions.count(), 2)

    def test_permission_can_belong_to_multiple_roles(self):
        """Test that a permission can belong to multiple roles."""
        role2 = Role.objects.create(name='Admin')

        RolePermission.objects.create(role=self.role, permission=self.permission1)
        RolePermission.objects.create(role=role2, permission=self.permission1)

        self.assertEqual(self.permission1.roles.count(), 2)

    def test_role_permission_cascade_delete_with_role(self):
        """Test that RolePermission is deleted when role is deleted."""
        role_perm = RolePermission.objects.create(
            role=self.role,
            permission=self.permission1
        )
        role_perm_id = role_perm.id

        self.role.delete()

        self.assertFalse(RolePermission.objects.filter(id=role_perm_id).exists())

    def test_role_permission_cascade_delete_with_permission(self):
        """Test that RolePermission is deleted when permission is deleted."""
        role_perm = RolePermission.objects.create(
            role=self.role,
            permission=self.permission1
        )
        role_perm_id = role_perm.id

        self.permission1.delete()

        self.assertFalse(RolePermission.objects.filter(id=role_perm_id).exists())


class RoleMethodsTestCase(TestCase):
    """Test Role model methods."""

    def setUp(self):
        """Set up test role and permissions."""
        self.role = Role.objects.create(name='Manager')
        self.permission1 = Permission.objects.create(name='view_clients')
        self.permission2 = Permission.objects.create(name='edit_clients')

    def test_add_permission_creates_association(self):
        """Test add_permission method creates RolePermission."""
        self.role.add_permission(self.permission1)

        self.assertTrue(
            RolePermission.objects.filter(
                role=self.role,
                permission=self.permission1
            ).exists()
        )

    def test_add_permission_returns_role_permission(self):
        """Test add_permission returns RolePermission instance."""
        role_perm = self.role.add_permission(self.permission1)
        self.assertIsInstance(role_perm, RolePermission)
        self.assertEqual(role_perm.role, self.role)
        self.assertEqual(role_perm.permission, self.permission1)

    def test_add_permission_idempotent(self):
        """Test that add_permission is idempotent (doesn't create duplicates)."""
        self.role.add_permission(self.permission1)
        self.role.add_permission(self.permission1)

        self.assertEqual(
            RolePermission.objects.filter(
                role=self.role,
                permission=self.permission1
            ).count(),
            1
        )

    def test_remove_permission_deletes_association(self):
        """Test remove_permission method deletes RolePermission."""
        self.role.add_permission(self.permission1)
        self.role.remove_permission(self.permission1)

        self.assertFalse(
            RolePermission.objects.filter(
                role=self.role,
                permission=self.permission1
            ).exists()
        )

    def test_remove_permission_nonexistent_does_not_error(self):
        """Test that removing non-existent permission doesn't raise error."""
        # Should not raise an error
        self.role.remove_permission(self.permission1)

    def test_has_permission_returns_true_when_granted(self):
        """Test has_permission returns True for granted permissions."""
        self.role.add_permission(self.permission1)
        self.assertTrue(self.role.has_permission('view_clients'))

    def test_has_permission_returns_false_when_not_granted(self):
        """Test has_permission returns False for non-granted permissions."""
        self.assertFalse(self.role.has_permission('view_clients'))

    def test_get_permissions_returns_all_permissions(self):
        """Test get_permissions returns all permissions for role."""
        self.role.add_permission(self.permission1)
        self.role.add_permission(self.permission2)

        permissions = self.role.get_permissions()
        self.assertEqual(permissions.count(), 2)
        self.assertIn(self.permission1, permissions)
        self.assertIn(self.permission2, permissions)

    def test_get_permissions_excludes_soft_deleted(self):
        """Test get_permissions excludes soft-deleted permissions."""
        self.role.add_permission(self.permission1)
        self.role.add_permission(self.permission2)

        # Soft delete one permission
        self.permission1.soft_delete()

        permissions = self.role.get_permissions()
        self.assertEqual(permissions.count(), 1)
        self.assertNotIn(self.permission1, permissions)


class PermissionMethodsTestCase(TestCase):
    """Test Permission model methods."""

    def setUp(self):
        """Set up test roles and permission."""
        self.role1 = Role.objects.create(name='Manager')
        self.role2 = Role.objects.create(name='Staff')
        self.permission = Permission.objects.create(name='view_clients')

    def test_get_roles_returns_all_roles_with_permission(self):
        """Test get_roles returns all roles that have this permission."""
        self.role1.add_permission(self.permission)
        self.role2.add_permission(self.permission)

        roles = self.permission.get_roles()
        self.assertEqual(roles.count(), 2)
        self.assertIn(self.role1, roles)
        self.assertIn(self.role2, roles)

    def test_get_roles_excludes_soft_deleted(self):
        """Test get_roles excludes soft-deleted roles."""
        self.role1.add_permission(self.permission)
        self.role2.add_permission(self.permission)

        # Soft delete one role
        self.role1.soft_delete()

        roles = self.permission.get_roles()
        self.assertEqual(roles.count(), 1)
        self.assertNotIn(self.role1, roles)


class UserRoleTestCase(TestCase):
    """Test UserRole association model."""

    def setUp(self):
        """Set up test user and roles."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.role1 = Role.objects.create(name='Manager')
        self.role2 = Role.objects.create(name='Staff')

    def test_user_role_creation(self):
        """Test creating UserRole association."""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role1
        )
        self.assertEqual(user_role.user, self.user)
        self.assertEqual(user_role.role, self.role1)

    def test_user_role_string_representation(self):
        """Test UserRole __str__ includes user email and role name."""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role1
        )
        str_rep = str(user_role)
        self.assertIn('test@example.com', str_rep)
        self.assertIn('Manager', str_rep)

    def test_user_role_unique_constraint(self):
        """Test that duplicate user-role associations are prevented."""
        UserRole.objects.create(user=self.user, role=self.role1)
        with self.assertRaises(IntegrityError):
            UserRole.objects.create(user=self.user, role=self.role1)

    def test_user_can_have_multiple_roles(self):
        """Test that a user can have multiple roles."""
        UserRole.objects.create(user=self.user, role=self.role1)
        UserRole.objects.create(user=self.user, role=self.role2)

        self.assertEqual(self.user.user_roles.count(), 2)

    def test_role_can_be_assigned_to_multiple_users(self):
        """Test that a role can be assigned to multiple users."""
        user2 = User.objects.create_user(
            email='test2@example.com',
            password='testpass123'
        )

        UserRole.objects.create(user=self.user, role=self.role1)
        UserRole.objects.create(user=user2, role=self.role1)

        self.assertEqual(self.role1.user_assignments.count(), 2)

    def test_user_role_cascade_delete_with_user(self):
        """Test that UserRole is deleted when user is deleted."""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role1
        )
        user_role_id = user_role.id

        self.user.delete()

        self.assertFalse(UserRole.objects.filter(id=user_role_id).exists())

    def test_user_role_cascade_delete_with_role(self):
        """Test that UserRole is deleted when role is deleted."""
        user_role = UserRole.objects.create(
            user=self.user,
            role=self.role1
        )
        user_role_id = user_role.id

        self.role1.delete()

        self.assertFalse(UserRole.objects.filter(id=user_role_id).exists())


class RBACIntegrationTestCase(TestCase):
    """Integration tests for RBAC system."""

    def setUp(self):
        """Set up RBAC components."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

        # Create roles
        self.admin_role = Role.objects.create(name='Admin')
        self.manager_role = Role.objects.create(name='Manager')

        # Create permissions
        self.view_perm = Permission.objects.create(name='view_clients')
        self.edit_perm = Permission.objects.create(name='edit_clients')
        self.delete_perm = Permission.objects.create(name='delete_clients')

        # Admin has all permissions
        self.admin_role.add_permission(self.view_perm)
        self.admin_role.add_permission(self.edit_perm)
        self.admin_role.add_permission(self.delete_perm)

        # Manager has view and edit only
        self.manager_role.add_permission(self.view_perm)
        self.manager_role.add_permission(self.edit_perm)

    def test_user_with_admin_role_has_all_permissions(self):
        """Test that user with admin role has all permissions."""
        UserRole.objects.create(user=self.user, role=self.admin_role)

        self.assertTrue(self.admin_role.has_permission('view_clients'))
        self.assertTrue(self.admin_role.has_permission('edit_clients'))
        self.assertTrue(self.admin_role.has_permission('delete_clients'))

    def test_user_with_manager_role_has_limited_permissions(self):
        """Test that user with manager role has limited permissions."""
        UserRole.objects.create(user=self.user, role=self.manager_role)

        self.assertTrue(self.manager_role.has_permission('view_clients'))
        self.assertTrue(self.manager_role.has_permission('edit_clients'))
        self.assertFalse(self.manager_role.has_permission('delete_clients'))

    def test_user_with_multiple_roles_has_combined_permissions(self):
        """Test that user with multiple roles gets all permissions."""
        # Create a role with only delete permission
        delete_role = Role.objects.create(name='Deleter')
        delete_role.add_permission(self.delete_perm)

        # Assign both manager and delete roles
        UserRole.objects.create(user=self.user, role=self.manager_role)
        UserRole.objects.create(user=self.user, role=delete_role)

        # User should have permissions from both roles
        self.assertTrue(self.manager_role.has_permission('view_clients'))
        self.assertTrue(self.manager_role.has_permission('edit_clients'))
        self.assertTrue(delete_role.has_permission('delete_clients'))

    def test_removing_role_removes_permissions(self):
        """Test that removing a role removes associated permissions."""
        user_role = UserRole.objects.create(user=self.user, role=self.admin_role)

        # Verify user has permissions through role
        self.assertTrue(self.admin_role.has_permission('delete_clients'))

        # Remove role
        user_role.delete()

        # Verify no UserRole exists
        self.assertEqual(self.user.user_roles.count(), 0)
