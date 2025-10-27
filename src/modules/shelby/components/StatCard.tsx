/**
 * StatCard Component
 *
 * Reusable card for displaying quick statistics on Shelby dashboard.
 * Supports custom icons and styling.
 *
 * @component
 */

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <Card className={cn('p-6 transition-shadow hover:shadow-lg', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && <div className="text-muted-foreground opacity-50 ml-4">{icon}</div>}
      </div>
    </Card>
  )
}
