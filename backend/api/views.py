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
    """
    Returns Safe / Watch / Critical / Overstock counts + per-item detail.

    Priority (highest wins):
      1. Critical  – latest recommendation contains 'reorder_now'
      2. Watch     – latest recommendation contains 'watch'
      3. Overstock – current stock > 3 × reorder_level  (excess inventory)
      4. Safe      – everything else
    """
    safe = watch = critical = overstock = 0
    item_details = []

    STATUS_PRIORITY = {"critical": 0, "watch": 1, "overstock": 2, "safe": 3}

    for item in InventoryItem.objects.select_related("stock").all():
        rec = (
            ReorderRecommendation.objects.filter(item=item)
            .order_by("-generated_at")
            .first()
        )
        stock = getattr(item, "stock", None)

        # Overstock: current stock is more than 3× the reorder threshold
        is_overstock = (
            stock is not None
            and float(stock.reorder_level) > 0
            and float(stock.quantity_available) > 3 * float(stock.reorder_level)
        )

        if rec and "reorder_now" in rec.explanation:
            status = "critical";  critical  += 1
        elif rec and "watch" in rec.explanation:
            status = "watch";     watch     += 1
        elif is_overstock:
            status = "overstock"; overstock += 1
        else:
            status = "safe";      safe      += 1

        item_details.append({
            "name":          item.item_name,
            "category":      item.category,
            "status":        status,
            "current_stock": round(float(stock.quantity_available), 1) if stock else 0,
            "reorder_level": round(float(stock.reorder_level),      1) if stock else 0,
            "days_left":     rec.days_of_stock_left if rec else None,
        })

    total = safe + watch + critical + overstock or 1
    # Health score: only "safe" items count as healthy
    health_score = round((safe / total) * 100)

    item_details.sort(key=lambda x: STATUS_PRIORITY[x["status"]])

    return Response({
        "safe": safe, "watch": watch, "critical": critical, "overstock": overstock,
        "total": total, "health_score": health_score,
        "breakdown": [
            {"name": "Safe",      "value": safe,      "color": "#10b981"},
            {"name": "Watch",     "value": watch,     "color": "#f59e0b"},
            {"name": "Critical",  "value": critical,  "color": "#ef4444"},
            {"name": "Overstock", "value": overstock, "color": "#8b5cf6"},
        ],
        "items": item_details,
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
def analytics_stock_value(request):
    """
    Returns inventory financial value grouped by category.

    For each item:  value = cost_per_unit × quantity_available
    Groups totals by item.category, returns:
      - categories  : list sorted by total value desc
      - items        : every item with rank and % share
      - grand_total  : total value of all inventory
    """
    items = InventoryItem.objects.select_related("stock", "supplier").all()

    category_map  = {}   # { "Food": { "category", "value", "item_count" } }
    item_details  = []
    grand_total   = 0.0

    for item in items:
        stock = getattr(item, "stock", None)
        qty   = float(stock.quantity_available) if stock else 0.0
        cost  = float(item.cost_per_unit)
        value = round(cost * qty, 2)
        grand_total += value

        cat = item.category or "Uncategorized"
        if cat not in category_map:
            category_map[cat] = {"category": cat, "value": 0.0, "item_count": 0}
        category_map[cat]["value"]      = round(category_map[cat]["value"] + value, 2)
        category_map[cat]["item_count"] += 1

        item_details.append({
            "name":          item.item_name,
            "category":      cat,
            "unit":          item.unit,
            "quantity":      round(qty, 1),
            "cost_per_unit": round(cost, 2),
            "total_value":   value,
        })

    grand_total = round(grand_total, 2)

    # Enrich categories with % share, sorted highest value first
    categories = sorted(category_map.values(), key=lambda x: x["value"], reverse=True)
    for cat in categories:
        cat["pct"] = round((cat["value"] / grand_total) * 100, 1) if grand_total else 0

    # Rank items by value, enrich with % share
    item_details.sort(key=lambda x: x["total_value"], reverse=True)
    for rank, item in enumerate(item_details, start=1):
        item["rank"] = rank
        item["pct"]  = round((item["total_value"] / grand_total) * 100, 2) if grand_total else 0

    top_cat = categories[0] if categories else {}

    return Response({
        "categories":       categories,
        "items":            item_details,
        "grand_total":      grand_total,
        "total_items":      len(item_details),
        "total_categories": len(categories),
        "top_category":     top_cat.get("category", "N/A"),
        "top_category_pct": top_cat.get("pct", 0),
    })


@api_view(["GET"])
def items_list(request):

    today = date.today()
    horizon_end = today + timedelta(days=7)
    items = InventoryItem.objects.select_related("supplier", "stock").all()
    data = []

    for item in items:
        # ── Next-7-day forecast sum (all models averaged)
        forecast_sum = ForecastResult.objects.filter(
            item=item, forecast_date__gt=today, forecast_date__lte=horizon_end
        ).aggregate(total=Sum("predicted_demand"))
        next7 = float(forecast_sum.get("total") or 0)

        # ── Latest reorder recommendation
        rec = (
            ReorderRecommendation.objects.filter(item=item)
            .order_by("-generated_at")
            .first()
        )
        days_left = rec.days_of_stock_left if rec else None

        # ── Stock metrics
        stock = getattr(item, "stock", None)
        qty          = float(stock.quantity_available) if stock else 0
        reorder_lvl  = float(stock.reorder_level)      if stock else 0
        stock_ratio  = round(qty / reorder_lvl, 2)     if reorder_lvl > 0 else None
        is_overstock = (reorder_lvl > 0 and qty > 3 * reorder_lvl)

        # ── 4-way status classification
        if rec and "reorder_now" in rec.explanation:
            risk = "critical"
        elif rec and "watch" in rec.explanation:
            risk = "low"
        elif is_overstock:
            risk = "overstock"
        else:
            risk = "normal"

        serializer = ItemListSerializer(item, context={"request": request})
        item_data  = serializer.data
        item_data["forecast_next_7d"]  = round(next7, 1)
        item_data["risk_status"]       = risk          # normal | low | critical | overstock
        item_data["days_of_stock_left"] = days_left
        item_data["stock_ratio"]       = stock_ratio
        data.append(item_data)

    return Response(data)



@api_view(["GET"])
def item_detail(request, pk):
    item = InventoryItem.objects.select_related("supplier", "stock").get(pk=pk)

    # ── Latest recommendation
    rec       = ReorderRecommendation.objects.filter(item=item).order_by("-generated_at").first()
    days_left = rec.days_of_stock_left if rec else None

    # ── Stock metrics
    stock        = getattr(item, "stock", None)
    qty          = float(stock.quantity_available) if stock else 0
    reorder_lvl  = float(stock.reorder_level)      if stock else 0
    stock_ratio  = round(qty / reorder_lvl, 2)     if reorder_lvl > 0 else None
    is_overstock = reorder_lvl > 0 and qty > 3 * reorder_lvl

    # ── 7-day AI forecast total
    today       = date.today()
    horizon_end = today + timedelta(days=7)
    forecast_sum = ForecastResult.objects.filter(
        item=item, forecast_date__gt=today, forecast_date__lte=horizon_end
    ).aggregate(total=Sum("predicted_demand"))
    next7 = round(float(forecast_sum.get("total") or 0), 1)

    # ── 4-way status classification (matches items_list logic)
    if rec and "reorder_now" in rec.explanation:
        risk = "critical"
    elif rec and "watch" in rec.explanation:
        risk = "low"
    elif is_overstock:
        risk = "overstock"
    else:
        risk = "normal"

    serializer = ItemDetailSerializer(item, context={"request": request})
    data = dict(serializer.data)
    data["risk_status"]        = risk
    data["days_of_stock_left"] = days_left
    data["stock_ratio"]        = stock_ratio
    data["forecast_next_7d"]   = next7

    return Response(data)


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

    # ── Module 4: Compute MAPE accuracy for each model ──────────────────────
    # Strategy: compare each model's 7-day forecast avg/day vs actual avg/day
    # from the last 7 days of real consumption. This is valid because MAPE
    # measures how far predictions are from reality in percentage terms.
    recent_start = today - timedelta(days=7)
    recent_actual_qs = (
        DailyConsumption.objects.filter(
            item=item, is_valid=True,
            date__gte=recent_start, date__lt=today
        )
        .values("date")
        .annotate(total=Sum("quantity_used"))
    )
    actual_by_day = [float(r["total"]) for r in recent_actual_qs if float(r["total"]) > 0]
    avg_actual = sum(actual_by_day) / len(actual_by_day) if actual_by_day else None

    # Future forecasts: avg daily demand per model
    future_forecast_qs = ForecastResult.objects.filter(
        item=item, forecast_date__gt=today, forecast_date__lte=horizon_end
    )

    model_totals = {"arima": [], "random_forest": [], "lstm": []}
    for fr in future_forecast_qs:
        if fr.model_name in model_totals:
            model_totals[fr.model_name].append(float(fr.predicted_demand))

    def _mape_vs_actual(predicted_vals, actual_avg):
        """MAPE: mean of |actual - pred| / actual × 100 across all forecast days"""
        if not predicted_vals or actual_avg is None or actual_avg == 0:
            return None
        return round(
            sum(abs(actual_avg - p) / actual_avg * 100 for p in predicted_vals) / len(predicted_vals),
            1
        )

    accuracy = {
        "arima":         _mape_vs_actual(model_totals["arima"], avg_actual),
        "random_forest": _mape_vs_actual(model_totals["random_forest"], avg_actual),
        "lstm":          _mape_vs_actual(model_totals["lstm"], avg_actual),
    }
    # ────────────────────────────────────────────────────────────────────────

    # Module 10: Last updated timestamp
    latest = ForecastResult.objects.filter(item=item).order_by("-generated_at").first()
    last_generated = latest.generated_at.isoformat() if latest else None

    # ── Module 7: Anomaly Detection (Z-score ±2σ) ────────────────────────────
    # Aggregate history by date first
    agg_qs = (
        DailyConsumption.objects.filter(item=item, is_valid=True, date__gte=cutoff)
        .values("date")
        .annotate(total=Sum("quantity_used"))
        .order_by("date")
    )
    daily_values = [(r["date"], float(r["total"])) for r in agg_qs]

    anomalies = []
    if len(daily_values) >= 3:
        vals = [v for _, v in daily_values]
        mean = sum(vals) / len(vals)
        variance = sum((v - mean) ** 2 for v in vals) / len(vals)
        std = variance ** 0.5

        if std > 0:
            for d, v in daily_values:
                z = (v - mean) / std
                if abs(z) > 2:
                    anomalies.append({
                        "date":  d.isoformat(),
                        "value": round(v, 2),
                        "type":  "spike" if z > 0 else "dip",
                        "z_score": round(z, 2),
                    })
    # ────────────────────────────────────────────────────────────────────────

    return Response({
        "history": history,
        "forecast": forecast,
        "accuracy": accuracy,
        "last_generated": last_generated,
        "anomalies": anomalies,
    })


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
