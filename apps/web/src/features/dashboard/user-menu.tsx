'use client';

import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@erp-smart/ui';
import { LogOut, User } from 'lucide-react';
import Link from 'next/link';

import { useLogout } from '@/features/auth';
import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';
import { useCurrentUser } from '@/lib/store';

export function UserMenu() {
  const user = useCurrentUser();
  const logoutMutation = useLogout();
  const { messages } = useLocale();
  const roleLabels = useRoleLabels();

  if (!user) return null;

  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="truncate text-sm font-medium">{user.email}</span>
            <Badge variant="secondary" className="w-fit">
              {roleLabels[user.roleKey]}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <User />
            {messages.userMenu.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          <LogOut />
          {logoutMutation.isPending ? messages.userMenu.signingOut : messages.userMenu.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
