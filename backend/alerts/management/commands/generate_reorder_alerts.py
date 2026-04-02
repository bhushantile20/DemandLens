import os

from django.core.management.base import BaseCommand

from alerts.services import generate_reorder_recommendations


class Command(BaseCommand):
    help = "Generate reorder recommendations based on forecasts and stock"

    def handle(self, *args, **options):
        lead_time = os.getenv("DEFAULT_LEAD_TIME_DAYS", 3)
        created = generate_reorder_recommendations(lead_time=int(lead_time))
        self.stdout.write(
            self.style.SUCCESS(f"Created {created} reorder recommendations.")
        )
