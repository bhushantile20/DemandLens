import numpy as np
import logging
from statsmodels.tsa.arima.model import ARIMA as StatsmodelsARIMA

logger = logging.getLogger(__name__)

def run_arima(y_arr, val_days, horizon):
    """
    Standard textbook ARIMA model without seasonality
    to adhere strictly to standard terminology.
    """
    try:
        train_y = y_arr[:-val_days]
        
        # Train on validation split
        model_train = StatsmodelsARIMA(train_y, order=(1, 1, 1), enforce_stationarity=False, enforce_invertibility=False)
        fit_train = model_train.fit()
        val_pred = np.clip(fit_train.forecast(val_days), 0, None)
        
        # Train on full data for future horizon
        model_full = StatsmodelsARIMA(y_arr, order=(1, 1, 1), enforce_stationarity=False, enforce_invertibility=False)
        fit_full = model_full.fit()
        fut_pred = np.clip(fit_full.forecast(horizon), 0, None)
        
        return val_pred, fut_pred
    except Exception as e:
        logger.warning(f"ARIMA failed: {e}")
        return None, None
