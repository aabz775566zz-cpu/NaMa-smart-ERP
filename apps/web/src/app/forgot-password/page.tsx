'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, toast } from '@erp-smart/ui';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useForgotPassword } from '@/features/auth';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useLocale } from '@/lib/locale/locale-context';

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword();
  const [email, setEmail] = useState('');
  const { messages } = useLocale();
  const t = messages.auth;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    forgotPasswordMutation.mutate(
      { email },
      {
        onError: (error) => {
          toast({ variant: 'destructive', title: messages.common.error, description: error.message });
        },
      },
    );
  }

  // Always shows the same success state regardless of whether the account
  // exists — AuthService.forgotPassword() is deliberately silent either way
  // (it never reveals account existence), so the UI must not differentiate.
  if (forgotPasswordMutation.isSuccess) {
    return (
      <AuthShell>
        <Card className="w-full max-w-sm">
          <CardHeader className="items-center text-center">
            <Mail className="h-10 w-10 text-primary" />
            <CardTitle>{t.checkYourEmail}</CardTitle>
            <CardDescription>{t.checkYourEmailDescription.replace('{{email}}', email)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">{t.backToSignIn}</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t.forgotPasswordTitle}</CardTitle>
          <CardDescription>{t.forgotPasswordDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={t.emailLabel} htmlFor="forgot-email" required>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending ? t.sending : t.sendResetLink}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {t.backToSignIn}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
