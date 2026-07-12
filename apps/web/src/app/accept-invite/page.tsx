'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, Skeleton, toast } from '@erp-smart/ui';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { useAcceptInvite } from '@/features/auth';
import { AuthShell } from '@/features/auth/components/auth-shell';

type FormErrors = Partial<Record<'password' | 'confirmPassword', string>>;

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const acceptMutation = useAcceptInvite();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  if (!token) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <XCircle className="h-10 w-10 text-destructive" />
          <CardTitle>Invalid invitation link</CardTitle>
          <CardDescription>This link is missing its invitation token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to sign in</Link>
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

    acceptMutation.mutate(
      { token: token as string, password },
      {
        onSuccess: () => {
          toast({ title: 'Invitation accepted', description: 'Sign in to get started.' });
          router.push('/login');
        },
        onError: (error) => {
          toast({ variant: 'destructive', title: 'Failed to accept invitation', description: error.message });
        },
      },
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Accept invitation</CardTitle>
        <CardDescription>Set a password to join your company.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Password"
            htmlFor="invite-password"
            required
            error={errors.password}
            description="At least 8 characters."
          >
            <Input
              id="invite-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
          <FormField label="Confirm password" htmlFor="invite-confirm-password" required error={errors.confirmPassword}>
            <Input
              id="invite-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={acceptMutation.isPending}>
            {acceptMutation.isPending ? 'Joining…' : 'Accept invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AcceptInvitePage() {
  return (
    <AuthShell>
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-sm" />}>
        <AcceptInviteContent />
      </Suspense>
    </AuthShell>
  );
}
