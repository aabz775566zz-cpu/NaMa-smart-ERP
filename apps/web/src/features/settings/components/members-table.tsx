'use client';

import type { Member, MembershipStatus } from '@erp-smart/types';
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@erp-smart/ui';
import { MoreHorizontal, ShieldCheck, UserMinus } from 'lucide-react';

import { useHasPermission } from '@/lib/store';

const STATUS_VARIANT: Record<MembershipStatus, 'success' | 'secondary' | 'destructive'> = {
  ACTIVE: 'success',
  INVITED: 'secondary',
  SUSPENDED: 'destructive',
};

export function MembersTable({
  members,
  onChangeRole,
  onRemove,
}: {
  members: Member[];
  onChangeRole: (member: Member) => void;
  onRemove: (member: Member) => void;
}) {
  const canUpdateRole = useHasPermission('USERS:UPDATE');
  const canRemove = useHasPermission('USERS:DELETE');
  const canAct = canUpdateRole || canRemove;

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            {canAct ? <TableHead className="text-end">Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            // The backend rejects both role changes and removal for the
            // OWNER membership (see CompaniesService.removeMember()) — hide
            // the actions entirely for that row rather than let them fail.
            const isOwner = member.role.key === 'OWNER';
            const initials = member.user.fullName.slice(0, 2).toUpperCase();
            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{member.user.fullName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{member.user.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{member.role.name}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[member.status]}>{member.status}</Badge>
                </TableCell>
                {canAct ? (
                  <TableCell className="text-end">
                    {isOwner ? null : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canUpdateRole ? (
                            <DropdownMenuItem onClick={() => onChangeRole(member)}>
                              <ShieldCheck />
                              Change role
                            </DropdownMenuItem>
                          ) : null}
                          {canRemove ? (
                            <DropdownMenuItem
                              onClick={() => onRemove(member)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserMinus />
                              Remove
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
