from rest_framework import serializers

from .models import Decision, MarketData, Sentiment, Trade, TradeStatus


class TradeSerializer(serializers.ModelSerializer):
    pnl = serializers.SerializerMethodField()
    pnl_percent = serializers.SerializerMethodField()

    class Meta:
        model = Trade
        fields = [
            "id",
            "symbol",
            "quantity",
            "buy_price",
            "sell_price",
            "status",
            "buy_time",
            "sell_time",
            "reason",
            "stop_loss",
            "take_profit",
            "pnl",
            "pnl_percent",
        ]

    def _current_price(self, obj: Trade):
        prices = self.context.get("current_prices") or {}
        return prices.get(obj.symbol)

    def get_pnl(self, obj: Trade):
        if obj.status == TradeStatus.CLOSED:
            return obj.realized_pnl
        return obj.unrealized_pnl(self._current_price(obj))

    def get_pnl_percent(self, obj: Trade):
        return obj.pnl_percent(self._current_price(obj))


class DecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Decision
        fields = [
            "id",
            "symbol",
            "action",
            "confidence",
            "reason",
            "agent_type",
            "approved",
            "timestamp",
        ]


class MarketDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketData
        fields = ["id", "symbol", "price", "rsi", "macd", "volume", "sentiment", "timestamp"]


class SentimentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sentiment
        fields = [
            "id",
            "symbol",
            "news_summary",
            "news_sentiment",
            "reddit_summary",
            "reddit_sentiment",
            "overall_sentiment",
            "timestamp",
        ]
