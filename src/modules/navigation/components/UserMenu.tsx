'use client'

import { User, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { SignOutButton } from '@clerk/nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'

interface UserMenuProps {
  userName?: string
  userEmail?: string
}

export function UserMenu({ userName = 'Student', userEmail }: UserMenuProps) {
  // Get initials for avatar
  const initials = userName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'ST'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile/wizard" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>View Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutButton>
            <button className="flex w-full cursor-pointer items-center">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
