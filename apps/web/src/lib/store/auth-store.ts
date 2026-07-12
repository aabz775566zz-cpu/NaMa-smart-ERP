import type { JwtPayload, PermissionKey } from '@erp-smart/types';
import { create } from 'zustand';

// Client-side session state ONLY — accessToken, the decoded user/permission
// payload, and auth status. No products/sales/reports/AI data ever belongs
// here; that's TanStack Query's job (added when real feature modules start
// consuming the API in later steps). Kept deliberately free of any fetch
// logic itself — this store just holds state and simple synchronous
// mutations; features/auth owns the actual login/register/refresh calls and
// writes their results in here.
type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  accessToken: string | null;
  user: JwtPayload | null;
  status: AuthStatus;
}

interface AuthActions {
  setSession: (accessToken: string, user: JwtPayload) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  status: 'idle',

  setSession: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));

// Permissions/roleKey/companyId are deliberately NOT separate stored fields —
// they already live inside `user` (the JWT payload), and duplicating them as
// top-level store fields would risk the two copies drifting out of sync.
// These are plain derived reads instead.
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

export function usePermissions(): PermissionKey[] {
  return useAuthStore((state) => state.user?.permissions ?? []);
}

export function useHasPermission(permission: PermissionKey): boolean {
  return useAuthStore((state) => state.user?.permissions.includes(permission) ?? false);
}

export function useCompanyId(): string | null {
  return useAuthStore((state) => state.user?.companyId ?? null);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((state) => state.status === 'authenticated');
}
