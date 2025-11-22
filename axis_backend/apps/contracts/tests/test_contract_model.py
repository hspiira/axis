"""Comprehensive tests for Contract model."""
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from apps.contracts.models import Contract
from apps.clients.models import Client
from axis_backend.enums import ContractStatus, PaymentStatus, BaseStatus


class ContractModelTestCase(TestCase):
    """Test Contract model fields and basic functionality."""

    def setUp(self):
        """Set up test client and contract."""
        self.client = Client.objects.create(
            name='Acme Corporation',
            email='contact@acme.com',
            status=BaseStatus.ACTIVE
        )
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            currency='USD'
        )

    def test_contract_creation_generates_cuid(self):
        """Test that contract ID is auto-generated as CUID."""
        self.assertIsNotNone(self.contract.id)
        self.assertTrue(len(self.contract.id) > 0)

    def test_contract_string_representation(self):
        """Test Contract __str__ includes client name and dates."""
        str_rep = str(self.contract)
        self.assertIn('Acme Corporation', str_rep)
        self.assertIn(str(self.contract.start_date), str_rep)

    def test_contract_repr(self):
        """Test Contract __repr__ includes client and status."""
        repr_str = repr(self.contract)
        self.assertIn('Acme Corporation', repr_str)
        self.assertIn(ContractStatus.ACTIVE, repr_str)

    def test_contract_default_status_is_active(self):
        """Test that new contracts default to ACTIVE status."""
        self.assertEqual(self.contract.status, ContractStatus.ACTIVE)

    def test_contract_default_payment_status_is_pending(self):
        """Test that payment status defaults to PENDING."""
        self.assertEqual(self.contract.payment_status, PaymentStatus.PENDING)

    def test_contract_default_currency_is_ugx(self):
        """Test that default currency is UGX."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00')
        )
        self.assertEqual(contract.currency, 'UGX')

    def test_contract_is_renewable_by_default(self):
        """Test that contracts are renewable by default."""
        self.assertTrue(self.contract.is_renewable)

    def test_contract_is_not_auto_renew_by_default(self):
        """Test that auto-renewal is disabled by default."""
        self.assertFalse(self.contract.is_auto_renew)

    def test_timestamps_are_auto_generated(self):
        """Test that created_at and updated_at are auto-set."""
        self.assertIsNotNone(self.contract.created_at)
        self.assertIsNotNone(self.contract.updated_at)


class ContractClientRelationshipTestCase(TestCase):
    """Test Contract-Client relationship."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )

    def test_contract_belongs_to_client(self):
        """Test contract is associated with client."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00')
        )
        self.assertEqual(contract.client, self.client)

    def test_client_can_have_multiple_contracts(self):
        """Test that client can have multiple contracts."""
        Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00')
        )
        Contract.objects.create(
            client=self.client,
            start_date=date.today() + timedelta(days=365),
            end_date=date.today() + timedelta(days=730),
            billing_rate=Decimal('1500.00')
        )

        self.assertEqual(self.client.contracts.count(), 2)

    def test_cannot_delete_client_with_contracts(self):
        """Test that client with contracts cannot be deleted (PROTECT)."""
        Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00')
        )

        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.client.delete()


class ContractDateValidationTestCase(TestCase):
    """Test Contract date validation rules."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )

    def test_end_date_before_start_date_raises_error(self):
        """Test that end_date before start_date raises ValidationError."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() - timedelta(days=1),
            billing_rate=Decimal('1000.00')
        )
        with self.assertRaises(ValidationError) as context:
            contract.full_clean()
        self.assertIn('End date must be after start date', str(context.exception))

    def test_renewal_date_before_start_date_raises_error(self):
        """Test that renewal_date before start_date raises error."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            renewal_date=date.today() - timedelta(days=1),
            billing_rate=Decimal('1000.00')
        )
        with self.assertRaises(ValidationError) as context:
            contract.full_clean()
        self.assertIn('Renewal date must fall within contract period', str(context.exception))

    def test_renewal_date_after_end_date_raises_error(self):
        """Test that renewal_date after end_date raises error."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            renewal_date=date.today() + timedelta(days=400),
            billing_rate=Decimal('1000.00')
        )
        with self.assertRaises(ValidationError) as context:
            contract.full_clean()
        self.assertIn('Renewal date must fall within contract period', str(context.exception))

    def test_valid_renewal_date_passes(self):
        """Test that renewal_date within contract period passes validation."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            renewal_date=date.today() + timedelta(days=300),
            billing_rate=Decimal('1000.00')
        )
        # Should not raise ValidationError
        contract.full_clean()


