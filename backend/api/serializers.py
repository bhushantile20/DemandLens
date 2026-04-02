from rest_framework import serializers

from inventory.models import InventoryItem, InventoryStock, Supplier
from forecasting.models import ForecastResult
from alerts.models import ReorderRecommendation
from consumption.models import DataQualityIssue, DailyConsumption


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ["supplier_id", "supplier_name", "contact", "location"]


class InventoryStockSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryStock
        fields = ["stock_id", "quantity_available", "reorder_level", "last_updated"]


class ForecastResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForecastResult
        fields = ["forecast_date", "predicted_demand", "model_name"]


class ReorderRecommendationSerializer(serializers.ModelSerializer):
    item_id = serializers.CharField(source="item.item_id")
    item_name = serializers.CharField(source="item.item_name")

    class Meta:
        model = ReorderRecommendation
        fields = [
            "item_id",
            "item_name",
            "current_stock",
            "reorder_level",
            "predicted_demand_7d",
            "days_of_stock_left",
            "suggested_reorder_qty",
            "status",
            "explanation",
            "generated_at",
        ]


class DataQualityIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityIssue
        fields = [
            "raw_item_id",
            "issue_type",
            "description",
            "source_table",
            "resolved",
            "created_at",
        ]


class ItemListSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer()
    stock = serializers.SerializerMethodField()
    forecast_next_7d = serializers.DecimalField(
        max_digits=12, decimal_places=2, source="get_forecast_next_7d", read_only=True
    )
    risk_status = serializers.CharField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "item_id",
            "item_name",
            "category",
            "unit",
            "supplier",
            "stock",
            "forecast_next_7d",
            "risk_status",
        ]

    def get_stock(self, obj):
        stock = getattr(obj, "stock", None)
        if not stock:
            return None
        return InventoryStockSerializer(stock).data


class ItemDetailSerializer(ItemListSerializer):
    pass


class ConsumptionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyConsumption
        fields = ["date", "quantity_used", "department"]
