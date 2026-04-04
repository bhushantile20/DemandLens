from datetime import date, timedelta

from django.db.models import Sum, F
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

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

DEMO_TOKEN = "demo-secret-2024"

def get_demo_user(request):
    """Return the superuser (demo user) if token is valid, else None."""
    token = request.headers.get("X-Demo-Token", "")
    if token != DEMO_TOKEN:
        return None
    return User.objects.filter(is_superuser=True).first()



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

    # Total inventory value (cost_per_unit × quantity_available)
    total_value = 0
    for stock in InventoryStock.objects.select_related("item").all():
        total_value += float(stock.item.cost_per_unit) * float(stock.quantity_available)

    return Response(
        {
            "total_items": total_items,
            "low_stock_count": low_stock_count,
            "reorder_now_count": reorder_now_count,
            "issue_count": issue_count,
            "total_inventory_value": round(total_value, 2),
        }
    )


@api_view(["GET"])
def analytics_department_consumption(request):
    """Aggregate total quantity used grouped by department (last 30 & 90 days)."""
    from django.utils import timezone
    from datetime import timedelta
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    qs = (
        DailyConsumption.objects.filter(is_valid=True, date__gte=thirty_days_ago)
        .values("department")
        .annotate(total=Sum("quantity_used"))
        .order_by("-total")
    )
    return Response(list(qs))


@api_view(["GET"])
def analytics_abc_ranking(request):
    """Rank items by inventory value (cost × stock) with cumulative % for Pareto."""
    items = list(
        InventoryItem.objects.select_related("stock").all()
    )
    ranked = []
    for item in items:
        stock_qty = float(item.stock.quantity_available) if hasattr(item, "stock") else 0
        value = float(item.cost_per_unit) * stock_qty
        ranked.append({"name": item.item_name, "value": round(value, 2), "category": item.category})

    ranked.sort(key=lambda x: x["value"], reverse=True)
    total_value = sum(r["value"] for r in ranked) or 1
    cumulative = 0
    for r in ranked:
        cumulative += r["value"]
        r["cumulative_pct"] = round((cumulative / total_value) * 100, 1)

    return Response(ranked)


@api_view(["GET"])
def analytics_inventory_health(request):
    """Returns counts and % breakdown for Safe/Watch/Reorder items."""
    items = InventoryItem.objects.all()
    safe = watch = critical = 0
    for item in items:
        rec = (
            ReorderRecommendation.objects.filter(item=item)
            .order_by("-generated_at")
            .first()
        )
        if rec and "reorder_now" in rec.explanation:
            critical += 1
        elif rec and "watch" in rec.explanation:
            watch += 1
        else:
            safe += 1

    total = safe + watch + critical or 1
    health_score = round((safe / total) * 100)
    return Response({
        "safe": safe, "watch": watch, "critical": critical,
        "total": total, "health_score": health_score,
        "breakdown": [
            {"name": "Safe",     "value": safe,     "color": "#10b981"},
            {"name": "Watch",    "value": watch,    "color": "#f59e0b"},
            {"name": "Critical", "value": critical, "color": "#ef4444"},
        ]
    })


@api_view(["GET"])
def analytics_turnover_rate(request):
    """
    Classify every InventoryItem by its average daily consumption over the
    last 30 days and return bucketed counts + per-item detail.

    Buckets:
      Fast Moving   : avg_daily > 10
      Medium Moving : 2 < avg_daily <= 10
      Slow Moving   : 0 < avg_daily <= 2
      Non Moving    : avg_daily == 0
    """
    PERIOD_DAYS = 30
    cutoff = date.today() - timedelta(days=PERIOD_DAYS)

    items = InventoryItem.objects.all()
    fast = medium = slow = non_moving = 0
    item_details = []

    for item in items:
        result = DailyConsumption.objects.filter(
            item=item, is_valid=True, date__gte=cutoff
        ).aggregate(total=Sum("quantity_used"))
        total_consumed = float(result["total"] or 0)
        avg_daily = total_consumed / PERIOD_DAYS

        if avg_daily == 0:
            speed = "non_moving"
            non_moving += 1
        elif avg_daily <= 2:
            speed = "slow"
            slow += 1
        elif avg_daily <= 10:
            speed = "medium"
            medium += 1
        else:
            speed = "fast"
            fast += 1

        item_details.append({
            "name": item.item_name,
            "category": item.category,
            "avg_daily": round(avg_daily, 2),
            "speed": speed,
        })

    item_details.sort(key=lambda x: x["avg_daily"], reverse=True)

    return Response({
        "buckets": [
            {"name": "Fast Moving",   "value": fast,       "color": "#10b981", "threshold": "> 10 units/day"},
            {"name": "Medium Moving", "value": medium,     "color": "#3b82f6", "threshold": "2–10 units/day"},
            {"name": "Slow Moving",   "value": slow,       "color": "#f59e0b", "threshold": "< 2 units/day"},
            {"name": "Non Moving",    "value": non_moving, "color": "#ef4444", "threshold": "0 units"},
        ],
        "items": item_details,
        "period_days": PERIOD_DAYS,
    })


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

    # Support ?days=N to limit history window (default: 30)
    try:
        days = max(7, int(request.query_params.get("days", 30)))
    except (ValueError, TypeError):
        days = 30
    cutoff = date.today() - timedelta(days=days)

    # history — aggregated by date so multi-department entries merge cleanly
    history_qs = (
        DailyConsumption.objects.filter(item=item, is_valid=True, date__gte=cutoff)
        .order_by("date")
    )
    history = ConsumptionHistorySerializer(history_qs, many=True).data

    # next 7 days forecast (all 3 models)
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


# ──────────────────────────────────────────────────────────
# User profile endpoints
# ──────────────────────────────────────────────────────────

@api_view(["PUT"])
def user_update_name(request):
    user = get_demo_user(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response({"error": "Name is required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(name) < 2:
        return Response({"error": "Name must be at least 2 characters."}, status=status.HTTP_400_BAD_REQUEST)

    parts = name.split(" ", 1)
    user.first_name = parts[0]
    user.last_name  = parts[1] if len(parts) > 1 else ""
    user.save(update_fields=["first_name", "last_name"])

    return Response({"success": True, "name": name})


@api_view(["PUT"])
def user_update_email(request):
    user = get_demo_user(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    email = (request.data.get("email") or "").strip()
    if not email:
        return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if "@" not in email or "." not in email.split("@")[-1]:
        return Response({"error": "Enter a valid email address."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exclude(pk=user.pk).exists():
        return Response({"error": "This email is already in use."}, status=status.HTTP_400_BAD_REQUEST)

    user.email = email
    user.save(update_fields=["email"])

    return Response({"success": True, "email": email})


@api_view(["PUT"])
def user_update_password(request):
    user = get_demo_user(request)
    if not user:
        return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    current_password = request.data.get("current_password", "")
    new_password     = request.data.get("new_password", "")

    if not current_password:
        return Response({"error": "Current password is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not new_password or len(new_password) < 8:
        return Response({"error": "New password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)
    if not user.check_password(current_password):
        return Response({"error": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save(update_fields=["password"])

    return Response({"success": True})
