import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button } from '@/components/common'
import { LogoutIcon, MenuIcon } from '@/components/icons'
import { useAuth } from '@/context/AuthContext'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <MenuIcon />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{user?.username}</p>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <Badge color={isAdmin ? 'blue' : 'gray'}>{isAdmin ? 'Admin' : 'Viewer'}</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          loading={loggingOut}
          leftIcon={<LogoutIcon className="h-4 w-4" />}
        >
          Logout
        </Button>
      </div>
    </header>
  )
}
