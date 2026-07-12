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

import { useRoles, useUpdateMemberRole } from '../hooks';

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
  const { data: roles } = useRoles();
  const updateMutation = useUpdateMemberRole();
  const [roleKey, setRoleKey] = useState<AssignableRoleKey>('EMPLOYEE');

  useEffect(() => {
    if (open && member && member.role.key !== 'OWNER') {
      setRoleKey(member.role.key);
    }
  }, [open, member]);

  const roleNameByKey = new Map((roles ?? []).map((role) => [role.key, role.name]));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!member) return;

    updateMutation.mutate(
      { membershipId: member.id, input: { roleKey } },
      {
        onSuccess: () => {
          toast({ title: 'Role updated' });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ variant: 'destructive', title: 'Failed to update role', description: err.message });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>{member ? `Update the role for ${member.user.fullName}.` : null}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Role" htmlFor="change-role">
            <Select value={roleKey} onValueChange={(value) => setRoleKey(value as AssignableRoleKey)}>
              <SelectTrigger id="change-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {roleNameByKey.get(key) ?? key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
