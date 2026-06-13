from django.urls import path

from . import views

urlpatterns = [
    path("trades", views.trades_list, name="trades-list"),
    path("trades/<int:pk>", views.trade_detail, name="trade-detail"),
    path("decisions", views.decisions_list, name="decisions-list"),
    path("market-data", views.market_data_list, name="market-data-list"),
    path("sentiment", views.sentiment_list, name="sentiment-list"),
    path("portfolio", views.portfolio, name="portfolio"),
    path("performance", views.performance, name="performance"),
    path("run-cycle", views.run_cycle, name="run-cycle"),
]
