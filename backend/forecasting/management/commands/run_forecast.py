import os

from django.core.management.base import BaseCommand

from forecasting.services import run_forecast


class Command(BaseCommand):
    help = "Run forecasting and persist ForecastResult rows."

    def handle(self, *args, **options):
        horizon = int(os.getenv("FORECAST_DAYS", 7))
        self.stdout.write(f"Running forecast for horizon={horizon} days...")
        created = run_forecast(horizon=horizon)
        self.stdout.write(self.style.SUCCESS(f"Created {created} forecast rows."))
