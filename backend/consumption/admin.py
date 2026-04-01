from django.contrib import admin

from .models import DailyConsumption, DataQualityIssue


@admin.register(DailyConsumption)
class DailyConsumptionAdmin(admin.ModelAdmin):
    list_display = (
        "consumption_id",
        "item",
        "raw_item_id",
        "quantity_used",
        "date",
        "department",
        "is_valid",
    )
    list_filter = ("date", "department", "is_valid")
    search_fields = ("consumption_id", "raw_item_id", "department", "item__item_name")


@admin.register(DataQualityIssue)
class DataQualityIssueAdmin(admin.ModelAdmin):
    list_display = (
        "raw_item_id",
        "issue_type",
        "source_table",
        "resolved",
        "created_at",
    )
    list_filter = ("issue_type", "source_table", "resolved", "created_at")
    search_fields = ("raw_item_id", "description", "source_table")
