from django.db import models


class Action(models.TextChoices):
    BUY = "BUY", "Buy"
    SELL = "SELL", "Sell"
    HOLD = "HOLD", "Hold"


class TradeStatus(models.TextChoices):
    OPEN = "OPEN", "Open"
    CLOSED = "CLOSED", "Closed"


class AgentType(models.TextChoices):
    BUY = "BUY", "Buy"
    SELL = "SELL", "Sell"


class Trade(models.Model):
    """A paper trade. Opened on an approved BUY, closed on a SELL."""

    symbol = models.CharField(max_length=20, db_index=True)
    quantity = models.PositiveIntegerField(default=1)
    buy_price = models.DecimalField(max_digits=14, decimal_places=4)
    sell_price = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    status = models.CharField(max_length=8, choices=TradeStatus.choices, default=TradeStatus.OPEN)
    buy_time = models.DateTimeField(auto_now_add=True)
    sell_time = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True, default="")
    # Risk levels captured at entry (paper-trading audit trail).
    stop_loss = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    take_profit = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)

    class Meta:
        ordering = ["-buy_time"]

    def __str__(self) -> str:
        return f"{self.symbol} {self.status} @ {self.buy_price}"

    @property
    def realized_pnl(self):
        """Realized profit/loss (only meaningful once closed)."""
        if self.sell_price is None:
            return None
        return float(self.sell_price - self.buy_price) * self.quantity

    def unrealized_pnl(self, current_price: float | None):
        if self.status != TradeStatus.OPEN or current_price is None:
            return None
        return (current_price - float(self.buy_price)) * self.quantity

    def pnl_percent(self, current_price: float | None = None):
        """P/L percent vs entry. Uses sell_price if closed, else current price."""
        ref = self.sell_price if self.sell_price is not None else current_price
        if ref is None or not self.buy_price:
            return None
        return (float(ref) - float(self.buy_price)) / float(self.buy_price) * 100


class Decision(models.Model):
    """A logged AI decision and the risk layer's verdict."""

    symbol = models.CharField(max_length=20, db_index=True)
    action = models.CharField(max_length=4, choices=Action.choices)
    confidence = models.FloatField(default=0.0)
    reason = models.TextField(blank=True, default="")
    agent_type = models.CharField(max_length=4, choices=AgentType.choices)
    approved = models.BooleanField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    trade = models.ForeignKey(
        Trade, null=True, blank=True, on_delete=models.SET_NULL, related_name="decisions"
    )

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self) -> str:
        return f"{self.symbol} {self.action} ({self.confidence:.2f})"


class MarketData(models.Model):
    """A point-in-time market snapshot for a symbol."""

    symbol = models.CharField(max_length=20, db_index=True)
    price = models.DecimalField(max_digits=14, decimal_places=4)
    rsi = models.FloatField(null=True, blank=True)
    macd = models.CharField(max_length=16, blank=True, default="")
    volume = models.BigIntegerField(null=True, blank=True)
    sentiment = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [models.Index(fields=["symbol", "-timestamp"])]

    def __str__(self) -> str:
        return f"{self.symbol} @ {self.price}"


class Sentiment(models.Model):
    """News + Reddit sentiment snapshot for a symbol."""

    symbol = models.CharField(max_length=20, db_index=True)
    news_summary = models.TextField(blank=True, default="")
    news_sentiment = models.FloatField(default=0.0)
    reddit_summary = models.TextField(blank=True, default="")
    reddit_sentiment = models.FloatField(default=0.0)
    overall_sentiment = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [models.Index(fields=["symbol", "-timestamp"])]

    def __str__(self) -> str:
        return f"{self.symbol} sentiment {self.overall_sentiment:.2f}"
