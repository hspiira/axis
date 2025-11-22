"""Comprehensive tests for Industry model."""
from django.test import TestCase
from django.db import IntegrityError

from apps.clients.models import Industry


class IndustryModelTestCase(TestCase):
    """Test Industry model fields and basic functionality."""

    def setUp(self):
        """Set up test industry."""
        self.industry = Industry.objects.create(
            name='Technology',
            code='TECH001',
            description='Technology sector'
        )

    def test_industry_creation_generates_cuid(self):
        """Test that industry ID is auto-generated as CUID."""
        self.assertIsNotNone(self.industry.id)
        self.assertTrue(len(self.industry.id) > 0)
        self.assertTrue(isinstance(self.industry.id, str))

    def test_industry_string_representation(self):
        """Test Industry __str__ returns name."""
        self.assertEqual(str(self.industry), 'Technology')

    def test_industry_repr(self):
        """Test Industry __repr__ includes name and ID."""
        repr_str = repr(self.industry)
        self.assertIn('Technology', repr_str)
        self.assertIn(self.industry.id, repr_str)

    def test_industry_name_is_unique(self):
        """Test that duplicate industry names are not allowed."""
        with self.assertRaises(IntegrityError):
            Industry.objects.create(name='Technology')

    def test_industry_code_is_unique(self):
        """Test that duplicate industry codes are not allowed."""
        with self.assertRaises(IntegrityError):
            Industry.objects.create(
                name='Different Name',
                code='TECH001'
            )

    def test_industry_with_all_fields(self):
        """Test creating industry with all optional fields."""
        industry = Industry.objects.create(
            name='Healthcare',
            code='HEALTH001',
            description='Healthcare and medical services',
            external_id='EXT-HEALTH-001',
            metadata={'tags': ['medical', 'services']}
        )
        self.assertEqual(industry.code, 'HEALTH001')
        self.assertEqual(industry.description, 'Healthcare and medical services')
        self.assertEqual(industry.external_id, 'EXT-HEALTH-001')
        self.assertIn('medical', industry.metadata['tags'])

    def test_industry_without_code(self):
        """Test creating industry without code."""
        industry = Industry.objects.create(name='Retail')
        self.assertIsNone(industry.code)

    def test_industry_without_description(self):
        """Test creating industry without description."""
        industry = Industry.objects.create(name='Finance')
        self.assertIsNone(industry.description)

    def test_industry_metadata_defaults_to_dict(self):
        """Test that metadata field defaults to empty dict."""
        self.assertEqual(self.industry.metadata, {})

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.industry.created_at)
        self.assertIsNotNone(self.industry.updated_at)


class IndustryHierarchyTestCase(TestCase):
    """Test Industry hierarchical relationships."""

    def setUp(self):
        """Set up industry hierarchy."""
        self.root = Industry.objects.create(
            name='Technology',
            code='TECH'
        )
        self.software = Industry.objects.create(
            name='Software',
            code='SOFT',
            parent=self.root
        )
        self.cloud = Industry.objects.create(
            name='Cloud Services',
            code='CLOUD',
            parent=self.software
        )

    def test_parent_child_relationship(self):
        """Test parent-child relationship setup."""
        self.assertEqual(self.software.parent, self.root)
        self.assertEqual(self.cloud.parent, self.software)

    def test_industry_without_parent(self):
        """Test creating root industry without parent."""
        industry = Industry.objects.create(name='Finance')
        self.assertIsNone(industry.parent)

    def test_parent_set_null_on_delete(self):
        """Test that child.parent is set to NULL when parent is deleted."""
        parent_id = self.software.id
        self.software.delete()

        self.cloud.refresh_from_db()
        self.assertIsNone(self.cloud.parent)

    def test_children_relationship(self):
        """Test accessing children from parent."""
        self.assertIn(self.software, self.root.children.all())
        self.assertEqual(self.root.children.count(), 1)

    def test_multiple_children(self):
        """Test industry with multiple children."""
        hardware = Industry.objects.create(
            name='Hardware',
            code='HARD',
            parent=self.root
        )

        self.assertEqual(self.root.children.count(), 2)
        self.assertIn(self.software, self.root.children.all())
        self.assertIn(hardware, self.root.children.all())


