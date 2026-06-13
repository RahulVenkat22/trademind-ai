"""Celery tasks for the trading app."""
import logging

from celery import shared_task

from apps.trading.services.agents.orchestrator import Orchestrator

logger = logging.getLogger(__name__)


@shared_task(name="apps.trading.tasks.run_trading_cycle")
def run_trading_cycle() -> dict:
    """Run a single trading cycle (discover → decide → execute → monitor).

    Scheduled by Celery Beat every 20 minutes; mirrors the `run_cycle`
    management command so both share the same orchestrator entry point.
    """
    logger.info("Running trading cycle…")
    summary = Orchestrator().run_cycle()
    result = {
        "discovered": summary["discovered"],
        "opened": summary["opened"],
        "closed": summary["closed"],
    }
    logger.info("Cycle complete: %s", result)
    return result
