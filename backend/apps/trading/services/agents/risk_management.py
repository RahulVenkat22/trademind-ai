"""RiskManagementAgent — the mandatory safety layer.

The AI can never override these rules. This agent validates (and can veto)
every BUY decision before it reaches execution.
"""
import logging
from dataclasses import dataclass

from django.conf import settings

from ...models import Trade, TradeStatus

logger = logging.getLogger("apps.trading")


@dataclass
class RiskVerdict:
    approved: bool
    reason: str
    stop_loss: float | None = None
    take_profit: float | None = None


class RiskManagementAgent:
    def __init__(self):
        cfg = settings.TRADING
        self.min_confidence = cfg["MIN_CONFIDENCE"]
        self.max_rsi = cfg["MAX_RSI"]
        self.stop_loss_pct = cfg["STOP_LOSS_PCT"]
        self.take_profit_pct = cfg["TAKE_PROFIT_PCT"]
        self.max_open_trades = cfg["MAX_OPEN_TRADES"]

    def evaluate_buy(self, *, decision: dict, aggregated: dict) -> RiskVerdict:
        """Validate a BUY decision against the risk rules."""
        if decision["action"] != "BUY":
            return RiskVerdict(False, "Decision is not a BUY.")

        if decision["confidence"] < self.min_confidence:
            return RiskVerdict(
                False,
                f"Confidence {decision['confidence']:.2f} below minimum {self.min_confidence}.",
            )

        rsi = aggregated.get("rsi")
        if rsi is not None and rsi > self.max_rsi:
            return RiskVerdict(False, f"RSI {rsi} is overbought (> {self.max_rsi}).")

        open_count = Trade.objects.filter(status=TradeStatus.OPEN).count()
        if open_count >= self.max_open_trades:
            return RiskVerdict(
                False,
                f"Max open trades reached ({open_count}/{self.max_open_trades}).",
            )

        # Already holding this symbol — don't stack positions.
        if Trade.objects.filter(symbol=aggregated["symbol"], status=TradeStatus.OPEN).exists():
            return RiskVerdict(False, f"Already holding an open position in {aggregated['symbol']}.")

        price = aggregated["price"]
        stop_loss = round(price * (1 - self.stop_loss_pct), 4)
        take_profit = round(price * (1 + self.take_profit_pct), 4)
        return RiskVerdict(
            approved=True,
            reason="Approved: passed all risk checks.",
            stop_loss=stop_loss,
            take_profit=take_profit,
        )

    def evaluate_sell(self, *, trade: Trade, current_price: float, decision: dict) -> RiskVerdict:
        """Decide whether to close a position.

        Stop-loss / take-profit are HARD rules and force a sell regardless of
        what the AI says. Otherwise the AI's SELL is honoured.
        """
        if current_price <= float(trade.stop_loss or 0):
            return RiskVerdict(True, "Stop-loss triggered.")
        if trade.take_profit and current_price >= float(trade.take_profit):
            return RiskVerdict(True, "Take-profit triggered.")
        if decision.get("action") == "SELL" and decision.get("confidence", 0) >= self.min_confidence:
            return RiskVerdict(True, decision.get("reason", "AI recommended sell."))
        return RiskVerdict(False, "Hold: no risk trigger and AI did not confidently sell.")
