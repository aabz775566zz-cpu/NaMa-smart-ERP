'use client';

import type { Member } from '@erp-smart/types';
import { Button, EmptyState, Skeleton } from '@erp-smart/ui';
import { Plus, Users } from 'lucide-react';
import { useState } from 'react';

import { ChangeRoleDialog } from '@/features/settings/components/change-role-dialog';
import { CompanyEditDialog } from '@/features/settings/components/company-edit-dialog';
import { CompanyInfoCard } from '@/features/settings/components/company-info-card';
import { InviteMemberDialog } from '@/features/settings/components/invite-member-dialog';
import { MembersTable } from '@/features/settings/components/members-table';
import { RemoveMemberDialog } from '@/features/settings/components/remove-member-dialog';
import { useCompany, useMembers } from '@/features/settings/hooks';
import { useLocale } from '@/lib/locale/locale-context';
import { usePermissions } from '@/lib/store';

// No page-level permission gate — GET /companies/me has no permission
// requirement, so every authenticated user can view this page. Only the
// Members section (USERS:READ) and individual actions are gated below.
export default function SettingsPage() {
  const permissions = usePermissions();
  const canReadMembers = permissions.includes('USERS:READ');
  const canInvite = permissions.includes('USERS:CREATE');
  const { messages } = useLocale();
  const t = messages.settings;

  const companyQuery = useCompany();
  const membersQuery = useMembers({ enabled: canReadMembers });

  const [editingCompany, setEditingCompany] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changingRoleMember, setChangingRoleMember] = useState<Member | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      {companyQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : companyQuery.isError || !companyQuery.data ? (
        <EmptyState
          title={t.couldNotLoadCompany}
          description={companyQuery.error instanceof Error ? companyQuery.error.message : messages.common.pleaseTryAgain}
        />
      ) : (
        <>
          <CompanyInfoCard company={companyQuery.data} onEdit={() => setEditingCompany(true)} />
          <CompanyEditDialog company={companyQuery.data} open={editingCompany} onOpenChange={setEditingCompany} />
        </>
      )}

      {canReadMembers ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">{t.membersTitle}</h2>
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
        </div>
      ) : null}

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
