"""Machine Learning Model Training Pipeline for Predictive Maintenance.

This script:
1. Generates a realistic industrial machine sensor telemetry dataset based on
   established physical degradation patterns and ISO vibration/thermal failure standards.
2. Trains a Random Forest Classifier to detect whether a machine requires maintenance.
3. Evaluates model performance using Accuracy, Precision, Recall, F1 Score, and ROC-AUC.
4. Serializes the trained model bundle (model + metadata + feature names) to a .joblib file.
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_MODEL_DIR = BASE_DIR / "app" / "ml" / "models"
DEFAULT_MODEL_PATH = DEFAULT_MODEL_DIR / "predictive_maintenance_rf.joblib"

FEATURE_NAMES = ["temperature", "vibration", "pressure", "rpm", "operating_hours"]
TARGET_NAMES = ["Normal Operation", "Maintenance Required"]


def generate_synthetic_industrial_data(n_samples: int = 7500, random_seed: int = 42):
    """Generate realistic industrial telemetry dataset with physical failure mechanics.

    Modeled Failure Modes:
    1. Bearing / Mechanical Failure: High vibration (> 6.2 mm/s, ISO 10816 Zone C/D).
    2. Overheating / Thermal Failure: Temperature > 82.0 °C.
    3. Pressure System Overstrain: Hydraulic/air pressure > 125.0 psi.
    4. Combined Aging & Wear: High operating hours (> 7000 hrs) with elevated vibration/heat.
    5. High-speed Tool Strain: High RPM (> 3300) combined with high vibration.
    """
    rng = np.random.RandomState(random_seed)

    # Base operating distributions
    temperature = rng.normal(loc=60.0, scale=10.0, size=n_samples)
    vibration = rng.exponential(scale=2.0, size=n_samples) + 0.5
    pressure = rng.normal(loc=100.0, scale=12.0, size=n_samples)
    rpm = rng.normal(loc=2900.0, scale=150.0, size=n_samples)
    operating_hours = rng.uniform(low=200.0, high=14000.0, size=n_samples)

    # Some machines run hot or with vibration due to machine aging / load spikes
    stressed_mask = rng.rand(n_samples) < 0.22
    temperature[stressed_mask] += rng.uniform(15.0, 35.0, size=np.sum(stressed_mask))
    vibration[stressed_mask] += rng.uniform(3.0, 7.0, size=np.sum(stressed_mask))
    pressure[stressed_mask] += rng.uniform(10.0, 30.0, size=np.sum(stressed_mask))

    # Add realistic sensor measurement noise
    temperature += rng.normal(0, 1.0, size=n_samples)
    vibration += rng.normal(0, 0.2, size=n_samples)
    pressure += rng.normal(0, 1.5, size=n_samples)

    # Clip values to physically valid operational ranges
    temperature = np.clip(temperature, 20.0, 140.0)
    vibration = np.clip(vibration, 0.1, 25.0)
    pressure = np.clip(pressure, 40.0, 200.0)
    rpm = np.clip(rpm, 1200.0, 4500.0)
    operating_hours = np.clip(operating_hours, 0.0, 30000.0)

    # Deterministic physical failure boundary rules + slight boundary noise
    c1_bearing_failure = vibration > 6.4
    c2_thermal_failure = temperature > 83.0
    c3_pressure_failure = pressure > 126.0
    c4_aging_wear = (operating_hours > 7500.0) & ((vibration > 4.5) | (temperature > 74.0))
    c5_tool_wear = (rpm > 3200.0) & (vibration > 4.2)

    failure_condition = (
        c1_bearing_failure
        | c2_thermal_failure
        | c3_pressure_failure
        | c4_aging_wear
        | c5_tool_wear
    )

    # Target label: 1 = Maintenance Required, 0 = Normal Operation
    y = failure_condition.astype(int)

    # Introduce minor industrial labeling noise (0.5% sensor false alarm/omission)
    label_flip = rng.rand(n_samples) < 0.005
    y[label_flip] = 1 - y[label_flip]

    X = np.column_stack([temperature, vibration, pressure, rpm, operating_hours])
    return X, y


def train_and_evaluate_model(
    model_output_path: Path = DEFAULT_MODEL_PATH,
    n_samples: int = 7500,
    random_state: int = 42,
):
    """Train Random Forest model, evaluate metrics, and serialize model artifact."""
    print("=" * 60)
    print("AI Predictive Maintenance - ML Model Training Pipeline")
    print("=" * 60)

    # 1. Generate dataset
    print(f"\n[1/4] Generating {n_samples} industrial sensor telemetry records...")
    X, y = generate_synthetic_industrial_data(n_samples=n_samples, random_seed=random_state)

    failure_count = int(np.sum(y))
    normal_count = int(len(y) - failure_count)
    print(f"      Dataset distribution: {normal_count} Normal ({normal_count/len(y):.1%}), "
          f"{failure_count} Maintenance Required ({failure_count/len(y):.1%})")

    # 2. Train / Test Split (Stratified 80/20)
    print("\n[2/4] Splitting into 80% train and 20% test sets (stratified)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )
    print(f"      Train samples: {X_train.shape[0]} | Test samples: {X_test.shape[0]}")

    # 3. Train Random Forest Classifier
    print("\n[3/4] Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # 4. Evaluate on Test Set
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)

    print("\n[4/4] Model Evaluation Results:")
    print("-" * 40)
    print(f"      Accuracy:  {acc:.4f} ({acc * 100:.2f}%)")
    print(f"      Precision: {prec:.4f}")
    print(f"      Recall:    {rec:.4f}")
    print(f"      F1 Score:  {f1:.4f}")
    print(f"      ROC-AUC:   {roc_auc:.4f}")
    print("-" * 40)
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=TARGET_NAMES))

    # Feature Importances
    importances = model.feature_importances_
    print("Feature Importances:")
    for name, imp in sorted(zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True):
        print(f"  - {name:<16}: {imp:.4f} ({imp*100:.1f}%)")

    # 5. Save model package
    model_output_path = Path(model_output_path)
    model_output_path.parent.mkdir(parents=True, exist_ok=True)

    model_bundle = {
        "model": model,
        "feature_names": FEATURE_NAMES,
        "target_names": TARGET_NAMES,
        "metrics": {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(roc_auc),
        },
        "model_version": "1.0.0",
        "algorithm": "RandomForestClassifier",
        "n_samples": n_samples,
        "trained_at": datetime.now(timezone.utc).isoformat(),
    }

    joblib.dump(model_bundle, model_output_path)
    print(f"\n[OK] Model bundle saved successfully to:")
    print(f"     {model_output_path}")
    print("=" * 60)

    return model_bundle


if __name__ == "__main__":
    out_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_MODEL_PATH
    train_and_evaluate_model(model_output_path=out_path)
