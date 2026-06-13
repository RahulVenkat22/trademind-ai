import { Link } from 'react-router-dom'
import { Button } from '@/components/common'

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <p className="text-slate-600">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  )
}
