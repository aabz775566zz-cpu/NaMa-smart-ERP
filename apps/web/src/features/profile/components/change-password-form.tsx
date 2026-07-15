'use client';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  toast,
} from '@erp-smart/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useLocale } from '@/lib/locale/locale-context';

import { useChangePassword } from '../hooks';

type FormErrors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>>;

export function ChangePasswordForm() {
  const router = useRouter();
  const changePasswordMutation = useChangePassword();
  const { messages } = useLocale();
  const t = messages.profile;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!currentPassword) nextErrors.currentPassword = t.currentPasswordRequired;
    if (newPassword.length < 8) nextErrors.newPassword = t.newPasswordHint;
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = t.passwordsDoNotMatch;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast({
            title: t.passwordChanged,
            description: t.passwordChangedDescription,
          });
          router.push('/login');
        },
        onError: (err) => {
          toast({ variant: 'destructive', title: t.changePasswordFailed, description: err.message });
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.changePasswordTitle}</CardTitle>
        <CardDescription>{t.changePasswordDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t.currentPassword} htmlFor="current-password" required error={errors.currentPassword}>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </FormField>
          <FormField
            label={t.newPassword}
            htmlFor="new-password"
            required
            error={errors.newPassword}
            description={t.newPasswordHint}
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </FormField>
          <FormField label={t.confirmNewPassword} htmlFor="confirm-password" required error={errors.confirmPassword}>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? t.changing : t.changePasswordButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
