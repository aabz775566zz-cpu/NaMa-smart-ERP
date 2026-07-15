'use client';

import { Button, toast } from '@erp-smart/ui';
import { Mail } from 'lucide-react';
import { useState } from 'react';

import { useResendVerification } from '@/features/auth';
import { useProfile } from '@/features/profile/hooks';
import { useLocale } from '@/lib/locale/locale-context';

/**
 * Shown app-wide (mounted in DashboardShell) whenever the current user's
 * email isn't verified yet. Verification isn't a login gate in this product
 * — it's a trust signal — so this stays a dismissible-feeling banner, not a
 * blocking screen. `sent` is local/per-mount by design: re-showing "Resend"
 * after a refresh is fine, since the backend resend is itself idempotent
 * and safely no-ops once the user does verify.
 *
 * Hidden entirely outside production: the dev API has no RESEND_API_KEY
 * configured, so verification emails are only ever logged to the API
 * console, never actually delivered — nagging every local/dev user to check
 * an email that will never arrive isn't useful. Production keeps this
 * banner exactly as before.
 */
export function VerificationBanner() {
  const { data: profile } = useProfile();
  const resendMutation = useResendVerification();
  const [sent, setSent] = useState(false);
  const { messages } = useLocale();
  const t = messages.dashboard;

  if (process.env.NODE_ENV !== 'production') return null;
  if (!profile || profile.isEmailVerified) return null;

  const email = profile.email;

  function handleResend() {
    resendMutation.mutate(undefined, {
      onSuccess: (result) => {
        setSent(true);
        toast({
          title: result.alreadyVerified ? t.alreadyVerified : t.verificationEmailSent,
          description: result.alreadyVerified ? t.alreadyVerifiedDescription : t.checkEmailForLink.replace('{{email}}', email),
        });
      },
      onError: (error: Error) => {
        toast({ variant: 'destructive', title: t.resendFailed, description: error.message });
      },
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <Mail className="h-4 w-4 shrink-0 text-warning" />
        <span>{t.verifyEmailMessage.replace('{{email}}', profile.email)}</span>
      </div>
      <Button size="sm" variant="outline" onClick={handleResend} disabled={resendMutation.isPending || sent}>
        {resendMutation.isPending ? t.sending : sent ? t.sent : t.resendVerificationEmail}
      </Button>
    </div>
  );
}
