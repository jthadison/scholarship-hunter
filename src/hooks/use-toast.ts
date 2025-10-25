/**
 * Simple toast hook for notifications
 */

export interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Simple console-based toast for now (can be upgraded to UI toasts later)
export function toast({ title, description, variant }: Toast) {
  if (variant === 'destructive') {
    console.error(`[Toast Error] ${title}: ${description}`)
  } else {
    console.log(`[Toast] ${title}: ${description}`)
  }
}

export function useToast() {
  return { toast }
}
