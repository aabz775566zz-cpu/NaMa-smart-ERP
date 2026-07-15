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

import { useLocale } from '@/lib/locale/locale-context';
import { useRoleLabels } from '@/lib/locale/role-labels';

import { useInviteMember } from '../hooks';

// Matches the backend's InvitableRoleKey exactly (invite-member.dto.ts) —
// OWNER is deliberately not invitable.
const ASSIGNABLE_ROLES: AssignableRoleKey[] = ['MANAGER', 'ACCOUNTANT', 'EMPLOYEE'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const inviteMutation = useInviteMember();
  const { messages } = useLocale();
  const t = messages.settings;
  const roleLabels = useRoleLabels();

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError(t.invalidEmail);
      return;
    }
    setError(null);

    inviteMutation.mutate(
      { email: trimmedEmail, roleKey },
      {
        onSuccess: () => {
          toast({ title: t.invitationSent });
          onOpenChange(false);
        },
        onError: (err) => {
          toast({ variant: 'destructive', title: t.inviteFailed, description: err.message });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.inviteMemberTitle}</DialogTitle>
          <DialogDescription>{t.inviteMemberDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={messages.common.email} htmlFor="invite-email" required error={error ?? undefined}>
            <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>
          <FormField label={t.roleHeader} htmlFor="invite-role">
            <Select value={roleKey} onValueChange={(value) => setRoleKey(value as AssignableRoleKey)}>
              <SelectTrigger id="invite-role">
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
            <Button type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? t.sending : t.sendInvite}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
