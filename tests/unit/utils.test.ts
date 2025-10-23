import { describe, it, expect } from 'vitest'
import { cn } from '@/shared/lib/utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500')
    expect(result).toContain('text-red-500')
    expect(result).toContain('bg-blue-500')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', false && 'hidden', true && 'visible')
    expect(result).toContain('base-class')
    expect(result).toContain('visible')
    expect(result).not.toContain('hidden')
  })

  it('merges conflicting Tailwind classes correctly', () => {
    const result = cn('px-2', 'px-4')
    // Should only include px-4 (twMerge functionality)
    expect(result).toBe('px-4')
  })
})
