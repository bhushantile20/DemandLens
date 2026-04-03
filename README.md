<div align="center">

# 📦 DemandLens

### AI-Powered Inventory Demand Prediction System

**Predict demand. Prevent stockouts. Optimize reorders — in real time.**

[![Django](https://img.shields.io/badge/Django-6.0.3-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

[Live Demo](#demo-login) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Setup Guide](#-getting-started) · [API Reference](#-api-reference) · [Database Schema](#-database-schema) · [Architecture](#-system-architecture)

</div>

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Sequence Diagrams](#-sequence-diagrams)
6. [Database Schema](#-database-schema)
7. [Project Structure](#-project-structure)
8. [Getting Started](#-getting-started)
9. [Environment Variables](#-environment-variables)
10. [API Reference](#-api-reference)
11. [Demo Login](#-demo-login)
12. [Contributing](#-contributing)
13. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

**DemandLens** is a full-stack, production-ready inventory management and demand forecasting dashboard. It combines a **Django REST API** backend with a **React + Tailwind CSS** frontend to give supply chain teams real-time visibility into stock levels, predictive demand forecasts, and automated reorder recommendations.

### The Problem It Solves

| Pain Point | DemandLens Solution |
|---|---|
| Manual stockout detection | Automated low-stock alerts with configurable thresholds |
| Reactive reordering | 7-day ahead demand forecasting using Exponential Smoothing |
| Data quality blind spots | Auto-detection of missing items, invalid quantities, duplicates |
| Spreadsheet-based tracking | Interactive dashboard with live Recharts visualizations |

---

## ✨ Features

### 📊 Dashboard
- Real-time KPI cards: Total Items, Low Stock Count, Critical Alerts, Data Issues
- Interactive **Bar Chart** — Current Stock vs. Reorder Level per item
- Per-item **Line Chart** — 7-day predicted demand (click any row to view)
- One-click **Run Global Forecast** button to recompute all predictions

### 🔮 AI Forecasting
- **Exponential Smoothing** (Holt-Winters via `statsmodels`) for items with ≥7 days of history
- Automatic **fallback to rolling average** if insufficient data or model fails
- Forecasts stored per item+date+model for full audit trail

### 🚨 Reorder Alerts
- Computes projected stock after lead-time demand
- Three alert levels: `reorder_now`, `watch`, `safe`
- Configurable lead-time and safety buffer via environment variables
- Suggests exact reorder quantity = forecasted demand + buffer − projected stock

### 📦 Inventory Management
- Full item catalogue with supplier info, category, unit, and cost
- Real-time stock levels with reorder level thresholds
- Risk status badge per item (Optimal / Watch / Reorder Needed)

### 🛡️ Data Quality Monitor
- Surfaces anomalies from raw consumption data ingestion:
  - `missing_item` — item ID not matched in catalogue
  - `invalid_quantity` — zero or negative usage values
  - `invalid_date` — out-of-range date records
  - `duplicate_record` — repeated consumption entries

### 👤 User Profile System
- Navbar avatar with profile dropdown (Settings / Logout)
- `/settings` page with update forms for Name, Email, and Password
- Password strength meter + confirm-match validation
- All changes persisted via API to PostgreSQL (hashed passwords via PBKDF2)

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.x | UI component framework |
| **Vite** | 8.x | Build tool & dev server (HMR) |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **React Router DOM** | 7.x | Client-side routing |
| **Recharts** | 3.x | Bar, Line & Pie chart visualizations |
| **Axios** | 1.x | HTTP client with request interceptors |
| **Lucide React** | 1.x | Icon library |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Django** | 6.0.3 | Web framework & ORM |
| **Django REST Framework** | 3.x | REST API layer |
| **django-cors-headers** | 4.x | CORS policy management |
| **statsmodels** | 0.14+ | Exponential Smoothing forecasting |
| **pandas** | 2.x | Data manipulation (optional, used in forecasting) |
| **psycopg2** | 2.x | PostgreSQL database adapter |
| **python-dotenv** | 1.x | `.env` file environment loader |

### Database

| Technology | Purpose |
|---|---|
| **PostgreSQL 15+** | Primary relational database |
| **Django Migrations** | Schema version control |

### Dev Tools

| Tool | Purpose |
|---|---|
| **Git** | Version control |
| **ESLint** | JavaScript linting |
| **python-venv** | Python environment isolation |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             React 19 + Vite SPA                           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │   │
│  │  │ Dashboard│ │ Inventory│ │  Alerts  │ │ Settings  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘   │   │
│  │        │             │           │              │          │   │
│  │        └─────────────┴───────────┴──────────────┘          │   │
│  │                         Axios (HTTP)                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                    X-Demo-Token Header                            │
└──────────────────────────────┼────────────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Django 6 + Django REST Framework                 │
│                                                                   │
│  ┌──────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │ api/     │  │ inventory/  │  │ forecasting/ │  │ alerts/ │  │
│  │ views.py │  │ models.py   │  │ services.py  │  │services │  │
│  └──────────┘  └─────────────┘  └──────────────┘  └─────────┘  │
│                                                                   │
│  ┌──────────┐  ┌─────────────┐                                   │
│  │consumption│  │ config/    │                                   │
│  │ models   │  │ settings    │                                   │
│  └──────────┘  └─────────────┘                                   │
└──────────────────────────────┬────────────────────────────────────┘
                               │ Django ORM (psycopg2)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL 15                             │
│                                                                   │
│  inventory_supplier  inventory_inventoryitem  inventory_stock     │
│  consumption_daily   forecasting_result       alerts_reorder      │
│  consumption_quality auth_user                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Layer | Component | Responsibility |
|---|---|---|
| **Frontend** | `UserContext` | Global auth state, localStorage persistence |
| **Frontend** | `AppShell` | Shared layout (Sidebar + Navbar) for authenticated pages |
| **Frontend** | `services/api.js` | Centralized Axios instance with auth interceptor |
| **Backend** | `api/views.py` | REST endpoint handlers, business logic orchestration |
| **Backend** | `forecasting/services.py` | Exponential Smoothing + fallback average engine |
| **Backend** | `alerts/services.py` | Reorder recommendation generation with lead-time logic |
| **Database** | PostgreSQL | Persistent storage for all entities |

---

## 🔄 Sequence Diagrams

### 1. Demo Login Flow

```
User          Login Page       UserContext      React Router
 │                │                │                │
 │ Click Demo     │                │                │
 │────────────────>                │                │
 │         Typewriter animation    │                │
 │         fills email+password    │                │
 │                │                │                │
 │                │ setUser()       │                │
 │                │────────────────>                │
 │                │                │ localStorage    │
 │                │                │ .setItem()      │
 │                │                │                │
 │                │ navigate("/dashboard")           │
 │                │────────────────────────────────>│
 │                │                │        Render   │
 │                │                │        AppShell │
 │<───────────────────────────────────────────────── │
```

### 2. Forecast + Reorder Alert Generation

```
User       Dashboard         Django API         ForecastService    AlertService    PostgreSQL
 │              │                 │                    │                │               │
 │ Run Forecast │                 │                    │                │               │
 │─────────────>│                 │                    │                │               │
 │              │ POST /forecast/run/                  │                │               │
 │              │────────────────>│                    │                │               │
 │              │                 │ run_forecast()     │                │               │
 │              │                 │───────────────────>│                │               │
 │              │                 │                    │ Query valid     │               │
 │              │                 │                    │ DailyConsumption│               │
 │              │                 │                    │────────────────────────────────>│
 │              │                 │                    │<────────────────────────────────│
 │              │                 │                    │ Exponential    │               │
 │              │                 │                    │ Smoothing ETS  │               │
 │              │                 │                    │ → ForecastResult               │
 │              │                 │                    │────────────────────────────────>│
 │              │                 │ generate_reorder_recommendations()  │               │
 │              │                 │────────────────────────────────────>│               │
 │              │                 │                    │                │ Query stocks  │
 │              │                 │                    │                │──────────────>│
 │              │                 │                    │                │<──────────────│
 │              │                 │                    │                │ Compute levels│
 │              │                 │                    │                │ ReorderRec.   │
 │              │                 │                    │                │──────────────>│
 │              │                 │ { rows_created }   │                │               │
 │              │<────────────────│                    │                │               │
 │              │ fetchData() refresh                  │                │               │
 │<─────────────│                 │                    │                │               │
```

### 3. Settings — Update User Name

```
User       Settings Page       api.js (Axios)      Django View       PostgreSQL
 │               │                   │                   │                │
 │ Type new name │                   │                   │                │
 │──────────────>│                   │                   │                │
 │ Click Save    │                   │                   │                │
 │──────────────>│                   │                   │                │
 │               │ updateName(name)  │                   │                │
 │               │──────────────────>│                   │                │
 │               │                   │ PUT /api/user/    │                │
 │               │                   │ update-name/      │                │
 │               │                   │ X-Demo-Token: ••• │                │
 │               │                   │──────────────────>│                │
 │               │                   │                   │ get_demo_user()│
 │               │                   │                   │ validate token │
 │               │                   │                   │ user.save()    │
 │               │                   │                   │───────────────>│
 │               │                   │                   │<───────────────│
 │               │                   │ { success: true } │                │
 │               │<──────────────────│                   │                │
 │               │ updateUser()      │                   │                │
 │               │ → UserContext     │                   │                │
 │               │ → localStorage    │                   │                │
 │ Toast: ✅ Name updated!           │                   │                │
 │<──────────────│                   │                   │                │
```

### 4. Navbar Dropdown Interaction

```
User          Navbar           React State       React Router
 │               │                 │                 │
 │ Click avatar  │                 │                 │
 │──────────────>│                 │                 │
 │               │ setOpen(true)   │                 │
 │               │────────────────>│                 │
 │               │ Dropdown appears│                 │
 │<──────────────│                 │                 │
 │               │                 │                 │
 │ Click outside │                 │                 │
 │──────────────>│                 │                 │
 │               │ useEffect       │                 │
 │               │ mousedown listener                │
 │               │ setOpen(false)  │                 │
 │               │────────────────>│                 │
 │               │ Dropdown closes │                 │
 │<──────────────│                 │                 │
 │               │                 │                 │
 │ Click Logout  │                 │                 │
 │──────────────>│                 │                 │
 │               │ logout()        │                 │
 │               │ clear localStorage                │
 │               │ navigate("/")   │                 │
 │               │────────────────────────────────── >│
```

---

## 🗄 Database Schema

### Entity Relationship Overview

```
┌─────────────────┐         ┌──────────────────────┐
│    Supplier      │         │    InventoryItem      │
├─────────────────┤         ├──────────────────────┤
│ PK  id           │         │ PK  id                │
│     supplier_id  │◄──┐    │     item_id           │
│     supplier_name│   │    │     item_name         │
│     contact      │   │    │     category          │
│     location     │   └────│ FK  supplier_id       │
└─────────────────┘         │     unit              │
                            │     cost_per_unit     │
                            └──────────┬────────────┘
                                       │
              ┌────────────────────────┼─────────────────────────┐
              │                        │                          │
              ▼                        ▼                          ▼
┌─────────────────────┐  ┌────────────────────────┐  ┌──────────────────────┐
│   InventoryStock    │  │   DailyConsumption     │  │   ForecastResult     │
├─────────────────────┤  ├────────────────────────┤  ├──────────────────────┤
│ PK  id              │  │ PK  id                 │  │ PK  id               │
│     stock_id        │  │     consumption_id     │  │ FK  item_id          │
│ FK  item_id (1:1)   │  │ FK  item_id            │  │     forecast_date    │
│     quantity_available  │     raw_item_id        │  │     predicted_demand │
│     reorder_level   │  │     quantity_used      │  │     model_name       │
│     last_updated    │  │     date               │  │     generated_at     │
└─────────────────────┘  │     department         │  └──────────────────────┘
                         │     is_valid           │
                         └────────────────────────┘
                                       │
                                       ▼ (anomaly detection)
                         ┌────────────────────────┐
                         │   DataQualityIssue     │
                         ├────────────────────────┤
                         │ PK  id                 │
                         │     raw_item_id        │
                         │     issue_type         │
                         │     description        │
                         │     source_table       │
                         │     resolved           │
                         │     created_at         │
                         └────────────────────────┘

┌──────────────────────────────────────┐
│       ReorderRecommendation          │
├──────────────────────────────────────┤
│ PK  id                               │
│ FK  item_id (→ InventoryItem)        │
│     current_stock                    │
│     reorder_level                    │
│     predicted_demand_7d              │
│     days_of_stock_left               │
│     suggested_reorder_qty            │
│     status  [pending|reviewed|...]   │
│     explanation                      │
│     generated_at                     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│          auth_user  (Django built-in)│
├──────────────────────────────────────┤
│ PK  id                               │
│     username                         │
│     first_name                       │
│     last_name                        │
│     email                            │
│     password  (PBKDF2 hash)          │
│     is_superuser                     │
└──────────────────────────────────────┘
```

### Table Details

#### `inventory_supplier`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `supplier_id` | `VARCHAR(50)` | UNIQUE, NOT NULL |
| `supplier_name` | `VARCHAR(255)` | NOT NULL |
| `contact` | `VARCHAR(255)` | NULLABLE |
| `location` | `VARCHAR(255)` | NULLABLE |

#### `inventory_inventoryitem`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `item_id` | `VARCHAR(50)` | UNIQUE, NOT NULL |
| `item_name` | `VARCHAR(255)` | NOT NULL |
| `category` | `VARCHAR(100)` | NOT NULL |
| `unit` | `VARCHAR(50)` | NOT NULL |
| `supplier_id` | `INTEGER` | FK → `inventory_supplier` |
| `cost_per_unit` | `DECIMAL(12,2)` | NOT NULL |

#### `inventory_inventorystock`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `stock_id` | `VARCHAR(50)` | UNIQUE |
| `item_id` | `INTEGER` | FK → `InventoryItem` (OneToOne) |
| `quantity_available` | `DECIMAL(12,2)` | NOT NULL |
| `reorder_level` | `DECIMAL(12,2)` | NOT NULL |
| `last_updated` | `TIMESTAMP` | `auto_now=True` |

#### `consumption_dailyconsumption`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `consumption_id` | `VARCHAR(50)` | UNIQUE |
| `item_id` | `INTEGER` | FK → `InventoryItem`, NULLABLE |
| `raw_item_id` | `VARCHAR(100)` | NOT NULL, indexed |
| `quantity_used` | `DECIMAL(12,2)` | NOT NULL |
| `date` | `DATE` | NOT NULL, indexed |
| `department` | `VARCHAR(100)` | NOT NULL |
| `is_valid` | `BOOLEAN` | DEFAULT TRUE |

#### `forecasting_forecastresult`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `item_id` | `INTEGER` | FK → `InventoryItem` |
| `forecast_date` | `DATE` | NOT NULL |
| `predicted_demand` | `DECIMAL(12,2)` | NOT NULL |
| `model_name` | `VARCHAR(100)` | NOT NULL |
| `generated_at` | `TIMESTAMP` | `auto_now_add=True` |
| — | — | UNIQUE(`item_id`, `forecast_date`, `model_name`) |

#### `alerts_reorderrecommendation`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `item_id` | `INTEGER` | FK → `InventoryItem` |
| `current_stock` | `DECIMAL(12,2)` | NOT NULL |
| `reorder_level` | `DECIMAL(12,2)` | NOT NULL |
| `predicted_demand_7d` | `DECIMAL(12,2)` | NOT NULL |
| `days_of_stock_left` | `DECIMAL(10,2)` | NOT NULL |
| `suggested_reorder_qty` | `DECIMAL(12,2)` | NOT NULL |
| `status` | `VARCHAR(20)` | `pending\|reviewed\|approved\|dismissed` |
| `explanation` | `TEXT` | Contains alert level & parameters |
| `generated_at` | `TIMESTAMP` | `auto_now_add=True` |

#### `consumption_dataqualityissue`
| Column | Type | Constraints |
|---|---|---|
| `id` | `SERIAL` | PK |
| `raw_item_id` | `VARCHAR(100)` | NOT NULL, indexed |
| `issue_type` | `VARCHAR(50)` | `missing_item\|invalid_quantity\|invalid_date\|duplicate_record\|other` |
| `description` | `TEXT` | NOT NULL |
| `source_table` | `VARCHAR(100)` | NOT NULL |
| `resolved` | `BOOLEAN` | DEFAULT FALSE, indexed |
| `created_at` | `TIMESTAMP` | `auto_now_add=True` |

---

## 📁 Project Structure

```
DemandLens/
├── backend/                        # Django backend
│   ├── config/                     # Django project config
│   │   ├── settings.py             # App settings, DB, CORS config
│   │   ├── urls.py                 # Root URL dispatcher
│   │   ├── wsgi.py                 # WSGI entry point
│   │   └── asgi.py                 # ASGI entry point
│   │
│   ├── api/                        # Main REST API app
│   │   ├── views.py                # All API view functions
│   │   ├── urls.py                 # API URL routing
│   │   └── serializers.py          # DRF serializers
│   │
│   ├── inventory/                  # Inventory domain
│   │   ├── models.py               # Supplier, InventoryItem, InventoryStock
│   │   └── migrations/
│   │
│   ├── consumption/                # Consumption domain
│   │   ├── models.py               # DailyConsumption, DataQualityIssue
│   │   └── migrations/
│   │
│   ├── forecasting/                # Forecasting domain
│   │   ├── models.py               # ForecastResult
│   │   ├── services.py             # Exponential Smoothing engine
│   │   └── migrations/
│   │
│   ├── alerts/                     # Alerts domain
│   │   ├── models.py               # ReorderRecommendation
│   │   ├── services.py             # Reorder calculation engine
│   │   └── migrations/
│   │
│   ├── seed_data.py                # Database seeding script
│   ├── manage.py                   # Django CLI entry point
│   └── .env                        # Environment variables (not committed)
│
└── frontend/                       # React frontend
    ├── src/
    │   ├── components/             # Shared components
    │   │   ├── Navbar.jsx          # Top nav with profile dropdown
    │   │   ├── Sidebar.jsx         # Left navigation sidebar
    │   │   ├── StatCard.jsx        # KPI card widget
    │   │   └── AlertCard.jsx       # Alert item card
    │   │
    │   ├── context/
    │   │   └── UserContext.jsx     # Global user state (auth context)
    │   │
    │   ├── pages/
    │   │   ├── Home.jsx            # Landing / marketing page
    │   │   ├── Login.jsx           # Auth page with Demo Login
    │   │   ├── Dashboard.jsx       # Main analytics dashboard
    │   │   ├── ItemsList.jsx       # Full inventory table
    │   │   ├── ItemDetail.jsx      # Single item detail + forecast
    │   │   ├── Alerts.jsx          # Reorder alerts list
    │   │   ├── DataQuality.jsx     # Data quality issues view
    │   │   └── Settings.jsx        # User profile settings
    │   │
    │   ├── services/
    │   │   └── api.js              # Axios instance + all API calls
    │   │
    │   ├── App.jsx                 # Router + AppShell layout
    │   ├── main.jsx                # React entry point
    │   └── index.css               # Global styles (Tailwind + Google Fonts)
    │
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Python** 3.11+
- **Node.js** 18+ & **npm** 9+
- **PostgreSQL** 15+
- **Git**

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/DemandLens.git
cd DemandLens
```

---

### Step 2 — PostgreSQL Database Setup

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database and user
CREATE DATABASE demanslens_db;
CREATE USER demandlens_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE demandslens_db TO demandlens_user;
\q
```

---

### Step 3 — Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers python-dotenv psycopg2-binary statsmodels pandas

# Create .env file (see Environment Variables section below)
# Then run migrations
python manage.py migrate

# Create a superuser (used as the demo user)
python manage.py createsuperuser
# → Username: bhushan
# → Email: bhushan@inventoryai.com
# → Password: (choose a strong password)

# Seed the database with sample data
python manage.py shell < seed_data.py

# Start the development server
python manage.py runserver
# → Running at http://localhost:8000
```

---

### Step 4 — Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
# → Running at http://localhost:5173
```

---

### Step 5 — Open in Browser

Navigate to **http://localhost:5173**

| URL | Page |
|---|---|
| `http://localhost:5173/` | Landing page |
| `http://localhost:5173/login` | Login page (use Demo Login) |
| `http://localhost:5173/dashboard` | Main dashboard |
| `http://localhost:5173/items` | Inventory list |
| `http://localhost:5173/alerts` | Reorder alerts |
| `http://localhost:5173/data-quality` | Data quality issues |
| `http://localhost:5173/settings` | Profile settings |

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# ── Database ──────────────────────────────────────
DB_NAME=demandslens_db
DB_USER=demandlens_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# ── Forecasting / Alert Tuning ────────────────────
DEFAULT_LEAD_TIME_DAYS=3
SAFETY_BUFFER=10

# ── Django ────────────────────────────────────────
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
```

> **⚠️ Never commit your `.env` file.** It is already listed in `.gitignore`.

Generate a secure Django secret key:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## 📡 API Reference

Base URL: `http://localhost:8000/api`

> All user-profile endpoints require the `X-Demo-Token: demo-secret-2024` header.

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/summary` | KPI summary (total items, low stock, alerts, issues) |

### Inventory

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/items/` | List all inventory items with stock + risk status |
| `GET` | `/items/:id/` | Single item detail |
| `GET` | `/items/:id/forecast/` | Consumption history + 7-day forecast for item |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/alerts/reorder/` | All reorder recommendations |

### Data Quality

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/data-quality/issues/` | All unresolved data quality issues |

### Forecasting

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/forecast/run/` | Run Exponential Smoothing forecast + regenerate alerts |

### User Profile

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `PUT` | `/user/update-name/` | `{ "name": "John Doe" }` | Update display name |
| `PUT` | `/user/update-email/` | `{ "email": "john@co.com" }` | Update email address |
| `PUT` | `/user/update-password/` | `{ "current_password": "...", "new_password": "..." }` | Change password |

### Example API Response — `/api/items/`

```json
[
  {
    "item_id": "ITM001",
    "item_name": "Paracetamol 500mg",
    "category": "Pharmaceuticals",
    "unit": "tablets",
    "cost_per_unit": "0.15",
    "supplier": { "supplier_name": "MediSupply Ltd." },
    "stock": {
      "quantity_available": "1200.00",
      "reorder_level": "500.00"
    },
    "forecast_next_7d": 384.5,
    "risk_status": "safe"
  }
]
```

---

## 🎮 Demo Login

The app ships with a fully-functional **demo mode** so you can explore without setting up real credentials.

1. Navigate to **http://localhost:5173/login**
2. Click the **"Try Demo Login"** button (purple, dashed border)
3. Watch it auto-type `demo@inventoryai.com` and `demo1234`
4. You are automatically signed in and redirected to the Dashboard

> **Note:** The demo user maps to the Django superuser you created in Step 3. Make sure to create it with `python manage.py createsuperuser` before testing the Settings page updates.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** this repository
2. **Create** your feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add some feature'`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Use for |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring |
| `style:` | Formatting / linting |
| `test:` | Adding tests |

---

## 🔧 Troubleshooting

### ❌ CORS Error — `x-demo-token not allowed`
**Fix:** Verify `CORS_ALLOW_HEADERS` in `backend/config/settings.py` includes `"x-demo-token"`. Restart the Django server after saving.

### ❌ Chart shows `-1 × -1` warning
**Fix:** Use `height={250}` (integer, not `"100%"`) on `<ResponsiveContainer>` and add `style={{ minWidth: 0 }}` to its flex parent.

### ❌ `@import must precede all other statements`
**Fix:** In `src/index.css`, ensure the Google Fonts `@import url(...)` line appears **before** `@import "tailwindcss"`.

### ❌ `psycopg2` install fails
```bash
# Use the binary version instead
pip install psycopg2-binary
```

### ❌ Database connection refused
- Confirm PostgreSQL is running: `pg_ctl status`
- Check `.env` credentials match your PostgreSQL setup
- Ensure the database exists: `psql -U postgres -l`

### ❌ Forecast returns no data
- Make sure you've seeded the database: `python manage.py shell < seed_data.py`
- Click **"Run Global Forecast"** on the Dashboard first
- Items need at least 1 day of valid consumption data to generate a forecast

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **Bhushan** · Powered by Django, React & PostgreSQL

⭐ Star this repo if you found it useful!

</div>
