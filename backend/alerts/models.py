from django.db import models

from inventory.models import InventoryItem


class ReorderRecommendation(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("reviewed", "Reviewed"),
        ("approved", "Approved"),
        ("dismissed", "Dismissed"),
    ]

    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="reorder_recommendations",
    )
    current_stock = models.DecimalField(max_digits=12, decimal_places=2)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2)
    predicted_demand_7d = models.DecimalField(max_digits=12, decimal_places=2)
    days_of_stock_left = models.DecimalField(max_digits=10, decimal_places=2)
    suggested_reorder_qty = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    explanation = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at", "item__item_name"]

    def __str__(self):
        return f"Reorder recommendation for {self.item.item_name}"
