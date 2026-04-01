from django.db import models

from inventory.models import InventoryItem


class DailyConsumption(models.Model):
    consumption_id = models.CharField(max_length=50, unique=True)
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="daily_consumptions",
    )
    raw_item_id = models.CharField(max_length=100)
    quantity_used = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    department = models.CharField(max_length=100)
    is_valid = models.BooleanField(default=True)

    class Meta:
        ordering = ["-date", "raw_item_id"]
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["raw_item_id"]),
        ]

    def __str__(self):
        return f"{self.raw_item_id} on {self.date}"


class DataQualityIssue(models.Model):
    ISSUE_TYPE_CHOICES = [
        ("missing_item", "Missing Item"),
        ("invalid_quantity", "Invalid Quantity"),
        ("invalid_date", "Invalid Date"),
        ("duplicate_record", "Duplicate Record"),
        ("other", "Other"),
    ]

    raw_item_id = models.CharField(max_length=100)
    issue_type = models.CharField(max_length=50, choices=ISSUE_TYPE_CHOICES)
    description = models.TextField()
    source_table = models.CharField(max_length=100)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["raw_item_id"]),
            models.Index(fields=["resolved"]),
        ]

    def __str__(self):
        return f"{self.raw_item_id} - {self.issue_type}"
