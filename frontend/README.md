# TradeMind AI — Frontend

React + TypeScript + Vite dashboard for the TradeMind AI paper-trading system.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** for the custom common-component library
- **Recharts** for charts
- **React Router** for routing with JWT-based auth guards
- **Axios** API client with automatic access-token refresh

## Getting started

```bash
cd frontend
cp .env.example .env      # adjust VITE_API_BASE_URL / proxy target if needed
npm install
npm run dev               # http://localhost:5173
```

The dev server proxies `/api` to the Django backend (`http://localhost:8000` by
default — see `vite.config.ts`). Until the backend is running, pages render with
skeleton loaders and friendly empty states.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run typecheck` — type-check only

## Structure

```
src/
├── api/            Axios client (JWT refresh) + per-resource modules
├── components/
│   ├── common/     Reusable UI: Button, Input, Select, Table, Card,
│   │               Badge, Modal, Alert, Spinner, Skeleton, StatCard…
│   └── layout/     Sidebar, Topbar, AppLayout
├── context/        AuthContext (login/logout, role, session bootstrap)
├── hooks/          useApi (loading/error/data fetch helper)
├── lib/            utils (cn, formatters)
├── pages/          Login, Dashboard, Trades, Decisions, StockDetail,
│                   Sentiment, UserManagement, NotFound
└── types/          Shared API/domain types
```

## Auth & roles

- JWT access/refresh tokens are stored in `localStorage` and attached to every
  request. On a 401 the client transparently refreshes the access token once.
- **Admins** (`is_staff`/`is_superuser`) can access User Management and trigger
  trading cycles. **Regular users** get read-only access to everything else.

## API endpoints consumed

`/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`,
`/users` (CRUD), `/trades`, `/portfolio`, `/decisions`, `/performance`,
`/market-data`, `/sentiment`, `/run-cycle`.
