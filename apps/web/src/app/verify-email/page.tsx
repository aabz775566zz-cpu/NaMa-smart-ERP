'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@erp-smart/ui';
import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

import { useVerifyEmail } from '@/features/auth';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useLocale } from '@/lib/locale/locale-context';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verifyMutation = useVerifyEmail();
  const attempted = useRef(false);
  const { messages } = useLocale();
  const t = messages.auth;

  useEffect(() => {
    if (attempted.current || !token) return;
    attempted.current = true;
    verifyMutation.mutate(token);
  }, [token, verifyMutation]);

  let content: React.ReactNode;
  if (!token) {
    content = (
      <>
        <XCircle className="h-10 w-10 text-destructive" />
        <CardTitle>{t.invalidVerificationTitle}</CardTitle>
        <CardDescription>{t.invalidVerificationDescription}</CardDescription>
      </>
    );
  } else if (verifyMutation.isError) {
    content = (
      <>
        <XCircle className="h-10 w-10 text-destructive" />
        <CardTitle>{t.verificationFailedTitle}</CardTitle>
        <CardDescription>{verifyMutation.error.message}</CardDescription>
      </>
    );
  } else if (verifyMutation.isSuccess) {
    content = (
      <>
        <CheckCircle2 className="h-10 w-10 text-success" />
        <CardTitle>{t.emailVerifiedTitle}</CardTitle>
        <CardDescription>{t.emailVerifiedDescription}</CardDescription>
      </>
    );
  } else {
    content = (
      <div className="w-full space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">{content}</CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/login">{t.goToSignIn}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Skeleton className="h-48 w-full max-w-sm" />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  );
}
