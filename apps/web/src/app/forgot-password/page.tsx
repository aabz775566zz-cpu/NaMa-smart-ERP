'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, toast } from '@erp-smart/ui';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useForgotPassword } from '@/features/auth';
import { AuthShell } from '@/features/auth/components/auth-shell';

export default function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPassword();
  const [email, setEmail] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    forgotPasswordMutation.mutate(
      { email },
      {
        onError: (error) => {
          toast({ variant: 'destructive', title: 'Something went wrong', description: error.message });
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
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists for {email}, we&apos;ve sent a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Back to sign in</Link>
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
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" htmlFor="forgot-email" required>
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
              {forgotPasswordMutation.isPending ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
