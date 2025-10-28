/**
 * CollapsibleCard Component
 *
 * Reusable collapsible container for workspace sections.
 * Includes smooth animations and accessible keyboard controls.
 *
 * Story 3.8 AC#7: Collapsible sections
 *
 * @module components/workspace/CollapsibleCard
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CollapsibleCardProps {
  /**
   * Section identifier
   */
  id: string

  /**
   * Card title
   */
  title: string

  /**
   * Optional subtitle or metadata
   */
  subtitle?: string

  /**
   * Whether the card is expanded
   */
  isExpanded: boolean

  /**
   * Callback when toggle is clicked
   */
  onToggle: (id: string) => void

  /**
   * Card content
   */
  children: React.ReactNode

  /**
   * Optional icon to display in header
   */
  icon?: React.ReactNode

  /**
   * Additional CSS classes for card
   */
  className?: string

  /**
   * Additional CSS classes for content
   */
  contentClassName?: string
}

/**
 * Collapsible card with smooth animations
 */
export function CollapsibleCard({
  id,
  title,
  subtitle,
  isExpanded,
  onToggle,
  children,
  icon,
  className,
  contentClassName,
}: CollapsibleCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader
        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={() => onToggle(id)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`${id}-content`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle(id)
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && <div className="text-gray-600 dark:text-gray-400">{icon}</div>}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {subtitle && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          )}
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`${id}-content`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent className={cn('border-t', contentClassName)}>{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
