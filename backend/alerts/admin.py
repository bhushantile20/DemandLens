from django.contrib import admin

from .models import ReorderRecommendation


@admin.register(ReorderRecommendation)
class ReorderRecommendationAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "current_stock",
        "reorder_level",
        "predicted_demand_7d",
        "days_of_stock_left",
        "suggested_reorder_qty",
        "status",
        "generated_at",
    )
    list_filter = ("status", "generated_at")
    search_fields = ("item__item_id", "item__item_name", "explanation")
