"""PositionMonitoringAgent — decide when to SELL open positions."""
import logging

from ...models import AgentType, Decision, Trade, TradeStatus
from .. import data_fetchers
from ..llm_service import OllamaService
from .risk_management import RiskManagementAgent
from .trade_execution import TradeExecutionAgent

logger = logging.getLogger("apps.trading")

SELL_PROMPT = """You are managing an open stock position.

Given:
- buy price: {buy_price}
- current price: {current_price}
- profit %: {profit_pct}
- sentiment: {sentiment}

Decide: SELL or HOLD.
Provide reason and confidence (0 to 1).

Return ONLY JSON:
{{"action": "...", "confidence": 0.0, "reason": "..."}}"""


class PositionMonitoringAgent:
    def __init__(self, llm: OllamaService | None = None):
        self.llm = llm or OllamaService()
        self.risk = RiskManagementAgent()
        self.executor = TradeExecutionAgent()

    def run(self) -> list[dict]:
        """Check every open trade and close those that should be sold."""
        results = []
        for trade in Trade.objects.filter(status=TradeStatus.OPEN):
            results.append(self._monitor(trade))
        return results

    def _monitor(self, trade: Trade) -> dict:
        price_data = data_fetchers.fetch_price_data(trade.symbol)
        current_price = price_data.price
        if current_price is None:
            return {"symbol": trade.symbol, "action": "HOLD", "reason": "No current price."}

        profit_pct = (current_price - float(trade.buy_price)) / float(trade.buy_price) * 100

        prompt = SELL_PROMPT.format(
            buy_price=trade.buy_price,
            current_price=current_price,
            profit_pct=round(profit_pct, 2),
            sentiment=price_data.macd,
        )
        ai = self.llm.generate_json(prompt) or {}
        decision = {
            "action": str(ai.get("action", "HOLD")).upper(),
            "confidence": float(ai.get("confidence", 0.0) or 0.0),
            "reason": str(ai.get("reason", "")),
        }

        verdict = self.risk.evaluate_sell(
            trade=trade, current_price=current_price, decision=decision
        )

        Decision.objects.create(
            symbol=trade.symbol,
            action="SELL" if verdict.approved else "HOLD",
            confidence=decision["confidence"],
            reason=verdict.reason,
            agent_type=AgentType.SELL,
            approved=verdict.approved,
            trade=trade,
        )

        if verdict.approved:
            self.executor.close_trade(
                trade=trade, sell_price=current_price, reason=verdict.reason
            )
            return {"symbol": trade.symbol, "action": "SELL", "reason": verdict.reason}
        return {"symbol": trade.symbol, "action": "HOLD", "reason": verdict.reason}
