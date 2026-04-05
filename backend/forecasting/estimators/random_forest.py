import numpy as np
import pandas as pd
import logging
from sklearn.ensemble import RandomForestRegressor
from datetime import timedelta

logger = logging.getLogger(__name__)

def run_rf(df, val_days, horizon, features):
    try:
        df_rf = df.dropna()
        if len(df_rf) <= val_days:
            return None, None

        X = df_rf[features].values
        Y = df_rf['y_capped'].values

        X_train, Y_train = X[:-val_days], Y[:-val_days]
        X_val, Y_val     = X[-val_days:], Y[-val_days:]

        rf = RandomForestRegressor(n_estimators=100, max_depth=15, min_samples_split=4, random_state=42)
        rf.fit(X_train, Y_train)
        val_pred = np.clip(rf.predict(X_val), 0, None)

        rf.fit(X, Y)
        
        future_preds = []
        current_df = df.copy()
        
        for i in range(horizon):
            nxt_date = current_df.index[-1] + timedelta(days=1)
            row = pd.DataFrame(index=[nxt_date])
            row['y_capped'] = np.nan
            row['day_of_week'] = nxt_date.weekday()
            row['is_weekend'] = int(nxt_date.weekday() in [5, 6])
            row['month'] = nxt_date.month
            
            current_df = pd.concat([current_df, row])
            
            current_df['lag_1'] = current_df['y_capped'].shift(1)
            current_df['lag_7'] = current_df['y_capped'].shift(7)
            current_df['lag_14'] = current_df['y_capped'].shift(14)
            current_df['rolling_mean_7'] = current_df['y_capped'].rolling(7).mean()
            current_df['rolling_std_7'] = current_df['y_capped'].rolling(7).std().fillna(0)
            
            nxt_x = current_df.iloc[-1][features].values.reshape(1, -1)
            nxt_pred = max(0, rf.predict(nxt_x)[0])
            
            current_df.iloc[-1, current_df.columns.get_loc('y_capped')] = nxt_pred
            future_preds.append(nxt_pred)

        return val_pred, np.array(future_preds)
    except Exception as e:
        logger.warning(f"Random Forest failed: {e}")
        return None, None
