'use client';

import type { AssignableRoleKey, Member } from '@erp-smart/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';

import { useUpdateMemberRole } from '../hooks';

const ASSIGNABLE_ROLES: AssignableRoleKey[] = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE'];

export function ChangeRoleDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateMemberRole();
  const [roleKey, setRoleKey] = useState<AssignableRoleKey>('EMPLOYEE');
  const { messages } = useLocale();
  const t = messages.settings;
  const roleLabels = useRoleLabels();

  useEffect(() => {
    if (open && member && member.role.key !== 'OWNER') {
      setRoleKey(member.role.key);
    }
  }, [open, member]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!member) return;

    updateMutation.mutate(
      { membershipId: member.id, input: { roleKey } },
      {
        onSuccess: () => {
          toast({ title: t.roleUpdated });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ variant: 'destructive', title: t.updateRoleFailed, description: err.message });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.changeRoleTitle}</DialogTitle>
          <DialogDescription>
            {member ? t.changeRoleDescription.replace('{{name}}', member.user.fullName) : null}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t.roleHeader} htmlFor="change-role">
            <Select value={roleKey} onValueChange={(value) => setRoleKey(value as AssignableRoleKey)}>
              <SelectTrigger id="change-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {roleLabels[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? messages.common.saving : messages.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
