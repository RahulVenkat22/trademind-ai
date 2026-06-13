from django.contrib import admin

from .models import Decision, MarketData, Sentiment, Trade


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ("symbol", "status", "buy_price", "sell_price", "buy_time", "sell_time")
    list_filter = ("status", "symbol")
    search_fields = ("symbol",)


@admin.register(Decision)
class DecisionAdmin(admin.ModelAdmin):
    list_display = ("symbol", "action", "confidence", "agent_type", "approved", "timestamp")
    list_filter = ("action", "agent_type", "approved")
    search_fields = ("symbol",)


@admin.register(MarketData)
class MarketDataAdmin(admin.ModelAdmin):
    list_display = ("symbol", "price", "rsi", "macd", "sentiment", "timestamp")
    list_filter = ("symbol",)


@admin.register(Sentiment)
class SentimentAdmin(admin.ModelAdmin):
    list_display = ("symbol", "news_sentiment", "reddit_sentiment", "overall_sentiment", "timestamp")
    list_filter = ("symbol",)
