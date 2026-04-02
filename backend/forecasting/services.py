from collections import defaultdict
from datetime import timedelta, date
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum

from consumption.models import DailyConsumption
from forecasting.models import ForecastResult


def _daterange(start_date, end_date):
    d = start_date
    while d <= end_date:
        yield d
        d += timedelta(days=1)


def run_forecast(horizon=7, model_name="exponential_smoothing"):
    """
    Build daily demand series per item from valid DailyConsumption rows and
    produce forecasts saved to ForecastResult.

    Rules:
    - only use DailyConsumption where `is_valid=True` and `item` is set
    - aggregate by item and date
    - fill missing dates between min and max with 0
    - if history length >= 7 days, attempt ExponentialSmoothing
      otherwise fallback to average of recent values
    """
    try:
        import pandas as pd  # optional, used for safety checks
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
    except Exception:
        pd = None
        ExponentialSmoothing = None

    qs = (
        DailyConsumption.objects.filter(is_valid=True, item__isnull=False)
        .values("item", "date")
        .annotate(total=Sum("quantity_used"))
        .order_by("item", "date")
    )

    # group aggregated totals by item
    items_data = defaultdict(list)
    for row in qs:
        items_data[row["item"]].append((row["date"], float(row["total"])))

    results_to_create = []

    for item_id, observations in items_data.items():
        observations.sort(key=lambda x: x[0])
        dates = [d for d, _ in observations]
        values = [v for _, v in observations]

        start_date = dates[0]
        end_date = dates[-1]

        # build complete series filling missing dates with 0
        full_dates = list(_daterange(start_date, end_date))
        value_map = {d: v for d, v in observations}
        series = [float(value_map.get(d, 0.0)) for d in full_dates]

        # decide whether to run ExponentialSmoothing
        forecast_vals = []
        if ExponentialSmoothing is not None and len(series) >= 7:
            try:
                # simple ETS without seasonality for MVP
                model = ExponentialSmoothing(series, trend=None, seasonal=None)
                fit = model.fit(optimized=True)
                forecast_vals = list(fit.forecast(horizon))
            except Exception:
                forecast_vals = []

        if not forecast_vals:
            # fallback: average of recent up-to-7 values
            if len(series) == 0:
                avg = 0.0
            else:
                recent = series[-7:]
                avg = float(sum(recent) / len(recent))
            forecast_vals = [avg for _ in range(horizon)]

        last_date = full_dates[-1]
        for i, fv in enumerate(forecast_vals, start=1):
            fdate = last_date + timedelta(days=i)
            predicted = Decimal(fv).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            results_to_create.append(
                ForecastResult(
                    item_id=item_id,
                    forecast_date=fdate,
                    predicted_demand=predicted,
                    model_name=model_name,
                )
            )

    # persist forecasts; ensure unique constraint handling by deleting existing
    if results_to_create:
        with transaction.atomic():
            # determine forecast date range to clear for this model
            all_dates = set(r.forecast_date for r in results_to_create)
            ForecastResult.objects.filter(
                model_name=model_name, forecast_date__in=all_dates
            ).delete()
            ForecastResult.objects.bulk_create(results_to_create)

    return len(results_to_create)
