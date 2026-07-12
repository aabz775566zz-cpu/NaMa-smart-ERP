import type { JwtPayload } from '@erp-smart/types';

import { apiClient } from '@/lib/api';

export interface AuthSessionResponse {
  accessToken: string;
  user: JwtPayload;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  businessType?: string;
  country?: string;
  currency?: string;
}

export function login(input: LoginInput) {
  return apiClient.post<AuthSessionResponse>('/auth/login', input);
}

export function register(input: RegisterInput) {
  return apiClient.post<AuthSessionResponse>('/auth/register', input);
}

export function logout() {
  return apiClient.post<void>('/auth/logout');
}

export function refresh() {
  return apiClient.post<AuthSessionResponse>('/auth/refresh');
}

export function getCurrentUser() {
  return apiClient.get<JwtPayload>('/auth/me');
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface AcceptInviteInput {
  token: string;
  password: string;
}

// All four return void on success — none of them issue tokens, so the
// frontend must send the user to /login afterward rather than treat this
// as a sign-in. GET /auth/verify-email takes the token as a query param,
// not a body, matching AuthController's actual route.
export function verifyEmail(token: string) {
  return apiClient.get<void>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}

// Always resolves the same way whether or not the account exists
// (AuthService.forgotPassword() is deliberately silent either way) — the
// caller must show the same message regardless of the outcome to avoid
// leaking account existence.
export function forgotPassword(input: ForgotPasswordInput) {
  return apiClient.post<void>('/auth/forgot-password', input);
}

export function resetPassword(input: ResetPasswordInput) {
  return apiClient.post<void>('/auth/reset-password', input);
}

export function acceptInvite(input: AcceptInviteInput) {
  return apiClient.post<void>('/auth/accept-invite', input);
}

export interface ResendVerificationResponse {
  alreadyVerified: boolean;
}

export function resendVerification() {
  return apiClient.post<ResendVerificationResponse>('/auth/resend-verification');
}
