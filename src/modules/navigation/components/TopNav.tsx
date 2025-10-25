'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/components/ui/sheet'
import { MobileNav } from './MobileNav'
import { UserMenu } from './UserMenu'

interface TopNavProps {
  userName?: string
  userEmail?: string
}

export function TopNav({ userName, userEmail }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Mobile Menu Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <MobileNav />
          </SheetContent>
        </Sheet>

        {/* Spacer for mobile, empty on desktop */}
        <div className="flex-1 lg:hidden" />

        {/* User Menu */}
        <UserMenu userName={userName} userEmail={userEmail} />
      </div>
    </header>
  )
}
