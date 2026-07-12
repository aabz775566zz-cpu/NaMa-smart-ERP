'use client';

import { Button, toast } from '@erp-smart/ui';
import { Mail } from 'lucide-react';
import { useState } from 'react';

import { useResendVerification } from '@/features/auth';
import { useProfile } from '@/features/profile/hooks';

/**
 * Shown app-wide (mounted in DashboardShell) whenever the current user's
 * email isn't verified yet. Verification isn't a login gate in this product
 * — it's a trust signal — so this stays a dismissible-feeling banner, not a
 * blocking screen. `sent` is local/per-mount by design: re-showing "Resend"
 * after a refresh is fine, since the backend resend is itself idempotent
 * and safely no-ops once the user does verify.
 */
export function VerificationBanner() {
  const { data: profile } = useProfile();
  const resendMutation = useResendVerification();
  const [sent, setSent] = useState(false);

  if (!profile || profile.isEmailVerified) return null;

  const email = profile.email;

  function handleResend() {
    resendMutation.mutate(undefined, {
      onSuccess: (result) => {
        setSent(true);
        toast({
          title: result.alreadyVerified ? 'Already verified' : 'Verification email sent',
          description: result.alreadyVerified
            ? 'Your email is already verified — refresh to update this banner.'
            : `Check ${email} for the verification link.`,
        });
      },
      onError: (error: Error) => {
        toast({ variant: 'destructive', title: 'Failed to resend', description: error.message });
      },
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <Mail className="h-4 w-4 shrink-0 text-warning" />
        <span>Please verify your email address ({profile.email}) to secure your account.</span>
      </div>
      <Button size="sm" variant="outline" onClick={handleResend} disabled={resendMutation.isPending || sent}>
        {resendMutation.isPending ? 'Sending…' : sent ? 'Sent' : 'Resend verification email'}
      </Button>
    </div>
  );
}
