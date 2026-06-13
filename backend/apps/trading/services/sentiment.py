"""Sentiment scoring (VADER, with a graceful keyword fallback)."""
import logging

logger = logging.getLogger("apps.trading")

_analyzer = None


def _get_analyzer():
    """Lazily build a VADER analyzer; return None if the lib is unavailable."""
    global _analyzer
    if _analyzer is not None:
        return _analyzer
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

        _analyzer = SentimentIntensityAnalyzer()
    except Exception as exc:  # noqa: BLE001
        logger.warning("VADER unavailable, using keyword fallback: %s", exc)
        _analyzer = False
    return _analyzer


_POSITIVE = {"gain", "surge", "rally", "beat", "bullish", "up", "growth", "profit", "strong"}
_NEGATIVE = {"loss", "drop", "fall", "miss", "bearish", "down", "decline", "weak", "crash"}


def score_text(text: str) -> float:
    """Return a sentiment score in [-1, 1] for a piece of text."""
    if not text:
        return 0.0
    analyzer = _get_analyzer()
    if analyzer:
        return analyzer.polarity_scores(text)["compound"]
    # Keyword fallback.
    words = text.lower().split()
    pos = sum(w in _POSITIVE for w in words)
    neg = sum(w in _NEGATIVE for w in words)
    total = pos + neg
    return 0.0 if total == 0 else (pos - neg) / total


def score_many(texts: list[str]) -> float:
    """Average sentiment across multiple texts."""
    scores = [score_text(t) for t in texts if t]
    return sum(scores) / len(scores) if scores else 0.0
