'use client';

import type { AssignableRoleKey } from '@erp-smart/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@erp-smart/ui';
import { useEffect, useState } from 'react';

import { useInviteMember, useRoles } from '../hooks';

// Matches the backend's InvitableRoleKey exactly (invite-member.dto.ts) —
// OWNER is deliberately not invitable.
const ASSIGNABLE_ROLES: AssignableRoleKey[] = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: roles } = useRoles();
  const inviteMutation = useInviteMember();

  const [email, setEmail] = useState('');
  const [roleKey, setRoleKey] = useState<AssignableRoleKey>('EMPLOYEE');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmail('');
      setRoleKey('EMPLOYEE');
      setError(null);
    }
  }, [open]);

  const roleNameByKey = new Map((roles ?? []).map((role) => [role.key, role.name]));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);

    inviteMutation.mutate(
      { email: trimmedEmail, roleKey },
      {
        onSuccess: () => {
          toast({ title: 'Invitation sent' });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ variant: 'destructive', title: 'Failed to invite member', description: err.message });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>They&apos;ll receive an email with a link to join your company.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Email" htmlFor="invite-email" required error={error ?? undefined}>
            <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>
          <FormField label="Role" htmlFor="invite-role">
            <Select value={roleKey} onValueChange={(value) => setRoleKey(value as AssignableRoleKey)}>
              <SelectTrigger id="invite-role">
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
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
