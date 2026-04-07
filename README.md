<div align="center">

# 📦 DemandLens

### AI-Powered Enterprise Inventory Demand Prediction System

**Predict demand. Prevent stockouts. Optimize reorders — in real time.**

[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PM2](https://img.shields.io/badge/PM2-Advanced_Deploy-2B037A?style=for-the-badge&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)
[![Azure](https://img.shields.io/badge/Azure-Web_Apps-0089D6?style=for-the-badge&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

[Features](#-features--capabilities) · [AI Models](#-ai-forecasting-engine) · [Tech Stack](#-tech-stack) · [Deployment](#-system-architecture--deployment) · [Setup Guide](#-getting-started) · [API](#-api-reference)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Latest Updates](#-latest-updates-v20)
3. [Features & Capabilities](#-features--capabilities)
4. [AI Forecasting Engine](#-ai-forecasting-engine)
5. [Tech Stack](#-tech-stack)
6. [System Architecture & Deployment](#-system-architecture--deployment)
7. [Database Schema](#-database-schema)
8. [Getting Started](#-getting-started)
9. [API Reference](#-api-reference)

---

## 🎯 Project Overview

**DemandLens** is a full-stack, enterprise-grade inventory management and demand forecasting platform. By marrying a robust **Django REST API** backend with a dynamic, glassmorphic **React + Tailwind CSS** frontend, DemandLens provides supply chain executives with unparalleled real-time visibility into stock health, AI-driven predictive forecasting, and automated reorder execution.

### The Problem It Solves

| Enterprise Pain Point | The DemandLens Solution |
|---|---|
| Manual stockout tracking | Automated critical-stock thresholds and immediate alert generation. |
| Guesswork in supply chain | **Multi-model AI forecasting** (LSTM, Random Forest, ETS) looking 7 days ahead. |
| Clunky Excel updates | **Smart Data Management Module** with unified drag-and-drop CSV importing. |
| Dead capital / Overstock | Pareto (ABC) Analysis, Real-time Inventory Turnover Rates, and Risk Scatter Plots. |

---

## 📢 Latest Updates (v2.0)

We have recently evolved the platform with enterprise SaaS capabilities and deeper analytics:

*   **Premium SaaS Interface:** A brand-new, high-conversion landing page and streamlined user registration/login flow providing a premium enterprise feel.
*   **Intelligent Data Management:** A dedicated module for bulk CSV inventory uploads. Features "Smart Add" reasoning that updates existing stock quantities rather than overwriting data, and auto-generates entities for unmapped categories.
*   **Advanced Forecasting UI:** The AI engine now displays **Data Anomaly Detection Markers** (identifying extreme outliers in consumption), custom clickable chart legends to isolate model projections, and one-click data unloads via direct CSV Export.
*   **Refined Analytics Dashboard:** Streamlined real-time KPIs showing live **Inventory Turnover Rates** and optimized Capital Distribution stats.
*   **Robust Production Deployment:** Integrated PM2 process management for zero-downtime background execution and implemented CI/CD pipelines enabling seamless Azure Web Apps deployments directly from GitHub Actions.

---

## ✨ Features & Capabilities

### 📊 Executive Dashboard
- **Macro Demand Trend:** Live area chart mapping historical consumption against a 7-day predicted LSTM overlay.
- **Risk Matrix:** A 4-quadrant interactive scatter plot tracking *Current Stock* versus *Predicted Demand*, allowing instant identification of "Urgent Reorder" and "Dead Capital" zones.
- **Inventory Turnover & ABC Analysis:** Live tracking of asset liquidity, Pareto ranking (Top 10 Capital Tied Up), and department consumption breakdowns via dynamic Recharts.
- **SaaS Aesthetics & Micro-interactions:** High-end page transitions (framer-motion) and real-time dashboard state management.

### 🗄️ Smart Data Management
- **Bulk CSV Ingestion:** Premium drag-and-drop zone for rapid Excel/CSV inventory mapping.
- **Intelligent "Smart Add":** Automatically detects existing items and securely *adds* quantity to existing stock.
- **Automated Entity Generation:** Instantly handles and structures unknown suppliers and categories on the fly.
- **Client-Side Templating:** Instant "Download Template" generator for faultless formatting.

### 🚨 Reorder Intelligence Base
- Generates exact reorder quantity parameters = *(forecasted demand + buffer) − projected stock*.
- Three hierarchical alert levels: `REORDER NOW`, `WATCH`, `SAFE`.
- Configurable lead-time models and dynamic safety buffers via secure environment variables.

### 👤 Identity & Security
- Fully functioning enterprise authentication base and profile management.
- Rapid Demo Login architecture via `X-Demo-Token` injection for immediate SaaS demonstration.

---

## 🧠 AI Forecasting Engine

DemandLens natively incorporates three distinct forecasting algorithms within Python, evaluating and selecting the most accurate prediction baseline tailored to individual SKU velocity:

1. **LSTM (Long Short-Term Memory) Neural Networks:** Captures deep, non-linear macroscopic trends across the entire supply chain footprint.
2. **Exponential Smoothing (ETS):** Baseline standard (via `statsmodels`) utilized for highly seasonal or predictable items with ≥7 days of history.
3. **Random Forest Ensembles:** Employed to mitigate sudden spikes and manage erratic consumption behavior through decision-tree averaging.

**Enterprise AI Features:**
*   **Anomaly Detection:** Built-in heuristics label highly abnormal historical spikes with visible UI markers to contextualize data distortions.
*   **Accuracy Transparency:** The engine automatically calculates MAPE, RMSE, and R² scores for each model, exposing forecast validity directly to the user.
*   **Actionable Data Export:** One-click module to dump explicit multi-model coordinate data directly to CSV.

---

## 🛠 Tech Stack

### Frontend Application
| Technology | Description |
|---|---|
| **React 19 & Vite 8** | High-performance core SPA component framework and build tool |
| **Tailwind CSS 4** | Utility-first styling with custom glassmorphic and enterprise configurations |
| **Framer Motion** | Physics-based UI animations, page transitions, and interactive loading states |
| **Recharts** | Interactive SVG-rendered charting library mapped to live API streams |

### API & Analysis Engine
| Technology | Description |
|---|---|
| **Django 6.0 & DRF** | Web framework and robust REST API layer mapping a normalized PostgreSQL ORM |
| **Pandas / Statsmodels** | Core data manipulation, automated outlier detection, and ETS statistical modeling |
| **NumPy & Scikit-Learn** | High performance tensor mathematics, regression algorithms, and Random Forest models |
| **TensorFlow/Keras** | Powering the LSTM deep-learning neural network architectures |

---

## 🏗 System Architecture & Deployment

DemandLens utilizes a robust production deployment architecture designed for High Availability. 

### CI/CD Pipeline (`deploy.yml`)
The platform supports an automated **GitHub Actions** CI/CD pipeline triggered upon merges to the `main` branch. 

**Deployment Targets:**
1. **Azure Web Apps (PaaS):** Oryx-based build configurations mapping `requirements.txt` optimizations with isolated Python 3.11 runtimes on Azure App Services.
2. **Virtual Machines / Self-hosted:** 
    - Executes isolated `git pull`, automated environment creation, and Python DB migration commands.
    - Utilizes **PM2** via an explicit `ecosystem.config.js` to ensure zero-downtime backend restarts, automatic crash-restarts, and persistent process execution without manual ssh-hangups.

---

## 🗄 Database Schema

The DemandLens database is normalized for high-velocity supply chain reads and analytics.

**Core Entities:**
*   `Supplier` / `InventoryItem` / `InventoryStock`: Foundation structural map grouping categories with real-time on-hand quantites.
*   `DailyConsumption`: Highly indexed historical transaction logs (Quantity Used, Date, Department).
*   `ForecastResult` & `ReorderRecommendation`: Evaluated alert states and exact mathematically suggested order scales, explicit to the AI model used.
*   `DataQualityIssue`: System-generated flags highlighting missing relations, negative inventory alerts, or bad math ingestion.

---

## 🚀 Getting Started

### Prerequisites
*   **Python** 3.11+
*   **Node.js** 20.x+
*   **PostgreSQL** 15+

### 1. Database Provisioning
```sql
psql -U postgres
CREATE DATABASE demandlens_db;
CREATE USER demandlens_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE demandlens_db TO demandlens_user;
\q
```

### 2. Backend Initialization
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Configure your environment variables (.env)
python manage.py migrate
python seed_data_enhanced.py # Seed database with historical data 
python manage.py createsuperuser

python manage.py runserver
```

*(Create a `.env` in `/backend` containing `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DJANGO_SECRET_KEY`, `DEFAULT_LEAD_TIME_DAYS`, and `SAFETY_BUFFER`).*

### 3. Frontend Initialization
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Navigate to **http://localhost:5173**.

---

## 📡 API Reference

Base URL: `http://localhost:8000/api`

### Core Endpoints
| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/auth/login/` | Standard user authentication or demo login entry |
| **Data Ingestion** | `POST` | `/data/upload-csv/` | Handles bulk multipart CSV uploads with "Smart Add" stock resolution |
| **Analytics** | `GET` | `/analytics/macro-trend/` | 14-day historical ingestion vs 7-day system projection |
| **Analytics** | `GET` | `/analytics/turnover-rate/` | Velocity calculations and COGS turnover equations |
| **Items & AI** | `POST` | `/forecast/run/` | Triggers the complete AI Multi-Model generation sequence |
| **Items & AI** | `GET` | `/items/:id/forecast/` | Isolated robust forecast mapping including anomaly points |

---
<div align="center">
  <sub>DemandLens • Intelligent Supply Chain Software Suite</sub>
</div>
