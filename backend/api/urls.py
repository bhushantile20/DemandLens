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
]
