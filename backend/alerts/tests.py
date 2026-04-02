from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from alerts.models import ReorderRecommendation
from inventory.models import InventoryStock


class ReorderAlertsTests(TestCase):
    def test_generate_reorder_alerts_creates_recommendations(self):
        out = StringIO()
        call_command("seed_sample_data", stdout=out)
        call_command("run_forecast", stdout=out)

        # run reorder alert generation
        call_command("generate_reorder_alerts", stdout=out)

        stocks = InventoryStock.objects.all()
        recs = ReorderRecommendation.objects.all()

        # Expect one recommendation per stock row
        self.assertEqual(recs.count(), stocks.count())

        # each recommendation should reference an item and have suggested qty >= 0
        for r in recs:
            self.assertIsNotNone(r.item)
            self.assertGreaterEqual(float(r.suggested_reorder_qty), 0.0)
