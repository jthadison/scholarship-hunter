'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/utils'
import {
  LayoutDashboard,
  User,
  GraduationCap,
  Settings,
} from 'lucide-react'

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
    label: 'Scholarships',
    href: '/scholarships',
    icon: GraduationCap,
    active: false,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    active: true,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const isDisabled = !item.active

          return (
            <Link
              key={item.href}
              href={isDisabled ? '#' : item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-[44px] transition-colors',
                isActive && item.active
                  ? 'text-primary'
                  : 'text-muted-foreground',
                isDisabled && 'opacity-40 cursor-not-allowed'
              )}
              aria-label={item.label}
              aria-disabled={isDisabled}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault()
                }
              }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
