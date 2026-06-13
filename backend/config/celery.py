"""Celery application for the TradeMind AI backend.

Runs the trading cycle on a schedule via Celery Beat. Start the worker and
beat scheduler alongside Django:

    celery -A config worker -l info
    celery -A config beat -l info
"""
import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("trademind")

# Read CELERY_* settings from Django settings and auto-discover task modules.
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Run the trading cycle every 20 minutes.
app.conf.beat_schedule = {
    "run-trading-cycle-every-20-minutes": {
        "task": "apps.trading.tasks.run_trading_cycle",
        "schedule": crontab(minute="*/20"),
    },
}
