"""AIDecisionAgent — ask Ollama for a BUY / SELL / HOLD decision."""
import logging

from ..llm_service import OllamaService

logger = logging.getLogger("apps.trading")

BUY_PROMPT = """You are a professional stock trader.

Given:
- price: {price}
- RSI: {rsi}
- MACD: {macd}
- news summary: {news_summary}
- reddit sentiment: {sentiment_score}

Decide:
1. Action: BUY / SELL / HOLD
2. Confidence: 0 to 1
3. Reason: detailed explanation

Rules:
- Avoid risky trades
- Prefer high probability setups

Return ONLY JSON:
{{"action": "...", "confidence": 0.0, "reason": "..."}}"""


class AIDecisionAgent:
    def __init__(self, llm: OllamaService | None = None):
        self.llm = llm or OllamaService()

    def run(self, aggregated: dict) -> dict:
        prompt = BUY_PROMPT.format(
            price=aggregated.get("price"),
            rsi=aggregated.get("rsi"),
            macd=aggregated.get("macd"),
            news_summary=aggregated.get("news_summary", "")[:500],
            sentiment_score=aggregated.get("sentiment_score"),
        )
        result = self.llm.generate_json(prompt)
        if not result:
            logger.info("AIDecisionAgent: no/invalid LLM response for %s -> HOLD", aggregated.get("symbol"))
            return {"action": "HOLD", "confidence": 0.0, "reason": "LLM unavailable or invalid response."}

        return _normalize(result)


def _normalize(result: dict) -> dict:
    action = str(result.get("action", "HOLD")).upper().strip()
    if action not in {"BUY", "SELL", "HOLD"}:
        action = "HOLD"
    try:
        confidence = float(result.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))
    return {
        "action": action,
        "confidence": confidence,
        "reason": str(result.get("reason", "")).strip(),
    }