class ContractFinancialValidationTestCase(TestCase):
    """Test Contract financial validation rules."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )

    def test_negative_billing_rate_raises_error(self):
        """Test that negative billing_rate raises ValidationError."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('-100.00')
        )
        with self.assertRaises(ValidationError) as context:
            contract.full_clean()
        self.assertIn('Billing rate cannot be negative', str(context.exception))

    def test_zero_billing_rate_is_valid(self):
        """Test that zero billing_rate is allowed."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('0.00')
        )
        # Should not raise ValidationError
        contract.full_clean()

    def test_contract_with_payment_terms(self):
        """Test creating contract with payment terms."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            payment_frequency='Monthly',
            payment_terms='Net 30 days from invoice date'
        )
        self.assertEqual(contract.payment_frequency, 'Monthly')
        self.assertEqual(contract.payment_terms, 'Net 30 days from invoice date')


class ContractStatusValidationTestCase(TestCase):
    """Test Contract status-specific validation rules."""

    def setUp(self):
        """Set up test client."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )

    def test_terminated_contract_without_reason_raises_error(self):
        """Test that terminated contract requires termination_reason."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.TERMINATED
        )
        with self.assertRaises(ValidationError) as context:
            contract.full_clean()
        self.assertIn('Termination reason is required', str(context.exception))

    def test_terminated_contract_with_reason_passes(self):
        """Test that terminated contract with reason passes validation."""
        contract = Contract(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.TERMINATED,
            termination_reason='Client request'
        )
        # Should not raise ValidationError
        contract.full_clean()


class ContractPropertiesTestCase(TestCase):
    """Test Contract model properties."""

    def setUp(self):
        """Set up test contract."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )

    def test_is_active_true_for_current_active_contract(self):
        """Test is_active returns True for current active contract."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=30),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.ACTIVE
        )
        self.assertTrue(contract.is_active)

    def test_is_active_false_for_future_contract(self):
        """Test is_active returns False for future contract."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() + timedelta(days=30),
            end_date=date.today() + timedelta(days=60),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.ACTIVE
        )
        self.assertFalse(contract.is_active)

    def test_is_active_false_for_expired_contract(self):
        """Test is_active returns False for expired contract."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=30),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.ACTIVE
        )
        self.assertFalse(contract.is_active)

    def test_is_active_false_for_terminated_contract(self):
        """Test is_active returns False for terminated contracts."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() + timedelta(days=30),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.TERMINATED,
            termination_reason='Test'
        )
        self.assertFalse(contract.is_active)

    def test_is_expired_true_for_past_end_date(self):
        """Test is_expired returns True when past end date."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=1),
            billing_rate=Decimal('1000.00')
        )
        self.assertTrue(contract.is_expired)

    def test_is_expired_false_for_future_end_date(self):
        """Test is_expired returns False when end date is in future."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            billing_rate=Decimal('1000.00')
        )
        self.assertFalse(contract.is_expired)

    def test_is_pending_renewal_true_when_past_renewal_date(self):
        """Test is_pending_renewal True when past renewal date."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=300),
            end_date=date.today() + timedelta(days=65),
            renewal_date=date.today() - timedelta(days=1),
            billing_rate=Decimal('1000.00'),
            is_renewable=True
        )
        self.assertTrue(contract.is_pending_renewal)

    def test_is_pending_renewal_false_when_not_renewable(self):
        """Test is_pending_renewal False when is_renewable is False."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=300),
            end_date=date.today() + timedelta(days=65),
            renewal_date=date.today() - timedelta(days=1),
            billing_rate=Decimal('1000.00'),
            is_renewable=False
        )
        self.assertFalse(contract.is_pending_renewal)

    def test_is_pending_renewal_false_when_expired(self):
        """Test is_pending_renewal False for expired contracts."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=400),
            end_date=date.today() - timedelta(days=1),
            renewal_date=date.today() - timedelta(days=30),
            billing_rate=Decimal('1000.00'),
            is_renewable=True
        )
        self.assertFalse(contract.is_pending_renewal)

    def test_days_remaining_positive_for_future_contract(self):
        """Test days_remaining returns positive number for active contracts."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            billing_rate=Decimal('1000.00')
        )
        self.assertEqual(contract.days_remaining, 30)

    def test_days_remaining_negative_for_expired_contract(self):
        """Test days_remaining returns negative for expired contracts."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=30),
            billing_rate=Decimal('1000.00')
        )
        self.assertEqual(contract.days_remaining, -30)

    def test_is_payment_overdue_true(self):
        """Test is_payment_overdue returns True for overdue status."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            payment_status=PaymentStatus.OVERDUE
        )
        self.assertTrue(contract.is_payment_overdue)

    def test_is_payment_overdue_false(self):
        """Test is_payment_overdue returns False for non-overdue status."""
        contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            payment_status=PaymentStatus.PAID
        )
        self.assertFalse(contract.is_payment_overdue)


class ContractLifecycleMethodsTestCase(TestCase):
    """Test Contract lifecycle management methods."""

    def setUp(self):
        """Set up test contract."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            status=ContractStatus.DRAFT
        )

    def test_activate_changes_status_to_active(self):
        """Test activate method changes status to ACTIVE."""
        self.contract.activate()
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.status, ContractStatus.ACTIVE)

    def test_terminate_changes_status_and_records_reason(self):
        """Test terminate method changes status and saves reason."""
        self.contract.terminate('Client request')
        self.contract.refresh_from_db()

        self.assertEqual(self.contract.status, ContractStatus.TERMINATED)
        self.assertEqual(self.contract.termination_reason, 'Client request')

    def test_terminate_without_reason_raises_error(self):
        """Test terminate without reason raises ValidationError."""
        with self.assertRaises(ValidationError):
            self.contract.terminate('')

    def test_renew_updates_end_date_and_status(self):
        """Test renew method updates end_date and status."""
        new_end = date.today() + timedelta(days=730)
        self.contract.renew(new_end)
        self.contract.refresh_from_db()

        self.assertEqual(self.contract.status, ContractStatus.RENEWED)
        self.assertEqual(self.contract.end_date, new_end)

    def test_renew_updates_billing_rate(self):
        """Test renew method can update billing_rate."""
        new_end = date.today() + timedelta(days=730)
        new_rate = Decimal('1500.00')

        self.contract.renew(new_end, new_rate)
        self.contract.refresh_from_db()

        self.assertEqual(self.contract.billing_rate, new_rate)

    def test_renew_clears_renewal_date(self):
        """Test renew clears renewal_date."""
        self.contract.renewal_date = date.today() + timedelta(days=330)
        self.contract.save()

        new_end = date.today() + timedelta(days=730)
        self.contract.renew(new_end)
        self.contract.refresh_from_db()

        self.assertIsNone(self.contract.renewal_date)

    def test_renew_with_past_end_date_raises_error(self):
        """Test renew with end_date before current end_date raises error."""
        new_end = date.today() + timedelta(days=30)  # Before current end_date
        with self.assertRaises(ValidationError):
            self.contract.renew(new_end)

    def test_mark_expired_changes_status(self):
        """Test mark_expired changes status to EXPIRED."""
        self.contract.mark_expired()
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.status, ContractStatus.EXPIRED)


