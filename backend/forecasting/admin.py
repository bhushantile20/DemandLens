from django.contrib import admin

from .models import ForecastResult


@admin.register(ForecastResult)
class ForecastResultAdmin(admin.ModelAdmin):
    list_display = (
        "item",
        "forecast_date",
        "predicted_demand",
        "model_name",
        "generated_at",
    )
    list_filter = ("forecast_date", "model_name", "generated_at")
    search_fields = ("item__item_id", "item__item_name", "model_name")
