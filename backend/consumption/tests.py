from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from consumption.models import DailyConsumption, DataQualityIssue
from inventory.models import InventoryItem, InventoryStock, Supplier


class SeedSampleDataCommandTests(TestCase):
    def test_seed_sample_data_creates_required_records_and_flags_bad_rows(self):
        out = StringIO()

        call_command("seed_sample_data", stdout=out)

        self.assertEqual(Supplier.objects.count(), 4)
        self.assertEqual(InventoryItem.objects.count(), 4)
        self.assertEqual(InventoryStock.objects.count(), 4)
        self.assertEqual(DailyConsumption.objects.count(), 5)

        valid_rows = DailyConsumption.objects.filter(is_valid=True).order_by("consumption_id")
        invalid_rows = DailyConsumption.objects.filter(is_valid=False).order_by("consumption_id")

        self.assertEqual(valid_rows.count(), 3)
        self.assertEqual(invalid_rows.count(), 2)

        self.assertEqual(valid_rows[0].item.item_id, "101")
        self.assertEqual(valid_rows[1].item.item_id, "102")
        self.assertEqual(valid_rows[2].item.item_id, "103")

        self.assertIsNone(invalid_rows[0].item)
        self.assertEqual(invalid_rows[0].raw_item_id, "106")
        self.assertIsNone(invalid_rows[1].item)
        self.assertEqual(invalid_rows[1].raw_item_id, "107")

        issues = DataQualityIssue.objects.filter(
            issue_type="missing_item",
            source_table="DailyConsumption",
        ).order_by("raw_item_id")

        self.assertEqual(issues.count(), 2)
        self.assertEqual(list(issues.values_list("raw_item_id", flat=True)), ["106", "107"])
        self.assertIn("Sample data seeded successfully.", out.getvalue())

    def test_seed_sample_data_is_idempotent(self):
        call_command("seed_sample_data")
        call_command("seed_sample_data")

        self.assertEqual(Supplier.objects.count(), 4)
        self.assertEqual(InventoryItem.objects.count(), 4)
        self.assertEqual(InventoryStock.objects.count(), 4)
        self.assertEqual(DailyConsumption.objects.count(), 5)
        self.assertEqual(
            DataQualityIssue.objects.filter(
                issue_type="missing_item",
                source_table="DailyConsumption",
            ).count(),
            2,
        )
