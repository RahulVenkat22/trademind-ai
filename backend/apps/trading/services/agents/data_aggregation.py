"""DataAggregationAgent — collect price, indicators, news, and Reddit data."""
import logging

from ...models import MarketData, Sentiment
from .. import data_fetchers

logger = logging.getLogger("apps.trading")


class DataAggregationAgent:
    """Gather everything the decision agent needs for one symbol and persist it."""

    def run(self, symbol: str) -> dict | None:
        price = data_fetchers.fetch_price_data(symbol)
        if price.price is None:
            logger.info("DataAggregationAgent: no price for %s, skipping", symbol)
            return None

        news = data_fetchers.fetch_news(symbol)
        reddit = data_fetchers.fetch_reddit(symbol)

        overall = round((news.score + reddit.score) / 2, 4)

        # Persist snapshots for the dashboard / charts.
        MarketData.objects.create(
            symbol=symbol,
            price=price.price,
            rsi=price.rsi,
            macd=price.macd,
            volume=price.volume,
            sentiment=overall,
        )
        Sentiment.objects.create(
            symbol=symbol,
            news_summary=news.summary,
            news_sentiment=round(news.score, 4),
            reddit_summary=reddit.summary,
            reddit_sentiment=round(reddit.score, 4),
            overall_sentiment=overall,
        )

        return {
            "symbol": symbol,
            "price": price.price,
            "rsi": price.rsi,
            "macd": price.macd,
            "news_summary": news.summary,
            "reddit_summary": reddit.summary,
            "sentiment_score": overall,
        }
