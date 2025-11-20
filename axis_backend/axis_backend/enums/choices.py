from django.db import models

class BusinessStatusChoices(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "Inactive"
    PENDING = "pending", "Pending"
    SUSPENDED = "suspended", "Suspended"

class GenderChoices(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"

class RelationshipChoices(models.TextChoices):
    SELF = "self", "Self"
    SPOUSE = "spouse", "Spouse"
    CHILD = "child", "Child"
    PARENT = "parent", "Parent"
    SIBLING = "sibling", "Sibling"
    OTHER = "other", "Other"