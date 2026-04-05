import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import numpy as np

val_days = 2
SEQ_LEN = 3
y_scaled = np.random.rand(100)

def create_sequences(data, seq_length):
    xs, ys = [], []
    for i in range(len(data) - seq_length):
        xs.append(data[i:(i + seq_length)])
        ys.append(data[i + seq_length])
    return np.array(xs), np.array(ys)

X_seq, Y_seq = create_sequences(y_scaled, SEQ_LEN)
X_train_seq, Y_train_seq = X_seq[:-val_days], Y_seq[:-val_days]

X_train_t = torch.tensor(X_train_seq, dtype=torch.float32).unsqueeze(-1)
Y_train_t = torch.tensor(Y_train_seq, dtype=torch.float32).unsqueeze(-1)
dataset = TensorDataset(X_train_t, Y_train_t)
loader = DataLoader(dataset, batch_size=16, shuffle=True)

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

model_lstm = DemandLSTM()
optimizer = torch.optim.Adam(model_lstm.parameters(), lr=0.005)
criterion = nn.MSELoss()

model_lstm.train()
try:
    for b_x, b_y in loader:
        optimizer.zero_grad()
        loss = criterion(model_lstm(b_x), b_y)
        loss.backward()
        optimizer.step()
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
