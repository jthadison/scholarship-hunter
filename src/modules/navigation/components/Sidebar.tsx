'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import {
  LayoutDashboard,
  User,
  GraduationCap,
  FileText,
  Settings,
  HelpCircle,
  Search,
  FolderOpen,
  FileCheck,
} from 'lucide-react'
import { Separator } from '@/shared/components/ui/separator'
import { Badge } from '@/shared/components/ui/badge'

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: 'Profile',
    href: '/profile/wizard',
    icon: User,
    active: true,
  },
  {
    label: 'Shelby - Opportunity Scout',
    href: '/shelby',
    icon: Search,
    active: true,
    badge: 'New',
  },
  {
    label: 'Scholarships',
    href: '/scholarships/search',
    icon: GraduationCap,
    active: true,
  },
  {
    label: 'Applications',
    href: '/applications',
    icon: FileText,
    active: true,
  },
  {
    label: 'Documents',
    href: '/documents',
    icon: FolderOpen,
    active: true,
    badge: 'New',
  },
  {
    label: 'Dexter - Document Manager',
    href: '/dashboard/dexter',
    icon: FileCheck,
    active: true,
    badge: 'New',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    active: true,
  },
  {
    label: 'Help',
    href: '/help',
    icon: HelpCircle,
    active: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex h-full w-64 flex-col fixed left-0 top-0 border-r bg-background">
      {/* Logo/Brand */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Scholarship Hunter</span>
        </Link>
      </div>

      <Separator />

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const isDisabled = !item.active

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive && item.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
              title={item.tooltip}
              aria-disabled={isDisabled}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                }
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.comingSoon && (
                <Badge variant="outline" className="text-xs">
                  Soon
                </Badge>
              )}
              {item.badge && (
                <Badge variant="default" className="text-xs bg-orange-500">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
