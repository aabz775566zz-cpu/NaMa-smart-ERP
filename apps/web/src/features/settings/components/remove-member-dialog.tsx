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

  function handleConfirm() {
    if (!member) return;
    removeMutation.mutate(member.id, {
      onSuccess: () => {
        toast({ title: 'Member removed' });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ variant: 'destructive', title: 'Failed to remove member', description: err.message });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            {member
              ? `This will remove ${member.user.fullName} from your company. They will lose access immediately.`
              : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={removeMutation.isPending}>
            {removeMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
