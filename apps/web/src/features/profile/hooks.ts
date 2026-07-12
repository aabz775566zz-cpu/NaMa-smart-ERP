'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/lib/store';

import * as profileApi from './api';
import type { ChangePasswordInput, UpdateProfileInput } from './api';

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
};

export function useProfile() {
  return useQuery({ queryKey: profileKeys.me(), queryFn: profileApi.getProfile });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.updateProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

/** Backend revokes every refresh token for this user on success
 * (UsersService.changePassword()), so the current session's refresh cookie
 * dies too — clear the local session immediately, same as useLogout, rather
 * than let the next silent refresh fail unexpectedly. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => profileApi.changePassword(input),
    onSuccess: () => {
      useAuthStore.getState().clearSession();
    },
  });
}
