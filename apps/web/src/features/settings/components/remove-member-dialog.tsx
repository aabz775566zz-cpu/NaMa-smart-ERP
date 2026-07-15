'use client';

import type { Member } from '@erp-smart/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@erp-smart/ui';

import { useLocale } from '@/lib/locale/locale-context';

import { useRemoveMember } from '../hooks';

export function RemoveMemberDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const removeMutation = useRemoveMember();
  const { messages } = useLocale();
  const t = messages.settings;

  function handleConfirm() {
    if (!member) return;
    removeMutation.mutate(member.id, {
      onSuccess: () => {
        toast({ title: t.memberRemoved });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: t.removeMemberFailed, description: err.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.removeMemberTitle}</DialogTitle>
          <DialogDescription>
            {member ? t.removeMemberDescription.replace('{{name}}', member.user.fullName) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {messages.common.cancel}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={removeMutation.isPending}>
            {removeMutation.isPending ? t.removing : t.remove}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
