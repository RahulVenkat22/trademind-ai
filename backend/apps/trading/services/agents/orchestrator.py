"""Orchestrator — wire the agents into a single trading cycle.

Flow per cycle:
  1. MarketDiscoveryAgent     → pick symbols
  2. DataAggregationAgent     → gather data per symbol
  3. AIDecisionAgent          → BUY/SELL/HOLD via Ollama
  4. RiskManagementAgent      → validate (can veto)
  5. TradeExecutionAgent      → record approved BUYs
  6. PositionMonitoringAgent  → manage/close open positions
"""
import logging

from ...models import AgentType, Decision
from .ai_decision import AIDecisionAgent
from .data_aggregation import DataAggregationAgent
from .evaluation import EvaluationAgent
from .market_discovery import MarketDiscoveryAgent
from .position_monitoring import PositionMonitoringAgent
from .risk_management import RiskManagementAgent
from .trade_execution import TradeExecutionAgent

logger = logging.getLogger("apps.trading")


class Orchestrator:
    def __init__(self):
        self.discovery = MarketDiscoveryAgent()
        self.aggregator = DataAggregationAgent()
        self.decider = AIDecisionAgent()
        self.risk = RiskManagementAgent()
        self.executor = TradeExecutionAgent()
        self.monitor = PositionMonitoringAgent()
        self.evaluator = EvaluationAgent()

    def run_cycle(self) -> dict:
        summary = {"discovered": [], "evaluated": [], "opened": [], "closed": []}

        # 1. First manage existing positions (sell side).
        sell_results = self.monitor.run()
        summary["closed"] = [r for r in sell_results if r["action"] == "SELL"]

        # 2. Discover candidate symbols.
        discovered = self.discovery.run().get("symbols", [])
        summary["discovered"] = discovered

        # 3-5. Evaluate each symbol on the buy side.
        for symbol in discovered:
            aggregated = self.aggregator.run(symbol)
            if not aggregated:
                continue

            decision = self.decider.run(aggregated)
            verdict = self.risk.evaluate_buy(decision=decision, aggregated=aggregated)

            Decision.objects.create(
                symbol=symbol,
                action=decision["action"],
                confidence=decision["confidence"],
                reason=f"{decision['reason']}\nRisk: {verdict.reason}".strip(),
                agent_type=AgentType.BUY,
                approved=verdict.approved,
            )
            summary["evaluated"].append(
                {"symbol": symbol, "action": decision["action"], "approved": verdict.approved}
            )

            if verdict.approved:
                trade = self.executor.open_trade(
                    aggregated=aggregated, verdict=verdict, reason=decision["reason"]
                )
                summary["opened"].append({"symbol": symbol, "trade_id": trade.id})

        summary["performance"] = self.evaluator.performance()
        logger.info(
            "Cycle complete: %d opened, %d closed",
            len(summary["opened"]),
            len(summary["closed"]),
        )
        return summary
