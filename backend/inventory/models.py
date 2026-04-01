from django.db import models


class Supplier(models.Model):
    supplier_id = models.CharField(max_length=50, unique=True)
    supplier_name = models.CharField(max_length=255)
    contact = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["supplier_name"]

    def __str__(self):
        return f"{self.supplier_name} ({self.supplier_id})"


class InventoryItem(models.Model):
    item_id = models.CharField(max_length=50, unique=True)
    item_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="items",
    )
    cost_per_unit = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["item_name"]

    def __str__(self):
        return f"{self.item_name} ({self.item_id})"


class InventoryStock(models.Model):
    stock_id = models.CharField(max_length=50, unique=True)
    item = models.OneToOneField(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="stock",
    )
    quantity_available = models.DecimalField(max_digits=12, decimal_places=2)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["item__item_name"]

    def __str__(self):
        return f"Stock for {self.item.item_name}"
