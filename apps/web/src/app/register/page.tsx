'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, FormField, Input, toast } from '@erp-smart/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useRegister } from '@/features/auth';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useLocale } from '@/lib/locale/locale-context';

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const { messages } = useLocale();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    registerMutation.mutate(
      { fullName, companyName, email, password },
      {
        onSuccess: () => router.push('/dashboard'),
        onError: (error) => {
          toast({ variant: 'destructive', title: 'Registration failed', description: error.message });
        },
      },
    );
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{messages.auth.registerTitle}</CardTitle>
          <CardDescription>{messages.auth.registerDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={messages.auth.fullNameLabel} htmlFor="fullName" required>
              <Input id="fullName" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </FormField>
            <FormField label={messages.auth.companyNameLabel} htmlFor="companyName" required>
              <Input
                id="companyName"
                required
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </FormField>
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
            <FormField label={messages.auth.passwordLabel} htmlFor="password" description={messages.auth.passwordHint} required>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? messages.auth.creatingAccount : messages.auth.createAccountButton}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {messages.auth.alreadyHaveAccount}{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {messages.auth.signInLink}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
