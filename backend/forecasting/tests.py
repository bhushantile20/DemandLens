from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from forecasting.models import ForecastResult
from inventory.models import InventoryItem


class ForecastCommandTests(TestCase):
    def test_run_forecast_creates_seven_rows_per_valid_item(self):
        out = StringIO()
        # seed data
        call_command("seed_sample_data", stdout=out)

        # run forecast
        call_command("run_forecast", stdout=out)

        # count items that have valid consumption rows
        items_with_consumption = InventoryItem.objects.filter(
            daily_consumptions__isnull=False
        ).distinct()
        total_forecasts = ForecastResult.objects.count()
        self.assertEqual(total_forecasts, items_with_consumption.count() * 7)

        # model_name should be exponential_smoothing
        self.assertTrue(
            ForecastResult.objects.filter(model_name="exponential_smoothing").exists()
        )
