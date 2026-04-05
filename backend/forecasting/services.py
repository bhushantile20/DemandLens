import logging
import warnings
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Sum

from consumption.models import DailyConsumption
from forecasting.models import ForecastResult

from .estimators.ARIMA import run_arima
from .estimators.random_forest import run_rf
from .estimators.lstm import run_lstm

logger = logging.getLogger(__name__)
warnings.filterwarnings("ignore")

def _daterange(start_date, end_date):
    d = start_date
    while d <= end_date:
        yield d
        d += timedelta(days=1)

def run_forecast(horizon=7, val_days=14):
    """
    Decoupled ML Pipeline Orchestrator.
    Handles data ingestion, preprocessing, calls the 3 standalone estimators,
    and calculates the final weighted ensemble before saving to PostgreSQL.
    """
    try:
        import numpy as np
        import pandas as pd
        from sklearn.metrics import mean_absolute_percentage_error
    except ImportError as e:
        logger.error(f"Missing core numerical dependencies: {e}")
        return 0

    qs = (
        DailyConsumption.objects.filter(is_valid=True, item__isnull=False)
        .values("item", "date")
        .annotate(total=Sum("quantity_used"))
        .order_by("item", "date")
    )

    items_data = defaultdict(list)
    for row in qs:
        items_data[row["item"]].append((row["date"], float(row["total"])))

    results_to_create = []

    for item_id, observations in items_data.items():
        try:
            observations.sort(key=lambda x: x[0])
            dates = [d for d, _ in observations]
            
            start_date = dates[0]
            end_date = dates[-1]
            full_dates = list(_daterange(start_date, end_date))
            
            value_map = {d: v for d, v in observations}
            
            series = []
            for d in full_dates:
                series.append(value_map.get(d, 0.0))

            df = pd.DataFrame({'date': full_dates, 'y': series})
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)

            cap = np.percentile(df['y'], 98) if len(df['y']) > 0 else 0
            df['y_capped'] = np.clip(df['y'], 0, cap)
            
            y_arr = df['y_capped'].values
            last_date = full_dates[-1]

            models_val_preds = {}
            models_future_preds = {}

            if len(y_arr) < val_days + 14:
                avg = np.mean(y_arr[-7:]) if len(y_arr) > 0 else 0.0
                future_fallback = np.full(horizon, avg)
                models_future_preds = {
                    'ensemble': future_fallback, 
                    'arima': future_fallback, 
                    'random_forest': future_fallback, 
                    'lstm': future_fallback
                }
            else:
                train_y = y_arr[:-val_days]
                val_y   = y_arr[-val_days:]
                
                def calc_mape(y_true, y_pred):
                    return mean_absolute_percentage_error(y_true + 1e-5, y_pred + 1e-5)

                # ==========================================
                # EXECUTE EXTERNAL ESTIMATORS
                # ==========================================
                
                # 1. ARIMA
                val_arima, fut_arima = run_arima(y_arr, val_days, horizon)
                if fut_arima is not None:
                    models_val_preds['arima'] = val_arima
                    models_future_preds['arima'] = fut_arima

                # 2. Random Forest
                df['day_of_week'] = df.index.dayofweek
                df['is_weekend'] = df.index.dayofweek.isin([5, 6]).astype(int)
                df['month'] = df.index.month
                df['lag_1'] = df['y_capped'].shift(1)
                df['lag_7'] = df['y_capped'].shift(7)
                df['lag_14'] = df['y_capped'].shift(14)
                df['rolling_mean_7'] = df['y_capped'].rolling(7).mean()
                df['rolling_std_7'] = df['y_capped'].rolling(7).std().fillna(0)
                
                rf_features = ['day_of_week', 'is_weekend', 'month', 'lag_1', 'lag_7', 'lag_14', 'rolling_mean_7', 'rolling_std_7']
                val_rf, fut_rf = run_rf(df, val_days, horizon, rf_features)
                if fut_rf is not None:
                    models_val_preds['random_forest'] = val_rf
                    models_future_preds['random_forest'] = fut_rf

                # 3. Deep Learning LSTM
                val_lstm, fut_lstm = run_lstm(y_arr, val_days, horizon)
                if fut_lstm is not None:
                    models_val_preds['lstm'] = val_lstm
                    models_future_preds['lstm'] = fut_lstm

                # ==========================================
                # INVERSE MAPE ENSEMBLE
                # ==========================================
                weights = {}
                for m in ['arima', 'random_forest', 'lstm']:
                    if m in models_val_preds and m in models_future_preds:
                        mape = calc_mape(val_y, models_val_preds[m])
                        weights[m] = 1.0 / (mape + 1e-4)
                
                total_weight = sum(weights.values())
                future_ensemble = np.zeros(horizon)
                active_models = []

                if total_weight > 0:
                    for m in weights:
                        weights[m] /= total_weight
                        future_ensemble += weights[m] * models_future_preds[m]
                        active_models.append(m)
                    models_future_preds['ensemble'] = future_ensemble
                else:
                    avg = np.mean(y_arr[-7:]) if len(y_arr) > 0 else 0.0
                    future_ensemble = np.full(horizon, avg)
                    models_future_preds['ensemble'] = future_ensemble
                    
                # Full compliance default fallbacks
                for m in ['arima', 'random_forest', 'lstm']:
                    if m not in models_future_preds:
                        models_future_preds[m] = future_ensemble

            for m, f_preds in models_future_preds.items():
                for i, fv in enumerate(f_preds, start=1):
                    fdate = last_date + timedelta(days=i)
                    predicted = Decimal(max(0, float(fv))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    results_to_create.append(
                        ForecastResult(
                            item_id=item_id, forecast_date=fdate,
                            predicted_demand=predicted, model_name=m
                        )
                    )
        except Exception as e:
            logger.error(f"Error forecasting item {item_id}: {e}")

    if results_to_create:
        with transaction.atomic():
            ForecastResult.objects.all().delete()
            ForecastResult.objects.bulk_create(results_to_create)

    return len(results_to_create)
