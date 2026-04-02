from datetime import date, timedelta

from django.db.models import Sum, F
from rest_framework.decorators import api_view
from rest_framework.response import Response

from inventory.models import InventoryItem, InventoryStock
from forecasting.models import ForecastResult
from alerts.models import ReorderRecommendation
from consumption.models import DataQualityIssue, DailyConsumption
from forecasting.services import run_forecast
from alerts.services import generate_reorder_recommendations
from .serializers import (
    ItemListSerializer,
    ItemDetailSerializer,
    ForecastResultSerializer,
    ReorderRecommendationSerializer,
    DataQualityIssueSerializer,
    ConsumptionHistorySerializer,
)


@api_view(["GET"])
def dashboard_summary(request):
    total_items = InventoryItem.objects.count()
    low_stock_count = InventoryStock.objects.filter(
        quantity_available__lte=F("reorder_level")
    ).count()
    reorder_now_count = ReorderRecommendation.objects.filter(
        explanation__contains="reorder_now"
    ).count()
    issue_count = DataQualityIssue.objects.filter(resolved=False).count()
    return Response(
        {
            "total_items": total_items,
            "low_stock_count": low_stock_count,
            "reorder_now_count": reorder_now_count,
            "issue_count": issue_count,
        }
    )


@api_view(["GET"])
def items_list(request):
    today = date.today()
    horizon_end = today + timedelta(days=7)
    items = InventoryItem.objects.select_related("supplier").all()
    data = []
    for item in items:
        # attach next 7 days forecast sum
        forecast_sum = ForecastResult.objects.filter(
            item=item, forecast_date__gt=today, forecast_date__lte=horizon_end
        ).aggregate(total=Sum("predicted_demand"))
        next7 = forecast_sum.get("total") or 0

        # risk status from latest recommendation
        rec = (
            ReorderRecommendation.objects.filter(item=item)
            .order_by("-generated_at")
            .first()
        )
        risk = "safe"
        if rec and "reorder_now" in rec.explanation:
            risk = "reorder_now"
        elif rec and "watch" in rec.explanation:
            risk = "watch"

        serializer = ItemListSerializer(item, context={"request": request})
        item_data = serializer.data
        item_data["forecast_next_7d"] = float(next7)
        item_data["risk_status"] = risk
        data.append(item_data)
    return Response(data)


@api_view(["GET"])
def item_detail(request, pk):
    item = InventoryItem.objects.select_related("supplier").get(pk=pk)
    serializer = ItemDetailSerializer(item, context={"request": request})
    return Response(serializer.data)


@api_view(["GET"])
def item_forecast(request, pk):
    item = InventoryItem.objects.get(pk=pk)
    # history
    history_qs = DailyConsumption.objects.filter(item=item, is_valid=True).order_by(
        "date"
    )
    history = ConsumptionHistorySerializer(history_qs, many=True).data

    # next 7 days forecast
    today = date.today()
    horizon_end = today + timedelta(days=7)
    forecast_qs = ForecastResult.objects.filter(
        item=item, forecast_date__gt=today, forecast_date__lte=horizon_end
    ).order_by("forecast_date")
    forecast = ForecastResultSerializer(forecast_qs, many=True).data

    return Response({"history": history, "forecast": forecast})


@api_view(["GET"])
def alerts_reorder(request):
    qs = ReorderRecommendation.objects.order_by("-generated_at")
    serializer = ReorderRecommendationSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def data_quality_issues(request):
    qs = DataQualityIssue.objects.order_by("-created_at")
    serializer = DataQualityIssueSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["POST"])
def forecast_run(request):
    # run forecast and then regenerate reorder alerts
    created = run_forecast()
    recs = generate_reorder_recommendations()
    return Response(
        {"forecast_rows_created": created, "reorder_recommendations_created": recs}
    )
