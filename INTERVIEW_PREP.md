# 🎯 DemandLens: Technical Interview Prep Overview

Use this document to confidently explain your project, "DemandLens", during technical interviews. It is structured to help you articulate not just *what* you built, but *why* you made specific engineering decisions.

---

## 1. The Elevator Pitch (The "What" & "Why")
> *"DemandLens is an enterprise-grade AI inventory forecasting and supply chain optimization platform. It solves the problem of manual stockout tracking and overstocking by marrying a dynamic React/Tailwind frontend with a robust Django REST API. The core value lies in its hybrid AI engine—utilizing LSTM neural networks, Random Forests, and ARIMA statistical models—to predict a 7-day demand outlook and generate automated, mathematically backed reorder alerts."*

**Key Problems Solved:**
*   Eliminates guesswork in inventory reordering.
*   Prevents "Dead Capital" (overstock) and stockouts.
*   Replaces clunky Excel updates with a "Smart Add" CSV ingestion engine.

---

## 2. Tech Stack Setup (The "How")

### Frontend (Client-Side)
*   **React 19 & Vite 8:** Chosen for maximum performance and lightning-fast local development.
*   **Tailwind CSS 4:** Utility-first styling used to build a custom "glassmorphic" enterprise SaaS aesthetic.
*   **Recharts:** Scalable SVG-rendered charting to visualize historical vs. AI predicted data without blocking the main browser thread.
*   **Framer Motion:** Used for smooth page transitions and micro-interactions, elevating the UI to a premium enterprise feel.

### Backend (Server-Side & API)
*   **Django 6.0 & DRF (Django REST Framework):** Provides a hardened, ORM-backed secure REST API. Python is the natural choice here because it seamlessly bridges standard web architecture with heavy data-science libraries.
*   **PostgreSQL 15+:** A hardened relational database to handle high-velocity transaction logs and complex joins (e.g., aggregating 2 years of daily consumption data).

### AI & Data Engine
*   **Pandas & NumPy:** For fast tensor mathematics, data frame aggregation, and outlier/anomaly stripping prior to modeling.
*   **Statsmodels (ARIMA):** The baseline autoregressive statistical model for highly seasonal, predictable data.
*   **Scikit-Learn (Random Forest):** An ensemble machine learning model used to smooth out erratic consumption spikes.
*   **TensorFlow/Keras (LSTM):** Deep learning Long Short-Term Memory neural networks to capture complex, non-linear macroscopic trends across the supply chain.

### DevOps & Infrastructure
*   **GitHub Actions:** Automated CI/CD pipeline triggered on pushes to the `main` branch.
*   **PM2:** An advanced Node-based process manager used on the Virtual Machine to ensure zero-downtime restarts and background execution of the Django server and React static files.
*   **Azure Web Apps (Alternative):** PaaS containerized deployment using Oryx build structures.

---

## 3. The Core Sequence Logic (The "Wow" Factor)
*If an interviewer asks how a feature works from end-to-end, use this flow:*

**The "Smart Add" Data Ingestion Flow:**
1.  User drags and drops a CSV.
2.  React parses the event and sends a `multipart/form-data` payload via Axios to Django.
3.  Django unpacks the CSV using Pandas.
4.  *The Smart Logic:* It queries the `InventoryStock` database. If an item exists, it safely *adds* the new quantity to the existing total. If the item's category or supplier doesn't exist, it auto-generates those relational entities on the fly.
5.  It flags any mathematical errors (like negative stock) in the `DataQualityIssue` table.

**The Multi-Model AI Flow:**
1.  User clicks "Run Forecast" for a specific item.
2.  Django pulls the last 2 years of `DailyConsumption` data.
3.  The engine runs *all three* models simultaneously (ARIMA, Random Forest, LSTM) looking 7-days ahead.
4.  It calculates the **MAPE** (Mean Absolute Percentage Error) and **R²** (Fit Score) for all three outputs against a walk-forward validation set.
5.  *The AI Decision:* The system automatically calculates an Inverse MAPE Ensemble weighting, meaning the prediction with the lowest error rate carries the heaviest weight in the final forecast.
6.  It calculates the Reorder State: `(Predicted Demand + Safety Buffer) - Actual Stock`.
7.  Returns the exact recommended reorder quantities and alerts (`REORDER NOW`, `WATCH`, `SAFE`) to the React frontend.

---

## 4. Key Talking Points & Strategic Answers

### Why did you use three different AI models instead of just one?
> *"Different inventory items behave differently. Toilet paper has highly seasonal, predictable consumption (perfect for ETS). A specialty manufacturing part might sit idle for months and then see a massive spike (better handled by Random Forest averaging). By running a multi-model ensemble and selecting the lowest MAPE score, DemandLens adapts to the specific velocity of every single SKU rather than hoping one single algorithm fits all."*

### How do you handle database performance with large datasets?
> *"The backend is highly normalized. I separated the structural SKU data (`InventoryItem`) from the live, frequently updating quantities (`InventoryStock`). Additionally, the predictive engine doesn't overwrite old forecasts immediately; it logs `ForecastResult` arrays tied to Timestamps and Model types, allowing for historical accuracy auditing."*

### What was the hardest part to implement?
> *(Choose what you feel best about, but the CI/CD or the Smart Add feature are great answers).*
> *"Implementing the automated GitHub Actions CI/CD pipeline. Ensuring that a single git push could securely SSH into the Virtual Machine, execute Python requirements, run database migrations, build the Vite frontend, and seamlessly restart the PM2 services without dropping active user connections was a complex but highly rewarding DevOps challenge."*

### How did you ensure a premium UI experience?
> *"I avoided standard, generic CSS classes and utilized Tailwind with custom glassmorphic styling, combined with Framer Motion for physics-based view transitions. For complex data like the Pareto ABC analysis and the Risk Matrix scatter plots, I used Recharts to keep the DOM light while delivering highly interactive SVGs."*
