# 🚀 TradeMind AI

An AI-powered paper trading system that uses agent-based architecture and local LLMs (Ollama) to simulate intelligent stock trading decisions.

---

## 🧠 Overview

TradeMind AI is a full-stack application that:

* Collects real-time market data, news, and Reddit sentiment
* Uses AI agents to decide BUY / SELL / HOLD
* Simulates trades (paper trading)
* Tracks performance and decision accuracy
* Displays insights via a React dashboard

---

## ⚙️ Tech Stack

### Backend

* Django
* Django REST Framework
* PostgreSQL

### Frontend

* React
* Chart.js / Recharts

### AI

* Ollama (LLaMA3 / Mistral)

### Data Sources

* yfinance (stock data)
* Reddit (PRAW / scraping)
* News scraping

---

## 🧩 Architecture

### Agents:

* MarketDiscoveryAgent
* DataAggregationAgent
* AIDecisionAgent (LLM - Ollama)
* RiskManagementAgent
* TradeExecutionAgent
* PositionMonitoringAgent (Sell Agent)
* EvaluationAgent

---

## 🔄 Workflow

Scan → Collect → Analyze → Decide → Validate → Execute → Monitor → Evaluate

---

## 🗄️ Database

* trades
* decisions_log
* market_data

---

## 🔐 Risk Management

* Stop Loss: 2%
* Take Profit: 4%
* Max 3 open trades
* AI decisions must pass risk validation

---

## 📊 Features

* AI-based trading decisions
* Reddit + News sentiment analysis
* Trade performance tracking
* Decision reasoning logs
* Interactive dashboard

---

## 🚀 Getting Started

### 1. Clone Repo

```bash
git clone https://github.com/your-username/trademind-ai.git
cd trademind-ai
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run server:

```bash
python manage.py runserver
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

### 4. Run Ollama

```bash
ollama run llama3
```

---

### 5. Celery (scheduled trading cycle)

The trading cycle runs automatically every 20 minutes via Celery Beat. It
needs a Redis broker (configure `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND`
in `.env`).

```bash
# Start Redis (or install it locally, e.g. `apt install redis-server`)
docker run -d -p 6379:6379 redis

# From the backend/ directory, in separate terminals:
celery -A config worker -l info   # runs the task
celery -A config beat -l info     # schedules it every 20 min
```

---

## 📌 Roadmap

* [ ] Basic agent pipeline
* [ ] AI decision integration
* [ ] Sell agent
* [ ] Dashboard UI
* [ ] Performance analytics
* [ ] ML optimization

---

## ⚠️ Disclaimer

This project is for **educational purposes only**.
It uses **paper trading** and does not involve real money.

---

## 👨‍💻 Author

Rahul Venkat

---

## ⭐ Contribute

Pull requests are welcome!
