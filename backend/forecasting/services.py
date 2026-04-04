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


def run_forecast(horizon=7):
    """
    Build daily demand series per item from valid DailyConsumption rows and
    produce dual forecasts (ETS + Random Forest) saved to ForecastResult.
    """
    try:
        import numpy as np
        import pandas as pd
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        from sklearn.ensemble import RandomForestRegressor
    except Exception:
        np = None
        pd = None
        ExponentialSmoothing = None
        RandomForestRegressor = None

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
        last_date = full_dates[-1]

        # ==========================================
        # MODEL 1: Exponential Smoothing (ETS)
        # ==========================================
        ets_forecast = []
        if ExponentialSmoothing is not None and len(series) >= 7:
            try:
                # simple ETS without seasonality for MVP
                model = ExponentialSmoothing(series, trend=None, seasonal=None)
                fit = model.fit(optimized=True)
                ets_forecast = list(fit.forecast(horizon))
            except Exception:
                pass

        if not ets_forecast:
            # fallback
            avg = 0.0 if len(series) == 0 else float(sum(series[-7:]) / min(7, len(series)))
            ets_forecast = [avg for _ in range(horizon)]

        for i, fv in enumerate(ets_forecast, start=1):
            fdate = last_date + timedelta(days=i)
            predicted = Decimal(max(0, fv)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            results_to_create.append(
                ForecastResult(
                    item_id=item_id, forecast_date=fdate,
                    predicted_demand=predicted, model_name='exponential_smoothing'
                )
            )

        # ==========================================
        # MODEL 2: Random Forest (Machine Learning)
        # ==========================================
        rf_forecast = []
        if RandomForestRegressor is not None and len(series) >= 14:
            try:
                X, y = [], []
                # Train on past data
                for i in range(7, len(series)):
                    d = full_dates[i]
                    X.append([
                        d.weekday(), 
                        series[i-1], 
                        series[i-7], 
                        sum(series[i-7:i]) / 7.0
                    ])
                    y.append(series[i])
                
                rf = RandomForestRegressor(n_estimators=50, random_state=42)
                rf.fit(X, y)
                
                # Autoregressively predict into the future
                current_s = list(series)
                current_d = list(full_dates)
                for _ in range(horizon):
                    nxt_d = current_d[-1] + timedelta(days=1)
                    nxt_X = [[
                        nxt_d.weekday(),
                        current_s[-1],
                        current_s[-7],
                        sum(current_s[-7:]) / 7.0
                    ]]
                    pred = rf.predict(nxt_X)[0]
                    rf_forecast.append(pred)
                    current_s.append(pred)
                    current_d.append(nxt_d)
            except Exception:
                pass
                
        if not rf_forecast:
            # ML fallback
            avg = 0.0 if len(series) == 0 else float(sum(series[-7:]) / min(7, len(series)))
            rf_forecast = [avg for _ in range(horizon)]

        for i, fv in enumerate(rf_forecast, start=1):
            fdate = last_date + timedelta(days=i)
            predicted = Decimal(max(0, fv)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            results_to_create.append(
                ForecastResult(
                    item_id=item_id, forecast_date=fdate,
                    predicted_demand=predicted, model_name='random_forest'
                )
            )

    # persist forecasts; ensure unique constraint handling by clearing old
    if results_to_create:
        with transaction.atomic():
            ForecastResult.objects.all().delete()
            ForecastResult.objects.bulk_create(results_to_create)

    return len(results_to_create)
