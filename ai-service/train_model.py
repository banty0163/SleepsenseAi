"""
SleepSense AI — Model Training Script
Trains a Random Forest + Gradient Boosting ensemble on synthetic Sleep Health data.
Educational purposes only.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib
import os
import json

# ─── Seed for reproducibility ────────────────────────────────────────────────
np.random.seed(42)

# ─── Disorder labels ──────────────────────────────────────────────────────────
DISORDERS = ["None", "Insomnia", "Sleep Apnea", "Narcolepsy", "Restless Legs Syndrome"]

def generate_synthetic_dataset(n_samples: int = 3000) -> pd.DataFrame:
    """
    Generate a realistic synthetic sleep health dataset.
    Each disorder class has clinically-inspired feature distributions.
    """
    records = []

    # ── Class 0: No disorder (healthy sleepers) ──────────────────────────────
    n = n_samples // 5
    records.append(pd.DataFrame({
        "age":               np.random.randint(20, 65, n),
        "gender":            np.random.choice([0, 1], n),           # 0=Female, 1=Male
        "sleep_duration":    np.random.uniform(7.0, 9.0, n),
        "stress_level":      np.random.randint(1, 5, n),
        "bmi":               np.random.uniform(18.5, 25.0, n),
        "heart_rate":        np.random.randint(60, 75, n),
        "physical_activity": np.random.randint(45, 90, n),
        "snoring_frequency": np.random.randint(0, 2, n),
        "daytime_sleepiness":np.random.randint(0, 3, n),
        "sleep_interruptions":np.random.randint(0, 2, n),
        "disorder":          0
    }))

    # ── Class 1: Insomnia ─────────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "age":               np.random.randint(25, 70, n),
        "gender":            np.random.choice([0, 1], n, p=[0.6, 0.4]),
        "sleep_duration":    np.random.uniform(3.0, 6.0, n),
        "stress_level":      np.random.randint(6, 10, n),
        "bmi":               np.random.uniform(22.0, 32.0, n),
        "heart_rate":        np.random.randint(70, 90, n),
        "physical_activity": np.random.randint(10, 40, n),
        "snoring_frequency": np.random.randint(0, 3, n),
        "daytime_sleepiness":np.random.randint(4, 8, n),
        "sleep_interruptions":np.random.randint(4, 10, n),
        "disorder":          1
    }))

    # ── Class 2: Sleep Apnea ─────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "age":               np.random.randint(35, 75, n),
        "gender":            np.random.choice([0, 1], n, p=[0.35, 0.65]),
        "sleep_duration":    np.random.uniform(5.0, 7.5, n),
        "stress_level":      np.random.randint(4, 8, n),
        "bmi":               np.random.uniform(28.0, 42.0, n),
        "heart_rate":        np.random.randint(65, 85, n),
        "physical_activity": np.random.randint(5, 35, n),
        "snoring_frequency": np.random.randint(6, 10, n),
        "daytime_sleepiness":np.random.randint(5, 9, n),
        "sleep_interruptions":np.random.randint(5, 10, n),
        "disorder":          2
    }))

    # ── Class 3: Narcolepsy ───────────────────────────────────────────────────
    records.append(pd.DataFrame({
        "age":               np.random.randint(15, 50, n),
        "gender":            np.random.choice([0, 1], n),
        "sleep_duration":    np.random.uniform(8.0, 11.0, n),
        "stress_level":      np.random.randint(3, 7, n),
        "bmi":               np.random.uniform(20.0, 30.0, n),
        "heart_rate":        np.random.randint(60, 80, n),
        "physical_activity": np.random.randint(15, 50, n),
        "snoring_frequency": np.random.randint(1, 4, n),
        "daytime_sleepiness":np.random.randint(7, 10, n),
        "sleep_interruptions":np.random.randint(2, 6, n),
        "disorder":          3
    }))

    # ── Class 4: Restless Legs Syndrome ──────────────────────────────────────
    records.append(pd.DataFrame({
        "age":               np.random.randint(30, 70, n),
        "gender":            np.random.choice([0, 1], n, p=[0.55, 0.45]),
        "sleep_duration":    np.random.uniform(4.0, 6.5, n),
        "stress_level":      np.random.randint(5, 9, n),
        "bmi":               np.random.uniform(21.0, 35.0, n),
        "heart_rate":        np.random.randint(65, 82, n),
        "physical_activity": np.random.randint(10, 45, n),
        "snoring_frequency": np.random.randint(0, 3, n),
        "daytime_sleepiness":np.random.randint(4, 8, n),
        "sleep_interruptions":np.random.randint(6, 10, n),
        "disorder":          4
    }))

    df = pd.concat(records, ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle
    return df


def add_noise(df: pd.DataFrame, noise_frac: float = 0.05) -> pd.DataFrame:
    """Add small Gaussian noise to numeric columns for realism."""
    numeric_cols = ["sleep_duration", "bmi", "heart_rate"]
    for col in numeric_cols:
        noise = np.random.normal(0, df[col].std() * noise_frac, len(df))
        df[col] = (df[col] + noise).round(2)
    return df


def train_and_save_model():
    print("=" * 60)
    print("  SleepSense AI — Model Training")
    print("=" * 60)

    # 1. Generate dataset
    print("\n[1/5] Generating synthetic dataset...")
    df = generate_synthetic_dataset(n_samples=5000)
    df = add_noise(df)
    print(f"      Dataset shape: {df.shape}")
    print(f"      Class distribution:\n{df['disorder'].value_counts().sort_index()}")

    # 2. Feature / target split
    FEATURES = [
        "age", "gender", "sleep_duration", "stress_level",
        "bmi", "heart_rate", "physical_activity",
        "snoring_frequency", "daytime_sleepiness", "sleep_interruptions"
    ]
    X = df[FEATURES].values
    y = df["disorder"].values

    # 3. Train / test split
    print("\n[2/5] Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Scale features
    print("[3/5] Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # 5. Build ensemble
    print("[4/5] Training ensemble model...")
    rf = RandomForestClassifier(
        n_estimators=200, max_depth=12, min_samples_split=4,
        class_weight="balanced", random_state=42, n_jobs=-1
    )
    gb = GradientBoostingClassifier(
        n_estimators=150, learning_rate=0.1, max_depth=6,
        subsample=0.8, random_state=42
    )
    ensemble = VotingClassifier(
        estimators=[("rf", rf), ("gb", gb)],
        voting="soft", weights=[0.55, 0.45]
    )
    ensemble.fit(X_train_scaled, y_train)

    # 6. Evaluate
    print("[5/5] Evaluating model...")
    y_pred = ensemble.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    cv_scores = cross_val_score(ensemble, X_train_scaled, y_train, cv=5, scoring="accuracy")

    print(f"\n  Test Accuracy   : {acc:.4f} ({acc*100:.2f}%)")
    print(f"  CV Accuracy     : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print("\n  Classification Report:")
    print(classification_report(y_test, y_pred, target_names=DISORDERS))

    # 7. Save artifacts
    os.makedirs("model", exist_ok=True)
    joblib.dump(ensemble, "model/sleep_model.pkl")
    joblib.dump(scaler,   "model/scaler.pkl")

    model_meta = {
        "features":         FEATURES,
        "disorders":        DISORDERS,
        "test_accuracy":    round(float(acc), 4),
        "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
        "cv_accuracy_std":  round(float(cv_scores.std()), 4),
        "n_train_samples":  len(X_train),
        "n_test_samples":   len(X_test),
    }
    with open("model/model_meta.json", "w") as f:
        json.dump(model_meta, f, indent=2)

    print("\n  ✅ Saved: model/sleep_model.pkl")
    print("  ✅ Saved: model/scaler.pkl")
    print("  ✅ Saved: model/model_meta.json")
    print("\n" + "=" * 60)
    print("  Training complete! Run: uvicorn main:app --reload")
    print("=" * 60)


if __name__ == "__main__":
    train_and_save_model()
