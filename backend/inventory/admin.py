from django.contrib import admin

from .models import InventoryItem, InventoryStock, Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("supplier_id", "supplier_name", "contact", "location")
    search_fields = ("supplier_id", "supplier_name", "contact", "location")


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        "item_id",
        "item_name",
        "category",
        "unit",
        "supplier",
        "cost_per_unit",
    )
    list_filter = ("category", "unit", "supplier")
    search_fields = ("item_id", "item_name", "category", "supplier__supplier_name")


@admin.register(InventoryStock)
class InventoryStockAdmin(admin.ModelAdmin):
    list_display = (
        "stock_id",
        "item",
        "quantity_available",
        "reorder_level",
        "last_updated",
    )
    list_filter = ("last_updated",)
    search_fields = ("stock_id", "item__item_id", "item__item_name")
