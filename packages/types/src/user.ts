import type { PlatformRole } from './auth';

export type UserStatus = 'ACTIVE' | 'SUSPENDED';

/** Matches GET /users/me and the body of PATCH /users/me —
 * UsersService.toSafeUser() strips passwordHash, emailVerifyToken, and
 * passwordResetToken, but not the two expiry timestamps below. */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  emailVerifyExpiresAt: string | null;
  passwordResetExpiresAt: string | null;
  status: UserStatus;
  platformRole: PlatformRole;
  createdAt: string;
  updatedAt: string;
}
