from django.db import models

from inventory.models import InventoryItem


class ForecastResult(models.Model):
    item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="forecast_results",
    )
    forecast_date = models.DateField()
    predicted_demand = models.DecimalField(max_digits=12, decimal_places=2)
    model_name = models.CharField(max_length=100)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-forecast_date", "item__item_name"]
        unique_together = ("item", "forecast_date", "model_name")

    def __str__(self):
        return f"{self.item.item_name} forecast for {self.forecast_date}"
