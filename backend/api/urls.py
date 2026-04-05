from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/summary", views.dashboard_summary, name="dashboard-summary"),
    path("items/", views.items_list, name="items-list"),
    path("items/<int:pk>/", views.item_detail, name="item-detail"),
    path("items/<int:pk>/forecast/", views.item_forecast, name="item-forecast"),
    path("alerts/reorder/", views.alerts_reorder, name="alerts-reorder"),
    path("data-quality/issues/", views.data_quality_issues, name="data-quality-issues"),
    path("forecast/run/", views.forecast_run, name="forecast-run"),

    # ── Analytics endpoints ───────────────────────────────────────
    path("analytics/department-consumption/", views.analytics_department_consumption, name="analytics-department"),
    path("analytics/abc-ranking/",            views.analytics_abc_ranking,            name="analytics-abc"),
    path("analytics/inventory-health/",       views.analytics_inventory_health,       name="analytics-health"),
    path("analytics/turnover-rate/",          views.analytics_turnover_rate,          name="analytics-turnover"),
    path("analytics/stock-value/",            views.analytics_stock_value,            name="analytics-stock-value"),
    path("analytics/macro-trend/",            views.analytics_macro_trend,            name="analytics-macro-trend"),

    # ── User profile ──────────────────────────────────────
    path("user/update-name/",     views.user_update_name,     name="user-update-name"),
    path("user/update-email/",    views.user_update_email,    name="user-update-email"),
    path("user/update-password/", views.user_update_password, name="user-update-password"),
]