class IndustryPropertiesTestCase(TestCase):
    """Test Industry model properties."""

    def setUp(self):
        """Set up industry hierarchy."""
        self.root = Industry.objects.create(name='Technology')
        self.software = Industry.objects.create(
            name='Software',
            parent=self.root
        )
        self.cloud = Industry.objects.create(
            name='Cloud Services',
            parent=self.software
        )

    def test_full_path_root_industry(self):
        """Test full_path for root industry."""
        self.assertEqual(self.root.full_path, 'Technology')

    def test_full_path_child_industry(self):
        """Test full_path for child industry."""
        self.assertEqual(
            self.software.full_path,
            'Technology > Software'
        )

    def test_full_path_grandchild_industry(self):
        """Test full_path for deep hierarchy."""
        self.assertEqual(
            self.cloud.full_path,
            'Technology > Software > Cloud Services'
        )

    def test_depth_root_industry(self):
        """Test depth for root industry."""
        self.assertEqual(self.root.depth, 0)

    def test_depth_child_industry(self):
        """Test depth for child industry."""
        self.assertEqual(self.software.depth, 1)

    def test_depth_grandchild_industry(self):
        """Test depth for deep hierarchy."""
        self.assertEqual(self.cloud.depth, 2)

    def test_has_children_true(self):
        """Test has_children returns True for parent industries."""
        self.assertTrue(self.root.has_children)
        self.assertTrue(self.software.has_children)

    def test_has_children_false(self):
        """Test has_children returns False for leaf industries."""
        self.assertFalse(self.cloud.has_children)


class IndustryAncestorsTestCase(TestCase):
    """Test Industry get_ancestors method."""

    def setUp(self):
        """Set up industry hierarchy."""
        self.root = Industry.objects.create(name='Technology')
        self.software = Industry.objects.create(
            name='Software',
            parent=self.root
        )
        self.cloud = Industry.objects.create(
            name='Cloud Services',
            parent=self.software
        )
        self.saas = Industry.objects.create(
            name='SaaS',
            parent=self.cloud
        )

    def test_get_ancestors_root_industry(self):
        """Test get_ancestors for root industry returns empty list."""
        ancestors = self.root.get_ancestors()
        self.assertEqual(len(ancestors), 0)

    def test_get_ancestors_child_industry(self):
        """Test get_ancestors for child industry."""
        ancestors = self.software.get_ancestors()
        self.assertEqual(len(ancestors), 1)
        self.assertEqual(ancestors[0], self.root)

    def test_get_ancestors_grandchild_industry(self):
        """Test get_ancestors for grandchild industry."""
        ancestors = self.cloud.get_ancestors()
        self.assertEqual(len(ancestors), 2)
        self.assertEqual(ancestors[0], self.software)
        self.assertEqual(ancestors[1], self.root)

    def test_get_ancestors_deep_hierarchy(self):
        """Test get_ancestors for deep hierarchy."""
        ancestors = self.saas.get_ancestors()
        self.assertEqual(len(ancestors), 3)
        self.assertEqual(ancestors[0], self.cloud)
        self.assertEqual(ancestors[1], self.software)
        self.assertEqual(ancestors[2], self.root)

    def test_get_ancestors_order(self):
        """Test that ancestors are ordered from immediate parent to root."""
        ancestors = self.saas.get_ancestors()
        # Should be ordered: Cloud Services, Software, Technology
        self.assertEqual(ancestors[0].name, 'Cloud Services')
        self.assertEqual(ancestors[1].name, 'Software')
        self.assertEqual(ancestors[2].name, 'Technology')


