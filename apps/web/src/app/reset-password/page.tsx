'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, Skeleton, toast } from '@erp-smart/ui';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { useResetPassword } from '@/features/auth';

type FormErrors = Partial<Record<'password' | 'confirmPassword', string>>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const resetMutation = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>This link is missing its reset token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (password.length < 8) nextErrors.password = 'At least 8 characters.';
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    resetMutation.mutate(
      { token: token as string, password },
      {
        onSuccess: () => {
          toast({ title: 'Password reset', description: 'Sign in with your new password.' });
          router.push('/login');
        },
        onError: (error) => {
          toast({ variant: 'destructive', title: 'Failed to reset password', description: error.message });
        },
      },
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="New password"
            htmlFor="reset-password"
            required
            error={errors.password}
            description="At least 8 characters."
          >
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <FormField label="Confirm new password" htmlFor="reset-confirm-password" required error={errors.confirmPassword}>
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-sm" />}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
