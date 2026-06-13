# TradeMind AI — Backend

Django + DRF backend for the TradeMind AI paper-trading system. Provides JWT
auth, user management, the agent pipeline (Ollama-powered), and the dashboard
APIs consumed by the React frontend.

> **Paper trading only.** No real orders are ever placed.

## Stack

- **Django 5 + Django REST Framework**
- **SimpleJWT** (access/refresh tokens, refresh-token blacklist on logout)
- **PostgreSQL** (SQLite fallback for local dev/tests)
- **Ollama** local LLM for trading decisions
- **yfinance / Google News / Reddit (PRAW) / VADER** for data + sentiment
  (all imported lazily — the app boots and degrades gracefully if they're
  missing or offline)

## Quick start

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # edit DB + Ollama + email settings

# Option A — PostgreSQL (default; create the DB/role first)
#   createdb trademind && createuser trademind ...
# Option B — quick local dev with SQLite:
#   set USE_SQLITE=True in .env

python manage.py migrate
python manage.py seed_data      # creates the default admin
python manage.py runserver      # http://localhost:8000
```

The default admin (configurable in `.env`) is `admin` / `Admin@12345`.

## Running a trading cycle

```bash
python manage.py run_cycle      # one full discover → decide → execute → monitor pass
```

Or trigger it over the API (admin only): `POST /api/run-cycle`.

### Scheduling (every 5–15 min)

Use cron (or systemd timers / Celery beat). Example crontab entry:

```cron
*/10 * * * * cd /path/to/backend && /path/to/venv/bin/python manage.py run_cycle >> /var/log/trademind.log 2>&1
```

## Agent architecture

| Agent | Responsibility |
|-------|----------------|
| `MarketDiscoveryAgent` | Screen the watchlist, pick top N by volume spike + movement |
| `DataAggregationAgent` | Price, RSI, MACD, news + Reddit summaries & sentiment |
| `AIDecisionAgent` | Ask Ollama for BUY/SELL/HOLD + confidence + reason |
| `RiskManagementAgent` | **Mandatory** safety layer; can veto the AI (see rules below) |
| `TradeExecutionAgent` | Record approved BUYs as OPEN paper trades |
| `PositionMonitoringAgent` | Re-evaluate open trades and SELL when warranted |
| `EvaluationAgent` | Compute portfolio + performance metrics |
| `Orchestrator` | Wires the cycle together |

### Risk rules (the AI cannot override these)

- Reject BUY if confidence < `MIN_CONFIDENCE` (0.7)
- Reject BUY if RSI > `MAX_RSI` (75, overbought)
- Stop-loss `2%`, take-profit `4%` enforced on every position
- Max `3` open trades

## API

Auth:
- `POST /api/auth/login` → `{ access, refresh, user }`
- `POST /api/auth/logout` (blacklists refresh)
- `POST /api/auth/refresh`
- `GET  /api/auth/me`

User management (admin only):
- `GET/POST /api/users`, `PUT/DELETE /api/users/{id}`
  (new users get a generated password emailed to them)

Trading data (read = any authenticated user, write = admin):
- `GET /api/trades`, `GET /api/trades/{id}`
- `GET /api/portfolio`
- `GET /api/decisions`
- `GET /api/performance`
- `GET /api/market-data?symbol=AAPL`
- `GET /api/sentiment`
- `POST /api/run-cycle` (admin)

## Project layout

```
backend/
├── config/                 settings, urls, wsgi/asgi
├── apps/
│   ├── accounts/           custom User, JWT auth, user CRUD, email, seeder
│   └── trading/
│       ├── models.py       Trade, Decision, MarketData, Sentiment
│       ├── serializers.py
│       ├── views.py        dashboard + run-cycle endpoints
│       ├── services/
│       │   ├── llm_service.py      Ollama client
│       │   ├── data_fetchers.py    yfinance / news / reddit + indicators
│       │   ├── sentiment.py        VADER scoring
│       │   └── agents/             the 7 agents + orchestrator
│       └── management/commands/run_cycle.py
└── manage.py
```

## Permissions

- **Admin** (`is_staff`/`is_superuser`): full access — manage users, run cycles.
- **Regular user**: read-only access to trades, decisions, dashboard.
