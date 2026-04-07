import numpy as np
import logging

# Set seed for numpy reproducibility
np.random.seed(42)

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    
    # Set seed for torch reproducibility
    torch.manual_seed(42)
except ImportError:
    torch = None

from sklearn.preprocessing import MinMaxScaler

logger = logging.getLogger(__name__)

class DemandLSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(input_size=1, hidden_size=64, num_layers=2, batch_first=True, dropout=0.2)
        self.fc1 = nn.Linear(64, 32)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(32, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = out[:, -1, :]
        out = self.relu(self.fc1(out))
        return self.fc2(out)

def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(data[i + seq_length])
    return np.array(xs), np.array(ys)

def run_lstm(y_arr, val_days, horizon):
    if torch is None: # Graceful fallback
        return None, None
        
    SEQ_LEN = 14
    if len(y_arr) <= SEQ_LEN + val_days + 14:
        return None, None

    try:
        scaler = MinMaxScaler(feature_range=(0, 1))
        y_scaled = scaler.fit_transform(y_arr.reshape(-1, 1)).flatten()

        X_seq, Y_seq = create_sequences(y_scaled, SEQ_LEN)

        X_train_seq, Y_train_seq = X_seq[:-val_days], Y_seq[:-val_days]
        X_val_seq, Y_val_seq     = X_seq[-val_days:], Y_seq[-val_days:]

        X_train_t = torch.tensor(X_train_seq, dtype=torch.float32).unsqueeze(-1)
        Y_train_t = torch.tensor(Y_train_seq, dtype=torch.float32).unsqueeze(-1)
        
        dataset = TensorDataset(X_train_t, Y_train_t)
        loader = DataLoader(dataset, batch_size=16, shuffle=True)

        model_lstm = DemandLSTM()
        optimizer = torch.optim.Adam(model_lstm.parameters(), lr=0.005)
        criterion = nn.MSELoss()

        model_lstm.train()
        for epoch in range(30):
            for b_x, b_y in loader:
                optimizer.zero_grad()
                loss = criterion(model_lstm(b_x), b_y)
                loss.backward()
                optimizer.step()

        model_lstm.eval()
        with torch.no_grad():
            val_pred_scaled = []
            window = list(y_scaled[-(val_days + SEQ_LEN):-val_days])
            for _ in range(val_days):
                inp = torch.tensor([window[-SEQ_LEN:]], dtype=torch.float32).unsqueeze(-1)
                pred = model_lstm(inp).item()
                val_pred_scaled.append(pred)
                window.append(pred)

            val_pred = scaler.inverse_transform(np.array(val_pred_scaled).reshape(-1, 1)).flatten()
            val_pred = np.clip(val_pred, 0, None)

        # Full training
        X_full_t = torch.tensor(X_seq, dtype=torch.float32).unsqueeze(-1)
        Y_full_t = torch.tensor(Y_seq, dtype=torch.float32).unsqueeze(-1)
        dataset_full = TensorDataset(X_full_t, Y_full_t)
        loader_full = DataLoader(dataset_full, batch_size=16, shuffle=True)
        
        model_lstm_full = DemandLSTM()
        optimizer_f = torch.optim.Adam(model_lstm_full.parameters(), lr=0.005)
        model_lstm_full.train()
        for epoch in range(30):
            for b_x, b_y in loader_full:
                optimizer_f.zero_grad()
                loss = criterion(model_lstm_full(b_x), b_y)
                loss.backward()
                optimizer_f.step()
        
        model_lstm_full.eval()
        with torch.no_grad():
            fut_pred_scaled = []
            window = list(y_scaled[-SEQ_LEN:])
            for _ in range(horizon):
                inp = torch.tensor([window[-SEQ_LEN:]], dtype=torch.float32).unsqueeze(-1)
                pred = model_lstm_full(inp).item()
                fut_pred_scaled.append(pred)
                window.append(pred)

            fut_pred = scaler.inverse_transform(np.array(fut_pred_scaled).reshape(-1, 1)).flatten()
            fut_pred = np.clip(fut_pred, 0, None)

        return val_pred, fut_pred
    except Exception as e:
        logger.warning(f"LSTM failed: {e}")
        return None, None
