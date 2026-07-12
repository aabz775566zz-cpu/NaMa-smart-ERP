'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, toast } from '@erp-smart/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useLogin } from '@/features/auth';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useLocale } from '@/lib/locale/locale-context';

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const { messages } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: () => router.push('/dashboard'),
        onError: (error) => {
          toast({ variant: 'destructive', title: 'Login failed', description: error.message });
        },
      },
    );
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{messages.auth.loginTitle}</CardTitle>
          <CardDescription>{messages.auth.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={messages.auth.emailLabel} htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormField>
            <FormField label={messages.auth.passwordLabel} htmlFor="password" required>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
            <div className="text-end">
              <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                {messages.auth.forgotPassword}
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? messages.auth.signingIn : messages.auth.signInButton}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {messages.auth.noAccount}{' '}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              {messages.auth.registerLink}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
