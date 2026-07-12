'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useAuthStore } from '@/lib/store';

import * as authApi from './api';
import type { AcceptInviteInput, ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from './api';

export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      useAuthStore.getState().setSession(data.accessToken, data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      useAuthStore.getState().setSession(data.accessToken, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Clear client-side session regardless of whether the network call
      // itself succeeded — the user asked to log out, so the local session
      // ends either way; any cached server-state queries are dropped too.
      useAuthStore.getState().clearSession();
      queryClient.clear();
    },
  });
}

// One-shot action, not cacheable data — even though the backend route is a
// GET, it has a side effect (consumes the token) and must only ever run
// once per page load, driven explicitly by the page rather than react-query's
// automatic query lifecycle (refetch-on-focus, etc.).
export function useVerifyEmail() {
  return useMutation({ mutationFn: (token: string) => authApi.verifyEmail(token) });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input) });
}

export function useResetPassword() {
  return useMutation({ mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input) });
}

export function useAcceptInvite() {
  return useMutation({ mutationFn: (input: AcceptInviteInput) => authApi.acceptInvite(input) });
}

export function useResendVerification() {
  return useMutation({ mutationFn: () => authApi.resendVerification() });
}

/** Attempts a silent refresh once on mount, using the httpOnly refresh
 * cookie the browser already holds. This is what lets a hard page reload
 * restore the session without forcing a fresh login — the access token
 * itself only ever lives in memory and is lost on reload otherwise. */
export function useSessionBootstrap() {
  const status = useAuthStore((state) => state.status);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setSession = useAuthStore((state) => state.setSession);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (attempted) return;
    setAttempted(true);
    setStatus('loading');

    authApi
      .refresh()
      .then((data) => setSession(data.accessToken, data.user))
      .catch(() => setStatus('unauthenticated'));
    // A failed refresh here (e.g. a first-time visitor with no refresh
    // cookie at all) is expected and simply lands on 'unauthenticated' —
    // /auth/refresh is excluded from the API client's own 401-retry/redirect
    // handling specifically so this doesn't bounce the user anywhere.
  }, [attempted, setStatus, setSession]);

  return status;
}
