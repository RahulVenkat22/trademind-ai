import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TradesPage } from '@/pages/TradesPage'
import { DecisionsPage } from '@/pages/DecisionsPage'
import { StockDetailPage } from '@/pages/StockDetailPage'
import { SentimentPage } from '@/pages/SentimentPage'
import { UserManagementPage } from '@/pages/UserManagementPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated area */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trades" element={<TradesPage />} />
          <Route path="/decisions" element={<DecisionsPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="/stocks/:symbol" element={<StockDetailPage />} />

          {/* Admin-only area */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
