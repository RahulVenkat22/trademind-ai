"""MarketDiscoveryAgent — pick the most active symbols to evaluate."""
import logging

from django.conf import settings

from .. import data_fetchers

logger = logging.getLogger("apps.trading")


class MarketDiscoveryAgent:
    """Screen the watchlist and select the top N by volume spike + movement."""

    def run(self) -> dict:
        watchlist = settings.TRADING["WATCHLIST"]
        top_n = settings.TRADING["TOP_N_DISCOVERY"]

        scored = []
        for symbol in watchlist:
            data = data_fetchers.fetch_price_data(symbol)
            if data.price is None:
                continue
            volume_spike = 0.0
            if data.avg_volume and data.volume:
                volume_spike = data.volume / data.avg_volume
            # Rank by a blend of volume spike and absolute price movement.
            score = volume_spike + abs(data.pct_change) / 2
            scored.append((symbol, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        symbols = [s for s, _ in scored[:top_n]]
        logger.info("MarketDiscoveryAgent selected: %s", symbols)
        return {"symbols": symbols}
