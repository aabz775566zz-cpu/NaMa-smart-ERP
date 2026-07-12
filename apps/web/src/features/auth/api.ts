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
