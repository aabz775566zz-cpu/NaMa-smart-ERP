'use client';

import type { Member } from '@erp-smart/types';
import { Button, EmptyState, Skeleton } from '@erp-smart/ui';
import { Plus, ShieldAlert, Users } from 'lucide-react';
import { useState } from 'react';

import { ChangeRoleDialog } from '@/features/settings/components/change-role-dialog';
import { InviteMemberDialog } from '@/features/settings/components/invite-member-dialog';
import { MembersTable } from '@/features/settings/components/members-table';
import { RemoveMemberDialog } from '@/features/settings/components/remove-member-dialog';
import { useMembers } from '@/features/settings/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

export default function SettingsUsersPage() {
  const permissions = usePermissions();
  const canRead = permissions.includes('USERS:READ');
  const canInvite = permissions.includes('USERS:CREATE');
  const { messages } = useLocale();
  const t = messages.settings;

  const membersQuery = useMembers({ enabled: canRead });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [changingRoleMember, setChangingRoleMember] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  if (!canRead) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={<ShieldAlert />}
          title={messages.common.accessDeniedTitle}
          description={messages.common.accessDeniedDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{messages.nav.users}</h1>
          <p className="text-sm text-muted-foreground">{messages.modules.users.description}</p>
        </div>
        {canInvite ? (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus />
            {t.inviteMember}
          </Button>
        ) : null}
      </div>

      {membersQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : membersQuery.isError ? (
        <EmptyState
          title={t.couldNotLoadMembers}
          description={membersQuery.error instanceof Error ? membersQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : !membersQuery.data || membersQuery.data.length === 0 ? (
        <EmptyState icon={<Users />} title={t.noMembersYet} description={t.inviteTeamToStart} />
      ) : (
        <MembersTable members={membersQuery.data} onChangeRole={setChangingRoleMember} onRemove={setRemovingMember} />
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <ChangeRoleDialog
        member={changingRoleMember}
        open={Boolean(changingRoleMember)}
        onOpenChange={(open) => !open && setChangingRoleMember(null)}
      />
      <RemoveMemberDialog
        member={removingMember}
        open={Boolean(removingMember)}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      />
    </div>
  );
}
