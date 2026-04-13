import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

os.makedirs("../results", exist_ok=True)

# =========================
# LOAD DATA (NO HEADERS)
# =========================
df = pd.read_csv("../data/german_credit.csv", sep=" ", header=None)

# =========================
# ADD COLUMN NAMES
# =========================
columns = [f"col_{i}" for i in range(20)] + ["target"]
df.columns = columns

# =========================
# TARGET
# =========================
y = df["target"]
X = df.drop("target", axis=1)

# =========================
# ENCODING
# =========================
X = pd.get_dummies(X)

# =========================
# =========================
# SPLIT
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Convert to numpy (IMPORTANT)
X_train = X_train.values
X_test = X_test.values
y_train = y_train.values
y_test = y_test.values

# =========================
# MODEL
# =========================
model = RandomForestClassifier()
model.fit(X_train, y_train)

baseline_acc = model.score(X_test, y_test)

# =========================
# SCENARIOS
# =========================
def add_noise(X):
    return X + np.random.normal(0, 0.1, X.shape)

def shift(X):
    return X * 1.2

def remove_feature(X):
    X_copy = X.copy()
    X_copy[:, 0] = 0
    return X_copy

X_noise = add_noise(X_test)
X_shift = shift(X_test)
X_removed = remove_feature(X_test)

# =========================
# ACCURACY
# =========================
acc_noise = model.score(X_noise, y_test)
acc_shift = model.score(X_shift, y_test)
acc_removed = model.score(X_removed, y_test)

# =========================
# PSI (simple version)
# =========================
def calculate_psi(a, b):
    return np.mean(np.abs(a - b))

psi_noise = calculate_psi(X_test, X_noise)
psi_shift = calculate_psi(X_test, X_shift)

# =========================
# RESULTS
# =========================
results = [
    {"dataset": "German Credit", "scenario": "noise", "accuracy": acc_noise, "acc_drop": baseline_acc - acc_noise, "psi": psi_noise},
    {"dataset": "German Credit", "scenario": "shift", "accuracy": acc_shift, "acc_drop": baseline_acc - acc_shift, "psi": psi_shift},
    {"dataset": "German Credit", "scenario": "feature_removed", "accuracy": acc_removed, "acc_drop": baseline_acc - acc_removed, "psi": 0}
]

df_results = pd.DataFrame(results)

print(df_results)

df_results.to_csv("../results/german_results.csv", index=False)

print("[OK] German Credit dataset done")