class IndustryDescendantsTestCase(TestCase):
    """Test Industry get_descendants method."""

    def setUp(self):
        """Set up industry hierarchy."""
        self.root = Industry.objects.create(name='Technology')

        self.software = Industry.objects.create(
            name='Software',
            parent=self.root
        )
        self.hardware = Industry.objects.create(
            name='Hardware',
            parent=self.root
        )

        self.cloud = Industry.objects.create(
            name='Cloud Services',
            parent=self.software
        )
        self.mobile = Industry.objects.create(
            name='Mobile Apps',
            parent=self.software
        )

        self.saas = Industry.objects.create(
            name='SaaS',
            parent=self.cloud
        )

    def test_get_descendants_leaf_industry(self):
        """Test get_descendants for leaf industry returns empty list."""
        descendants = self.saas.get_descendants()
        self.assertEqual(len(descendants), 0)

    def test_get_descendants_parent_with_children(self):
        """Test get_descendants for parent with direct children."""
        descendants = self.software.get_descendants()
        # Software has 2 direct children: Cloud Services, Mobile Apps
        # Cloud Services has 1 child: SaaS
        # Total: 3 descendants
        self.assertEqual(len(descendants), 3)
        self.assertIn(self.cloud, descendants)
        self.assertIn(self.mobile, descendants)
        self.assertIn(self.saas, descendants)

    def test_get_descendants_root_industry(self):
        """Test get_descendants for root gets all descendants."""
        descendants = self.root.get_descendants()
        # Root has all descendants: Software, Hardware, Cloud Services, Mobile Apps, SaaS
        self.assertEqual(len(descendants), 5)
        self.assertIn(self.software, descendants)
        self.assertIn(self.hardware, descendants)
        self.assertIn(self.cloud, descendants)
        self.assertIn(self.mobile, descendants)
        self.assertIn(self.saas, descendants)

    def test_get_descendants_includes_all_levels(self):
        """Test that get_descendants includes all hierarchy levels."""
        descendants = self.root.get_descendants()
        # Verify all levels are present
        # Level 1: Software, Hardware
        # Level 2: Cloud Services, Mobile Apps
        # Level 3: SaaS
        level_1 = [d for d in descendants if d.depth == 1]
        level_2 = [d for d in descendants if d.depth == 2]
        level_3 = [d for d in descendants if d.depth == 3]

        self.assertEqual(len(level_1), 2)  # Software, Hardware
        self.assertEqual(len(level_2), 2)  # Cloud Services, Mobile Apps
        self.assertEqual(len(level_3), 1)  # SaaS


class IndustryExternalIDTestCase(TestCase):
    """Test Industry external ID functionality."""

    def test_industry_with_external_id(self):
        """Test creating industry with external ID."""
        industry = Industry.objects.create(
            name='Technology',
            external_id='NAICS-51'
        )
        self.assertEqual(industry.external_id, 'NAICS-51')

    def test_industry_without_external_id(self):
        """Test creating industry without external ID."""
        industry = Industry.objects.create(name='Healthcare')
        self.assertIsNone(industry.external_id)

    def test_multiple_industries_different_external_ids(self):
        """Test that different industries can have different external IDs."""
        industry1 = Industry.objects.create(
            name='Technology',
            external_id='NAICS-51'
        )
        industry2 = Industry.objects.create(
            name='Healthcare',
            external_id='NAICS-62'
        )

        self.assertEqual(industry1.external_id, 'NAICS-51')
        self.assertEqual(industry2.external_id, 'NAICS-62')


class IndustryMetadataTestCase(TestCase):
    """Test Industry metadata storage."""

    def test_industry_metadata_storage(self):
        """Test storing custom data in metadata."""
        industry = Industry.objects.create(
            name='Technology',
            metadata={
                'tags': ['digital', 'innovation'],
                'growth_rate': 'high',
                'regulations': ['GDPR', 'SOC2']
            }
        )

        self.assertIn('digital', industry.metadata['tags'])
        self.assertEqual(industry.metadata['growth_rate'], 'high')
        self.assertIn('GDPR', industry.metadata['regulations'])

    def test_industry_metadata_update(self):
        """Test updating metadata."""
        industry = Industry.objects.create(
            name='Technology',
            metadata={'status': 'active'}
        )

        industry.metadata['status'] = 'verified'
        industry.metadata['verified_date'] = '2024-01-01'
        industry.save()

        industry.refresh_from_db()
        self.assertEqual(industry.metadata['status'], 'verified')
        self.assertEqual(industry.metadata['verified_date'], '2024-01-01')


class IndustrySoftDeleteTestCase(TestCase):
    """Test Industry soft delete functionality."""

    def setUp(self):
        """Set up test industry."""
        self.industry = Industry.objects.create(
            name='Technology',
            code='TECH'
        )

    def test_soft_delete_sets_deleted_at(self):
        """Test soft_delete sets deleted_at timestamp."""
        self.assertIsNone(self.industry.deleted_at)
        self.industry.soft_delete()
        self.industry.refresh_from_db()
        self.assertIsNotNone(self.industry.deleted_at)

    def test_restore_clears_deleted_at(self):
        """Test restore clears deleted_at timestamp."""
        self.industry.soft_delete()
        self.industry.restore()
        self.industry.refresh_from_db()
        self.assertIsNone(self.industry.deleted_at)
