import os
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum

from inventory.models import InventoryItem, InventoryStock
from forecasting.models import ForecastResult
from alerts.models import ReorderRecommendation


def generate_reorder_recommendations(
    lead_time=None, safety_buffer=None, model_name="arima"
):
    """
    For each InventoryStock, sum predicted demand over the lead-time window,
    project remaining stock, and create ReorderRecommendation rows.

    Alert levels (stored in explanation): 'reorder_now', 'watch', 'safe'.
    Suggested reorder quantity = max(0, forecasted_demand - projected_stock + safety_buffer)
    """
    if lead_time is None:
        lead_time = int(os.getenv("DEFAULT_LEAD_TIME_DAYS", 3))
    if safety_buffer is None:
        safety_buffer = Decimal(os.getenv("SAFETY_BUFFER", "10"))
    else:
        safety_buffer = Decimal(safety_buffer)

    today = date.today()
    start = today + timedelta(days=1)
    end = today + timedelta(days=lead_time)

    stocks = InventoryStock.objects.select_related("item").all()

    recommendations = []

    for stock in stocks:
        item = stock.item
        current_stock = Decimal(stock.quantity_available)
        reorder_level = Decimal(stock.reorder_level)

        # sum forecasted demand over lead time window
        forecasts = ForecastResult.objects.filter(
            item=item,
            model_name=model_name,
            forecast_date__gte=start,
            forecast_date__lte=end,
        ).aggregate(total=Sum("predicted_demand"))
        total_pred = forecasts.get("total") or Decimal("0")

        # projected stock after demand during lead time
        projected_stock = (current_stock - total_pred).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # determine alert level
        if projected_stock < reorder_level:
            level = "reorder_now"
        elif projected_stock < (reorder_level + safety_buffer):
            level = "watch"
        else:
            level = "safe"

        # average daily demand over lead time
        avg_daily = Decimal("0")
        if lead_time > 0:
            avg_daily = (total_pred / Decimal(lead_time)).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        # ── suggested_reorder_qty ─────────────────────────────────────────
        # How much to order so that after receiving stock we have enough
        # to cover demand over lead time + sit above safety threshold.
        #
        #  target = reorder_level + safety_buffer
        #  need   = target - projected_stock   (how far below target we are/will be)
        #
        # For "safe" items the calculation naturally yields ≤ 0 → 0.
        target_stock = reorder_level + safety_buffer
        suggested = target_stock - projected_stock
        if suggested < 0:
            suggested = Decimal("0")
        suggested = suggested.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        # days of stock = current stock divided by avg daily consumption
        days_of_stock_left = Decimal("0")
        if avg_daily > 0:
            days_of_stock_left = (current_stock / avg_daily).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

        explanation = (
            f"alert_level={level}; lead_time_days={lead_time}; model={model_name}"
        )

        recommendations.append(
            ReorderRecommendation(
                item=item,
                current_stock=current_stock,
                reorder_level=reorder_level,
                predicted_demand_7d=total_pred.quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                ),
                days_of_stock_left=days_of_stock_left,
                suggested_reorder_qty=suggested,
                status="pending",
                explanation=explanation,
            )
        )

    # persist recommendations: delete today's generated ones for these items
    if recommendations:
        with transaction.atomic():
            items = [r.item for r in recommendations]
            ReorderRecommendation.objects.filter(item__in=items).delete()
            ReorderRecommendation.objects.bulk_create(recommendations)

    return len(recommendations)
