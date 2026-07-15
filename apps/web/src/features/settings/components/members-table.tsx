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
  toast,
} from '@erp-smart/ui';
import { MailPlus, MoreHorizontal, ShieldCheck, UserMinus } from 'lucide-react';

import { useResendInvite } from '@/features/settings/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';
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
  const canInvite = useHasPermission('USERS:CREATE');
  const canAct = canUpdateRole || canRemove || canInvite;
  const resendInviteMutation = useResendInvite();
  const { messages } = useLocale();
  const t = messages.settings;
  const roleLabels = useRoleLabels();
  const STATUS_LABELS: Record<MembershipStatus, string> = {
    ACTIVE: t.statusActive,
    INVITED: t.statusInvited,
    SUSPENDED: t.statusSuspended,
  };

  function handleResendInvite(member: Member) {
    resendInviteMutation.mutate(member.id, {
      onSuccess: () => {
        toast({ title: t.invitationResent, description: t.invitationResentDescription.replace('{{email}}', member.user.email) });
      },
      onError: (error: Error) => {
        toast({ variant: 'destructive', title: t.resendInviteFailed, description: error.message });
      },
    });
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.memberHeader}</TableHead>
            <TableHead>{messages.common.email}</TableHead>
            <TableHead>{t.roleHeader}</TableHead>
            <TableHead>{messages.common.status}</TableHead>
            {canAct ? <TableHead className="text-end">{messages.common.actions}</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            // The backend rejects both role changes and removal for the
            // OWNER membership (see CompaniesService.removeMember()) — hide
            // the actions entirely for that row rather than let them fail.
            const isOwner = member.role.key === 'OWNER';
            const isInvited = member.status === 'INVITED';
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
                  <Badge variant="outline">{roleLabels[member.role.key]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[member.status]}>{STATUS_LABELS[member.status]}</Badge>
                </TableCell>
                {canAct ? (
                  <TableCell className="text-end">
                    {isOwner ? null : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{messages.common.openActions}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canInvite && isInvited ? (
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(member)}
                              disabled={resendInviteMutation.isPending}
                            >
                              <MailPlus />
                              {t.resendInvitation}
                            </DropdownMenuItem>
                          ) : null}
                          {canUpdateRole ? (
                            <DropdownMenuItem onClick={() => onChangeRole(member)}>
                              <ShieldCheck />
                              {t.changeRole}
                            </DropdownMenuItem>
                          ) : null}
                          {canRemove ? (
                            <DropdownMenuItem
                              onClick={() => onRemove(member)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserMinus />
                              {t.remove}
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
