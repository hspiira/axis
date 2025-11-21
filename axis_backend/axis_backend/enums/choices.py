"""
Django TextChoices enums mapped from Prisma schema enums.
Follows Prisma enum values exactly for database compatibility.
Organized by domain following SOLID principles - no duplication.
"""
from django.db import models


# =========================================
# Common/Shared Enums
# =========================================

class Gender(models.TextChoices):
    """Gender enum"""
    MALE = "Male", "Male"
    FEMALE = "Female", "Female"


class Language(models.TextChoices):
    """Language preference enum"""
    ENGLISH = "English", "English"
    SPANISH = "Spanish", "Spanish"
    FRENCH = "French", "French"
    GERMAN = "German", "German"
    OTHER = "Other", "Other"


class ContactMethod(models.TextChoices):
    """Preferred contact method enum"""
    EMAIL = "Email", "Email"
    PHONE = "Phone", "Phone"
    SMS = "SMS", "SMS"
    WHATSAPP = "WhatsApp", "WhatsApp"
    OTHER = "Other", "Other"


class Frequency(models.TextChoices):
    """Frequency enum for recurring events"""
    ONCE = "Once", "Once"
    WEEKLY = "Weekly", "Weekly"
    MONTHLY = "Monthly", "Monthly"
    QUARTERLY = "Quarterly", "Quarterly"
    ANNUALLY = "Annually", "Annually"


class Unit(models.TextChoices):
    """Unit of measurement for KPIs"""
    PERCENTAGE = "Percentage", "Percentage"
    COUNT = "Count", "Count"
    SCORE = "Score", "Score"
    TIME = "Time", "Time"


# =========================================
# Status Enums (Domain-Specific)
# =========================================

class BaseStatus(models.TextChoices):
    """Base status for clients, beneficiaries, and generic entities"""
    ACTIVE = "Active", "Active"
    INACTIVE = "Inactive", "Inactive"
    PENDING = "Pending", "Pending"
    ARCHIVED = "Archived", "Archived"
    DELETED = "Deleted", "Deleted"


class WorkStatus(models.TextChoices):
    """Status for work-related entities: Staff and ServiceProvider"""
    ACTIVE = "Active", "Active"
    INACTIVE = "Inactive", "Inactive"
    ON_LEAVE = "On Leave", "On Leave"
    TERMINATED = "Terminated", "Terminated"
    SUSPENDED = "Suspended", "Suspended"
    RESIGNED = "Resigned", "Resigned"


class UserStatus(models.TextChoices):
    """Status for user accounts"""
    ACTIVE = "Active", "Active"
    SUSPENDED = "Suspended", "Suspended"
    BANNED = "Banned", "Banned"
    PENDING_VERIFICATION = "Pending Verification", "Pending Verification"
    INACTIVE = "Inactive", "Inactive"


class DocumentStatus(models.TextChoices):
    """Status for documents"""
    DRAFT = "Draft", "Draft"
    PUBLISHED = "Published", "Published"
    ARCHIVED = "Archived", "Archived"
    EXPIRED = "Expired", "Expired"


class ContractStatus(models.TextChoices):
    """Status for contracts"""
    ACTIVE = "Active", "Active"
    EXPIRED = "Expired", "Expired"
    TERMINATED = "Terminated", "Terminated"
    RENEWED = "Renewed", "Renewed"
    PENDING = "Pending", "Pending"
    DRAFT = "Draft", "Draft"


class SessionStatus(models.TextChoices):
    """Status for service sessions"""
    SCHEDULED = "Scheduled", "Scheduled"
    RESCHEDULED = "Rescheduled", "Rescheduled"
    COMPLETED = "Completed", "Completed"
    CANCELED = "Canceled", "Canceled"
    NO_SHOW = "No Show", "No Show"
    POSTPONED = "Postponed", "Postponed"


class AssignmentStatus(models.TextChoices):
    """Status for service and KPI assignments"""
    PENDING = "Pending", "Pending"
    ONGOING = "Ongoing", "Ongoing"
    COMPLETED = "Completed", "Completed"
    CANCELLED = "Cancelled", "Cancelled"


class PaymentStatus(models.TextChoices):
    """Payment status for contracts"""
    PENDING = "Pending", "Pending"
    PAID = "Paid", "Paid"
    OVERDUE = "Overdue", "Overdue"
    CANCELLED = "Cancelled", "Cancelled"
    REFUNDED = "Refunded", "Refunded"


# =========================================
# Type/Role Enums
# =========================================

class PersonType(models.TextChoices):
    """Type of person in EAP system"""
    EMPLOYEE = "Employee", "Employee"
    DEPENDENT = "Dependent", "Dependent"


class StaffRole(models.TextChoices):
    """Role for staff members"""
    ADMIN = "Admin", "Admin"
    MANAGER = "Manager", "Manager"
    STAFF = "Staff", "Staff"
    VOLUNTEER = "Volunteer", "Volunteer"


class RelationType(models.TextChoices):
    """Relationship type for beneficiaries"""
    CHILD = "Child", "Child"
    SPOUSE = "Spouse", "Spouse"
    PARENT = "Parent", "Parent"
    SIBLING = "Sibling", "Sibling"
    GRANDPARENT = "Grandparent", "Grandparent"
    GUARDIAN = "Guardian", "Guardian"
    FRIEND = "Friend", "Friend"
    NEIGHBOR = "Neighbor", "Neighbor"
    COUSIN = "Cousin", "Cousin"
    OTHER = "Other", "Other"


class DocumentType(models.TextChoices):
    """Document type classification"""
    CONTRACT = "contract", "Contract"
    CERTIFICATION = "certification", "Certification"
    KPI_REPORT = "kpi_report", "KPI Report"
    FEEDBACK_SUMMARY = "feedback_summary", "Feedback Summary"
    BILLING_REPORT = "billing_report", "Billing Report"
    UTILIZATION_REPORT = "utilization_report", "Utilization Report"
    OTHER = "other", "Other"


class ServiceProviderType(models.TextChoices):
    """Service provider type classification"""
    COUNSELOR = "Counselor", "Counselor"
    CLINIC = "Clinic", "Clinic"
    HOTLINE = "Hotline", "Hotline"
    COACH = "Coach", "Coach"
    OTHER = "Other", "Other"


# =========================================
# Audit/Tracking Enums
# =========================================

class ActionType(models.TextChoices):
    """Audit log action type"""
    CREATE = "Create", "Create"
    UPDATE = "Update", "Update"
    DELETE = "Delete", "Delete"
    LOGIN = "Login", "Login"
    LOGOUT = "Logout", "Logout"
    APPROVE = "Approve", "Approve"
    REJECT = "Reject", "Reject"
    LIST = "List", "List"
    OTHER = "Other", "Other"


class ChangeType(models.TextChoices):
    """Entity change type for detailed audit trail"""
    CREATE = "Create", "Create"
    UPDATE = "Update", "Update"
    DELETE = "Delete", "Delete"
    RESTORE = "Restore", "Restore"
    ARCHIVE = "Archive", "Archive"
    UNARCHIVE = "Unarchive", "Unarchive"
    DEACTIVATE = "Deactivate", "Deactivate"
    ACTIVATE = "Activate", "Activate"
