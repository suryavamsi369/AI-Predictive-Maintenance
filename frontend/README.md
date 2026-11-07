# AI-Powered Predictive Maintenance — Industrial UI / UX

A human-designed, enterprise-grade industrial monitoring and predictive maintenance SaaS dashboard built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**.

Designed specifically to avoid AI-generated aesthetic tropes (no excessive neon glows, no random floating circles, no emoji-based icons, no oversized headings, no repetitive card layouts). Instead, it adopts a high-precision, technical industrial aesthetic inspired by modern SCADA, IoT telemetry, and industrial asset management platforms.

---

## 🎨 Visual Design System & Aesthetics

### 1. Precision Neutral Palette
- **Deep Slate/Graphite Canvas:** `#0a0e17`
- **Surface & Panel Backgrounds:** `#101622` and `#131b2a`
- **Hairline Dividers & Borders:** `#1f2b3e` (1px clean technical borders)
- **Authoritative Technical Blue:** `#2563eb` (primary interactive accents)

### 2. Semantic Health Indicators (Strictly Reserved for Asset Status)
- **Normal / Healthy:** Emerald (`#10b981`)
- **Warning / Moderate Stress:** Amber (`#f59e0b`)
- **Critical / Immediate Action:** Crimson (`#ef4444`)

### 3. Typography
- **UI & Controls:** Inter (`sans-serif`)
- **Telemetry Readouts, Units & Timestamps:** JetBrains Mono (`monospace`), tabular figures for alignment.

---

## 🚀 Running the Frontend

### Prerequisites
- Node.js 18+ (tested with v22.20)
- Backend running at `http://127.0.0.1:8000`

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start the Vite Development Server
```bash
npm run dev
```
The development workstation will open at `http://localhost:5173`, with API requests (`/predict`, `/machines`, `/predictions`, `/model-info`, `/health`) automatically proxied to FastAPI at `http://127.0.0.1:8000`.

### Step 3: Production Build
```bash
npm run build
```
Generates optimized static assets into `frontend/dist/`. FastAPI automatically serves this production build at `http://127.0.0.1:8000/dashboard`.

---

## 🖥️ Dashboard Views & Functionality

1. **Operations / Fleet Telemetry Overview (`/overview`):**
   - Compact KPI ribbon: Monitored Machines, Critical Alerts, Warnings, Healthy Count, Total Inferences, Model Benchmark (99.5%).
   - Fleet Health Matrix with real-time status pills (`HEALTHY`, `WARNING`, `CRITICAL`), failure risk progress meters, and quick actions.
   - High-Priority Failure Alerts list with direct machine drilldown.
   - ISO 10816 vibration standard references.

2. **Live Diagnostics & ML Ingestion Workstation (`/diagnostics`):**
   - Real-time sensor parameter controls with both precision range sliders and direct numeric inputs:
     - Temperature (°C)
     - Vibration Velocity (mm/s)
     - Hydraulic/Air Pressure (psi)
     - Rotational Speed (RPM)
     - Cumulative Operating Hours (hrs)
   - 4 Instant Industrial Presets:
     - `Machine_04 (Critical Alert)`
     - `Machine_01 (Nominal Baseline)`
     - `Bearing Defect Simulation`
     - `Thermal Overheat Condition`
   - Real-time POST `/predict` execution.
   - Diagnostic Report Panel: Condition status, failure-risk percentage gauge, physical degradation breakdown, and maintenance recommendations.
   - Automatic PostgreSQL persistence receipt.

3. **Machine Fleet Management (`/fleet`):**
   - Searchable and filterable registry table.
   - Inspect individual asset specifications, cumulative runtime, and latest assessment.
   - Register new assets with modal validation (`POST /machines`).

4. **Telemetry & Prediction Audit Trail (`/history`):**
   - Chronological table of all ingested sensor logs and model inferences.
   - Filter by Machine ID and condition severity.
   - **Export to CSV:** Direct client-side generation and download of complete audit logs.

5. **ML Engine & Model Governance (`/model`):**
   - Live metrics from Random Forest model artifact: Accuracy (99.47%), Precision (99.59%), Recall (98.78%), F1 (99.18%), ROC-AUC (0.9962).
   - Gini Feature Importance bars: Vibration (51.1%), Temperature (28.4%), Pressure (12.8%), Hours (6.3%), RPM (1.3%).
   - End-to-end data pipeline diagram and artifact configuration.

