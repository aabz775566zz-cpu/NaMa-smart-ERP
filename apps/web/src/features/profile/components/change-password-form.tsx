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

import { useChangePassword } from '../hooks';

type FormErrors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>>;

export function ChangePasswordForm() {
  const router = useRouter();
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!currentPassword) nextErrors.currentPassword = 'Enter your current password.';
    if (newPassword.length < 8) nextErrors.newPassword = 'At least 8 characters.';
    if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
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
            title: 'Password changed',
            description: 'You have been signed out of every session. Please sign in again.',
          });
          router.push('/login');
        },
        onError: (err) => {
          toast({ variant: 'destructive', title: 'Failed to change password', description: err.message });
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change password</CardTitle>
        <CardDescription>You&apos;ll be signed out of every session after changing your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Current password" htmlFor="current-password" required error={errors.currentPassword}>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </FormField>
          <FormField
            label="New password"
            htmlFor="new-password"
            required
            error={errors.newPassword}
            description="At least 8 characters."
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </FormField>
          <FormField label="Confirm new password" htmlFor="confirm-password" required error={errors.confirmPassword}>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </FormField>
          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? 'Changing…' : 'Change password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
