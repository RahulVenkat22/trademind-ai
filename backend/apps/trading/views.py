import logging

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser

from .models import Decision, MarketData, Sentiment, Trade
from .serializers import (
    DecisionSerializer,
    MarketDataSerializer,
    SentimentSerializer,
    TradeSerializer,
)
from .services.agents.evaluation import EvaluationAgent
from .services.agents.orchestrator import Orchestrator

logger = logging.getLogger("apps.trading")


def _latest_prices_for(trades) -> dict:
    """Latest market price per symbol, for P/L computation in serializers."""
    evaluator = EvaluationAgent()
    return evaluator.latest_prices([t.symbol for t in trades])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trades_list(request):
    """GET /api/trades — optionally filtered by status / symbol."""
    qs = Trade.objects.all()
    status_filter = request.query_params.get("status")
    symbol = request.query_params.get("symbol")
    if status_filter:
        qs = qs.filter(status=status_filter.upper())
    if symbol:
        qs = qs.filter(symbol=symbol.upper())
    trades = list(qs)
    serializer = TradeSerializer(
        trades, many=True, context={"current_prices": _latest_prices_for(trades)}
    )
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def trade_detail(request, pk: int):
    try:
        trade = Trade.objects.get(pk=pk)
    except Trade.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = TradeSerializer(trade, context={"current_prices": _latest_prices_for([trade])})
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def decisions_list(request):
    """GET /api/decisions — optionally filtered by symbol / action."""
    qs = Decision.objects.all()
    symbol = request.query_params.get("symbol")
    action = request.query_params.get("action")
    if symbol:
        qs = qs.filter(symbol=symbol.upper())
    if action:
        qs = qs.filter(action=action.upper())
    return Response(DecisionSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def market_data_list(request):
    """GET /api/market-data?symbol=AAPL — price history for charts."""
    qs = MarketData.objects.all()
    symbol = request.query_params.get("symbol")
    if symbol:
        qs = qs.filter(symbol=symbol.upper())
    # Oldest -> newest so the frontend chart reads left to right.
    qs = qs.order_by("timestamp")
    return Response(MarketDataSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def sentiment_list(request):
    """GET /api/sentiment — latest sentiment snapshot per symbol."""
    symbol = request.query_params.get("symbol")
    if symbol:
        qs = Sentiment.objects.filter(symbol=symbol.upper())
        return Response(SentimentSerializer(qs, many=True).data)

    # Latest snapshot per distinct symbol.
    latest = []
    seen = set()
    for snap in Sentiment.objects.all().order_by("-timestamp"):
        if snap.symbol not in seen:
            seen.add(snap.symbol)
            latest.append(snap)
    return Response(SentimentSerializer(latest, many=True).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def portfolio(request):
    """GET /api/portfolio — cash, invested, open positions."""
    data = EvaluationAgent().portfolio()
    current_prices = data.pop("_current_prices", {})
    positions = TradeSerializer(
        data["positions"], many=True, context={"current_prices": current_prices}
    ).data
    data["positions"] = positions
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def performance(request):
    """GET /api/performance — aggregate metrics + equity curve."""
    return Response(EvaluationAgent().performance())


@api_view(["POST"])
@permission_classes([IsAdminUser])
def run_cycle(request):
    """POST /api/run-cycle — trigger a full agent cycle (admin only)."""
    try:
        summary = Orchestrator().run_cycle()
    except Exception as exc:  # noqa: BLE001
        logger.exception("run-cycle failed")
        return Response(
            {"status": "error", "message": str(exc)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response({"status": "ok", "summary": summary})