class ContractPaymentMethodsTestCase(TestCase):
    """Test Contract payment management methods."""

    def setUp(self):
        """Set up test contract."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            payment_frequency='Monthly'
        )

    def test_mark_paid_updates_payment_status(self):
        """Test mark_paid changes payment_status to PAID."""
        self.contract.mark_paid()
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.payment_status, PaymentStatus.PAID)

    def test_mark_paid_sets_last_billing_date(self):
        """Test mark_paid sets last_billing_date to today."""
        self.contract.mark_paid()
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.last_billing_date, date.today())

    def test_mark_paid_calculates_next_billing_date_monthly(self):
        """Test mark_paid calculates next_billing_date for monthly frequency."""
        self.contract.payment_frequency = 'Monthly'
        self.contract.save()

        self.contract.mark_paid()
        self.contract.refresh_from_db()

        expected_next = date.today() + timedelta(days=30)  # Approximately
        # Allow 2 days variance for month length
        self.assertLessEqual(
            abs((self.contract.next_billing_date - expected_next).days),
            2
        )

    def test_mark_overdue_updates_payment_status(self):
        """Test mark_overdue changes payment_status to OVERDUE."""
        self.contract.mark_overdue()
        self.contract.refresh_from_db()
        self.assertEqual(self.contract.payment_status, PaymentStatus.OVERDUE)


class ContractSignatureTestCase(TestCase):
    """Test Contract signature and document fields."""

    def test_contract_with_signature_info(self):
        """Test creating contract with signature information."""
        client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )
        contract = Contract.objects.create(
            client=client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00'),
            document_url='https://example.com/contract.pdf',
            signed_by='John Doe',
            signed_at=timezone.now()
        )

        self.assertEqual(contract.document_url, 'https://example.com/contract.pdf')
        self.assertEqual(contract.signed_by, 'John Doe')
        self.assertIsNotNone(contract.signed_at)


class ContractSoftDeleteTestCase(TestCase):
    """Test Contract soft delete functionality."""

    def setUp(self):
        """Set up test contract."""
        self.client = Client.objects.create(
            name='Test Corp',
            email='test@corp.com',
            status=BaseStatus.ACTIVE
        )
        self.contract = Contract.objects.create(
            client=self.client,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=365),
            billing_rate=Decimal('1000.00')
        )

    def test_soft_delete_sets_deleted_at(self):
        """Test soft_delete sets deleted_at timestamp."""
        self.assertIsNone(self.contract.deleted_at)
        self.contract.soft_delete()
        self.contract.refresh_from_db()
        self.assertIsNotNone(self.contract.deleted_at)

    def test_restore_clears_deleted_at(self):
        """Test restore clears deleted_at timestamp."""
        self.contract.soft_delete()
        self.contract.restore()
        self.contract.refresh_from_db()
        self.assertIsNone(self.contract.deleted_at)
