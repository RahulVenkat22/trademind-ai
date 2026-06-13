import {
  DashboardIcon,
  DecisionsIcon,
  SentimentIcon,
  TradesIcon,
  UsersIcon,
} from '@/components/icons'

export interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  adminOnly?: boolean
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/trades', label: 'Trades', icon: TradesIcon },
  { to: '/decisions', label: 'AI Decisions', icon: DecisionsIcon },
  { to: '/sentiment', label: 'Sentiment', icon: SentimentIcon },
  { to: '/users', label: 'User Management', icon: UsersIcon, adminOnly: true },
]
