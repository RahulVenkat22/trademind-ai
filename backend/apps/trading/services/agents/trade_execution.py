"""TradeExecutionAgent — record paper trades (no real money)."""
import logging

from django.conf import settings
from django.utils import timezone

from ...models import Trade, TradeStatus
from .risk_management import RiskVerdict

logger = logging.getLogger("apps.trading")


class TradeExecutionAgent:
    def open_trade(self, *, aggregated: dict, verdict: RiskVerdict, reason: str) -> Trade:
        """Record an approved BUY as an OPEN paper trade."""
        trade = Trade.objects.create(
            symbol=aggregated["symbol"],
            quantity=settings.TRADING["TRADE_QUANTITY"],
            buy_price=aggregated["price"],
            status=TradeStatus.OPEN,
            reason=reason,
            stop_loss=verdict.stop_loss,
            take_profit=verdict.take_profit,
        )
        logger.info("Opened paper trade #%s for %s @ %s", trade.id, trade.symbol, trade.buy_price)
        return trade

    def close_trade(self, *, trade: Trade, sell_price: float, reason: str) -> Trade:
        """Close an OPEN trade at the given price."""
        trade.sell_price = sell_price
        trade.sell_time = timezone.now()
        trade.status = TradeStatus.CLOSED
        if reason:
            trade.reason = f"{trade.reason}\nExit: {reason}".strip()
        trade.save(update_fields=["sell_price", "sell_time", "status", "reason"])
        logger.info("Closed paper trade #%s for %s @ %s", trade.id, trade.symbol, sell_price)
        return trade
