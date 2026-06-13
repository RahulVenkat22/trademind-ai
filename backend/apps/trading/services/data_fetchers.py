"""Market, news, and Reddit data fetchers.

All heavy third-party libraries (yfinance, pandas, praw, feedparser) are
imported lazily so the Django app boots and serves cached data even when the
data-science stack or network is unavailable.
"""
import logging
import math
import time
from dataclasses import dataclass, field

from django.conf import settings

from . import sentiment as sentiment_service

logger = logging.getLogger("apps.trading")


@dataclass
class PriceData:
    symbol: str
    price: float | None = None
    rsi: float | None = None
    macd: str = ""
    volume: int | None = None
    # Recent volume average used for spike detection.
    avg_volume: float | None = None
    pct_change: float = 0.0


@dataclass
class NewsData:
    summary: str = ""
    score: float = 0.0
    headlines: list[str] = field(default_factory=list)


@dataclass
class RedditData:
    summary: str = ""
    score: float = 0.0
    posts: list[str] = field(default_factory=list)


# --- Technical indicators ---------------------------------------------------

def _compute_rsi(closes, period: int = 14) -> float | None:
    """Wilder's RSI from a list/series of close prices."""
    try:
        values = list(closes)
        if len(values) < period + 1:
            return None
        gains, losses = [], []
        for i in range(1, len(values)):
            change = values[i] - values[i - 1]
            gains.append(max(change, 0))
            losses.append(max(-change, 0))
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return round(100 - (100 / (1 + rs)), 2)
    except Exception as exc:  # noqa: BLE001
        logger.debug("RSI computation failed: %s", exc)
        return None


def _compute_macd(closes) -> str:
    """Return a simple 'bullish' / 'bearish' / 'neutral' MACD signal."""
    try:
        values = list(closes)
        if len(values) < 26:
            return "neutral"

        def ema(data, span):
            k = 2 / (span + 1)
            e = data[0]
            for v in data[1:]:
                e = v * k + e * (1 - k)
            return e

        macd_line = ema(values, 12) - ema(values, 26)
        return "bullish" if macd_line > 0 else "bearish"
    except Exception as exc:  # noqa: BLE001
        logger.debug("MACD computation failed: %s", exc)
        return "neutral"


# --- Market data (yfinance) -------------------------------------------------

def _finite_floats(values) -> list[float]:
    """Coerce to floats, dropping NaN/inf/None (Yahoo returns NaN when throttled)."""
    out: list[float] = []
    for v in values:
        try:
            f = float(v)
        except (TypeError, ValueError):
            continue
        if math.isfinite(f):
            out.append(f)
    return out


def fetch_price_data(symbol: str, retries: int = 3, backoff: float = 2.0) -> PriceData:
    """Fetch price/volume/indicators for a symbol via yfinance.

    Yahoo rate-limits aggressively and sometimes returns rows whose prices are
    all NaN. We drop NaN values and retry with a linear backoff; if no valid
    price can be obtained we return an empty PriceData (price=None) so callers
    skip the symbol instead of persisting a NaN.
    """
    try:
        import yfinance as yf
    except Exception as exc:  # noqa: BLE001
        logger.warning("yfinance unavailable: %s", exc)
        return PriceData(symbol=symbol)

    for attempt in range(1, retries + 1):
        try:
            hist = yf.Ticker(symbol).history(period="3mo", interval="1d")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Price fetch error for %s (attempt %d/%d): %s", symbol, attempt, retries, exc)
            hist = None

        if hist is not None and not hist.empty:
            closes = _finite_floats(hist["Close"].tolist())
            volumes = _finite_floats(hist["Volume"].tolist())
            if closes:
                price = closes[-1]
                volume = int(volumes[-1]) if volumes else None
                avg_volume = sum(volumes[-20:]) / min(len(volumes), 20) if volumes else None
                pct_change = 0.0
                if len(closes) >= 2 and closes[-2]:
                    pct_change = (closes[-1] - closes[-2]) / closes[-2] * 100
                return PriceData(
                    symbol=symbol,
                    price=round(price, 4),
                    rsi=_compute_rsi(closes),
                    macd=_compute_macd(closes),
                    volume=volume,
                    avg_volume=avg_volume,
                    pct_change=round(pct_change, 2),
                )

        if attempt < retries:
            time.sleep(backoff * attempt)  # linear backoff between retries

    logger.info("No valid price data for %s after %d attempts", symbol, retries)
    return PriceData(symbol=symbol)


# --- News (Google News RSS) -------------------------------------------------

def fetch_news(symbol: str, limit: int = 5) -> NewsData:
    try:
        import feedparser

        url = f"https://news.google.com/rss/search?q={symbol}+stock&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)
        headlines = [e.title for e in feed.entries[:limit]] if feed.entries else []
        if not headlines:
            return NewsData()
        summary = "; ".join(headlines)
        return NewsData(
            summary=summary,
            score=sentiment_service.score_many(headlines),
            headlines=headlines,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("News fetch failed for %s: %s", symbol, exc)
        return NewsData()


# --- Reddit (PRAW, optional) ------------------------------------------------

def fetch_reddit(symbol: str, limit: int = 5) -> RedditData:
    cfg = settings.REDDIT
    if not cfg["CLIENT_ID"] or not cfg["CLIENT_SECRET"]:
        logger.debug("Reddit credentials not configured; skipping.")
        return RedditData()
    try:
        import praw

        reddit = praw.Reddit(
            client_id=cfg["CLIENT_ID"],
            client_secret=cfg["CLIENT_SECRET"],
            user_agent=cfg["USER_AGENT"],
        )
        posts = []
        for submission in reddit.subreddit("stocks+wallstreetbets").search(
            symbol, limit=limit, sort="new"
        ):
            posts.append(submission.title)
        if not posts:
            return RedditData()
        return RedditData(
            summary="; ".join(posts),
            score=sentiment_service.score_many(posts),
            posts=posts,
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Reddit fetch failed for %s: %s", symbol, exc)
        return RedditData()
