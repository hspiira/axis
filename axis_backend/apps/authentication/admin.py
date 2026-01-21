"""Django admin configuration for authentication app."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import UserChangeForm as BaseUserChangeForm
from django.utils.html import format_html
from django import forms

User = get_user_model()


class UserChangeForm(BaseUserChangeForm):
    """Custom user change form that handles optional username field."""

    username = forms.CharField(
        max_length=150,
        required=False,
        help_text="Optional username for display"
    )

    class Meta(BaseUserChangeForm.Meta):
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model.

    Features:
    - Email-based authentication display
    - Status and security fields
    - Client relationship management
    - Enhanced filtering and search
    """

    # Use custom form
    form = UserChangeForm

    # List display
    list_display = [
        'email',
        'username',
        'first_name',
        'last_name',
        'status_badge',
        'is_staff',
        'is_two_factor_enabled',
        'email_verified_badge',
        'date_joined',
        'last_login_at',
    ]

    # List filters
    list_filter = [
        'status',
        'is_staff',
        'is_superuser',
        'is_active',
        'is_two_factor_enabled',
        'preferred_language',
        'date_joined',
        'last_login_at',
    ]

    # Search fields
    search_fields = [
        'email',
        'username',
        'first_name',
        'last_name',
        'id',
    ]

    # Ordering
    ordering = ['-date_joined']

    # Readonly fields
    readonly_fields = [
        'id',
        'date_joined',
        'last_login',
        'last_login_at',
        'email_verified',
        'created_at',
        'updated_at',
    ]

    # Fieldsets for add/edit forms
    fieldsets = (
        ('Authentication', {
            'fields': (
                'id',
                'email',
                'email_verified',
            )
        }),
        ('Personal Information', {
            'fields': (
                'username',
                'first_name',
                'last_name',
            )
        }),
        ('Status & Security', {
            'fields': (
                'status',
                'is_active',
                'is_staff',
                'is_superuser',
                'is_two_factor_enabled',
            )
        }),
        ('Preferences', {
            'fields': (
                'preferred_language',
                'timezone',
            ),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': (
                'date_joined',
                'last_login',
                'last_login_at',
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
        ('Advanced', {
            'fields': (
                'groups',
                'user_permissions',
                'metadata',
            ),
            'classes': ('collapse',),
        }),
    )

    # Fieldsets for creating new users
    add_fieldsets = (
        ('Required Information', {
            'classes': ('wide',),
            'fields': (
                'email',
                'password1',
                'password2',
            ),
        }),
        ('Optional Information', {
            'classes': ('wide',),
            'fields': (
                'username',
                'first_name',
                'last_name',
                'is_staff',
                'is_superuser',
            ),
        }),
    )

    # Custom methods for display
    @admin.display(description='Status', ordering='status')
    def status_badge(self, obj):
        """Display status with color coding."""
        colors = {
            'Active': 'green',
            'Inactive': 'gray',
            'Suspended': 'orange',
            'Pending': 'blue',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">●</span> {}',
            color,
            obj.status
        )

    @admin.display(description='Email Verified', boolean=True)
    def email_verified_badge(self, obj):
        """Display email verification status."""
        return obj.email_verified is not None

    # Enable mass actions
    actions = ['activate_users', 'deactivate_users', 'enable_2fa', 'disable_2fa']

    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        """Activate selected users."""
        updated = queryset.update(status='Active', is_active=True)
        self.message_user(request, f'{updated} user(s) activated successfully.')

    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        """Deactivate selected users."""
        updated = queryset.update(status='Inactive', is_active=False)
        self.message_user(request, f'{updated} user(s) deactivated successfully.')

    @admin.action(description='Enable 2FA for selected users')
    def enable_2fa(self, request, queryset):
        """Enable two-factor authentication for selected users."""
        updated = queryset.update(is_two_factor_enabled=True)
        self.message_user(request, f'2FA enabled for {updated} user(s).')

    @admin.action(description='Disable 2FA for selected users')
    def disable_2fa(self, request, queryset):
        """Disable two-factor authentication for selected users."""
        updated = queryset.update(is_two_factor_enabled=False)
        self.message_user(request, f'2FA disabled for {updated} user(s).')
