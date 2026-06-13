Build a full-stack AI-based paper trading system using Django (backend), React (frontend), PostgreSQL (database), and Ollama (local LLM).

The system must simulate stock trading decisions using AI agents, store all actions, and provide a dashboard to analyze performance. This is PAPER TRADING ONLY (no real money).

---

## 🔷 CORE REQUIREMENTS

1. The system must:

* Select stocks to trade
* Collect market + news + Reddit data
* Use AI (Ollama) to decide BUY / SELL / HOLD
* Store decisions with reasons
* Monitor bought stocks and decide when to SELL
* Track performance
* Show everything in a dashboard

2. AI must NOT directly control execution.
   A risk management layer must validate all decisions.

3. User authentication and authorization must be implemented using JWT (access and refresh tokens).

* Users must be able to login and logout
* Only admin users can create, update, and delete users
* Regular users can only view data (read-only access)

4. When a new user is created:

* A password must be generated or provided
* User details (including password) must be sent via email or notification

5. A default admin user must be created using a seeder script.

---

## 🔷 TECH STACK

Backend:

* Django
* Django REST Framework
* SimpleJWT (for JWT authentication)

Frontend:

* React (with charts)

Database:

* PostgreSQL

AI:

* Ollama (local LLM, e.g. llama3 or mistral)

Data Sources:

* yfinance (stock data)
* Reddit (PRAW API or scraping)
* News (Google News scraping)

---

## 🔷 AUTHENTICATION & AUTHORIZATION

### JWT Authentication

Use Django REST Framework SimpleJWT:

* Access Token (short-lived)
* Refresh Token (long-lived)

### API Endpoints:

POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

### User Management (Admin Only):

POST /api/users (create user)
PUT /api/users/{id} (update user)
DELETE /api/users/{id} (delete user)
GET /api/users (list users)

### Permissions:

* Admin:

  * Full access (CRUD users, trading system control)
* Regular User:

  * Read-only access to trades, decisions, dashboard

---

## 🔷 SEEDER REQUIREMENT

Create a seeder script to:

* Create initial admin user
* Set:

  * username
  * email
  * password
  * is_staff = True
  * is_superuser = True

Seeder should run via:

python manage.py seed_data

---

## 🔷 USER CREATION FLOW

When admin creates a user:

1. Generate or accept password
2. Save user in database
3. Send user details via email:

* Username
* Email
* Password

Use Django email backend (SMTP or console for development).

---

## 🔷 AGENT ARCHITECTURE

Create the following agents:

1. MarketDiscoveryAgent

* Input: list of stocks (NIFTY 50 or predefined)
* Logic:

  * Select top 3–5 stocks based on:

    * volume spike
    * price movement
* Output:
  {
  "symbols": ["INFY", "TCS"]
  }

---

2. DataAggregationAgent

* Collect:

  * price
  * RSI
  * MACD
  * news summary
  * reddit posts summary
* Use sentiment analysis (VADER or simple scoring)

Output:
{
"symbol": "INFY",
"price": 1500,
"rsi": 62,
"macd": "bullish",
"news_summary": "...",
"reddit_summary": "...",
"sentiment_score": 0.65
}

---

3. AIDecisionAgent (USES OLLAMA)

Call Ollama with this prompt:

"You are a professional stock trader.

Given:

* price
* RSI
* MACD
* news summary
* reddit sentiment

Decide:

1. Action: BUY / SELL / HOLD
2. Confidence: 0 to 1
3. Reason: detailed explanation

Rules:

* Avoid risky trades
* Prefer high probability setups

Return ONLY JSON:
{
"action": "...",
"confidence": 0.0,
"reason": "..."
}"

---

4. RiskManagementAgent (CRITICAL)

Rules:

* Reject if confidence < 0.7
* Reject if RSI > 75 (overbought)
* Enforce stop-loss = 2%
* Enforce take-profit = 4%
* Max 3 open trades

This agent can override AI decisions.

---

5. TradeExecutionAgent (Paper Trading)

* If approved:

  * Store BUY trade in DB
* Track:

  * buy_price
  * timestamp
  * reason

---

6. PositionMonitoringAgent (SELL AGENT)

Runs periodically:

Input:

* current price
* profit/loss
* updated sentiment

Call Ollama with:

"You are managing an open stock position.

Given:

* buy price
* current price
* profit %
* sentiment

Decide:
SELL or HOLD
Provide reason and confidence."

---

7. EvaluationAgent

* Compare:

  * entry vs exit
  * max possible profit
* Store performance metrics

---

## 🔷 DATABASE SCHEMA

Table: users

* id
* username
* email
* password
* is_staff
* is_superuser
* created_at

Table: trades

* id
* symbol
* buy_price
* sell_price
* status (OPEN/CLOSED)
* buy_time
* sell_time

Table: decisions_log

* id
* symbol
* action
* confidence
* reason
* agent_type (BUY/SELL)
* timestamp

Table: market_data

* symbol
* price
* rsi
* sentiment
* timestamp

---

## 🔷 BACKEND (DJANGO)

Create:

* models.py for all tables
* JWT authentication setup
* API endpoints:

GET /api/trades
GET /api/portfolio
GET /api/decisions
GET /api/performance

POST /api/run-cycle

Auth endpoints:

POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

User management:

POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}
GET /api/users

Implement services:

* agents/
* llm_service (Ollama integration)
* data_fetchers
* auth_service

---

## 🔷 FRONTEND (REACT)

Create pages:

1. Login Page

* Username/password login
* Store JWT tokens

2. Dashboard

* total profit/loss
* win rate
* active trades

3. Trades Page

* list of trades
* buy/sell details

4. AI Decisions Page

* show:

  * action
  * confidence
  * reason

5. Stock Detail Page

* price chart
* buy/sell markers

6. Sentiment Panel

* news sentiment
* reddit sentiment

7. User Management Page (Admin Only)

* create user
* update user
* delete user

Use charts (Recharts or Chart.js)

---

## 🔷 SCHEDULER

Run system every 5–15 minutes:

* fetch data
* run agents
* store results

---

## 🔷 SAFETY RULES (MANDATORY)

* Always apply stop-loss (2%)
* Always apply take-profit (4%)
* AI cannot override risk rules
* Limit trades to 3 max
* Paper trading only

---

## 🔷 OLLAMA INTEGRATION

Use:
POST http://localhost:11434/api/generate

Model:

* llama3 or mistral

---

## 🔷 OUTPUT REQUIREMENT

Generate:

* Full Django backend code
* Full React frontend code
* Agent implementations
* API integration
* JWT authentication system
* User management system
* Seeder script
* Email notification system
* Clean folder structure

Ensure code is production-ready and modular.

---

## END OF SPEC
