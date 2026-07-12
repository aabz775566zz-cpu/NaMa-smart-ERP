import type { UserProfile } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// UsersController has no permission requirement on any of these — every
// authenticated user manages only their own record, self-scoped by JWT.
export function getProfile() {
  return apiClient.get<UserProfile>('/users/me');
}

export function updateProfile(input: UpdateProfileInput) {
  return apiClient.patch<UserProfile>('/users/me', input);
}

export function changePassword(input: ChangePasswordInput) {
  return apiClient.post<void>('/users/me/change-password', input);
}
