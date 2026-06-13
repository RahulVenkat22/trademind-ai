"""EvaluationAgent — compute aggregate performance metrics."""
import logging

from django.conf import settings

from ...models import MarketData, Trade, TradeStatus

logger = logging.getLogger("apps.trading")


class EvaluationAgent:
    """Derive portfolio/performance metrics from stored trades."""

    def latest_prices(self, symbols: list[str]) -> dict[str, float]:
        prices: dict[str, float] = {}
        for symbol in set(symbols):
            md = MarketData.objects.filter(symbol=symbol).order_by("-timestamp").first()
            if md:
                prices[symbol] = float(md.price)
        return prices

    def performance(self) -> dict:
        starting_cash = settings.TRADING["STARTING_CASH"]
        trades = list(Trade.objects.all())
        closed = [t for t in trades if t.status == TradeStatus.CLOSED]
        open_trades = [t for t in trades if t.status == TradeStatus.OPEN]

        prices = self.latest_prices([t.symbol for t in open_trades])

        realized = sum((t.realized_pnl or 0) for t in closed)
        unrealized = sum((t.unrealized_pnl(prices.get(t.symbol)) or 0) for t in open_trades)
        total_pnl = realized + unrealized

        winning = sum(1 for t in closed if (t.realized_pnl or 0) > 0)
        losing = sum(1 for t in closed if (t.realized_pnl or 0) <= 0)
        win_rate = (winning / len(closed) * 100) if closed else 0.0

        # Equity curve: cumulative realized P/L over closed-trade exit times.
        equity_curve = []
        running = starting_cash
        for t in sorted(closed, key=lambda x: x.sell_time or x.buy_time):
            running += t.realized_pnl or 0
            equity_curve.append(
                {
                    "timestamp": (t.sell_time or t.buy_time).isoformat(),
                    "value": round(running, 2),
                }
            )

        return {
            "total_pnl": round(total_pnl, 2),
            "total_pnl_percent": round(total_pnl / starting_cash * 100, 2) if starting_cash else 0.0,
            "win_rate": round(win_rate, 2),
            "total_trades": len(trades),
            "winning_trades": winning,
            "losing_trades": losing,
            "active_trades": len(open_trades),
            "equity_curve": equity_curve,
        }

    def portfolio(self) -> dict:
        starting_cash = settings.TRADING["STARTING_CASH"]
        open_trades = list(Trade.objects.filter(status=TradeStatus.OPEN))
        prices = self.latest_prices([t.symbol for t in open_trades])

        invested = sum(float(t.buy_price) * t.quantity for t in open_trades)
        # Current market value of open positions.
        market_value = sum(
            (prices.get(t.symbol, float(t.buy_price)) * t.quantity) for t in open_trades
        )
        # Realized P/L from closed trades.
        realized_pnl = sum(
            (t.realized_pnl or 0)
            for t in Trade.objects.filter(status=TradeStatus.CLOSED)
        )
        cash = starting_cash + realized_pnl - invested
        total_value = cash + market_value

        return {
            "total_value": round(total_value, 2),
            "cash": round(cash, 2),
            "invested": round(invested, 2),
            "open_positions": len(open_trades),
            "_current_prices": prices,
            "positions": open_trades,
        }
