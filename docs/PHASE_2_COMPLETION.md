# Phase 2 Completion Report — Identity & Access Management

**Status:** Complete
**Date:** 2026-07-12
**Scope:** IAM only (no business modules — those are Phase 3)

---

## 1. Implemented Features

### Authentication
- Email/password registration — creates a `User`, a `Company`, and an `OWNER` `Membership` in a single transaction.
- Login via Passport local strategy (email + password), argon2id password verification.
- JWT access tokens (15 min TTL) carrying `sub`, `email`, `companyId`, `roleId`, `roleKey`, `permissions`, `platformRole`.
- Refresh tokens: opaque random token, httpOnly/Secure/SameSite=Strict cookie, hashed at rest, rotated on every use.
- Refresh-token reuse detection: presenting an already-rotated-out token revokes **all** active sessions for that user.
- Logout (revokes the current refresh token).
- Email verification (token + expiry on `User`; delivery is a logged stub, see §6).
- Forgot/reset password (single-use, 1-hour token; resets revoke all existing refresh tokens; response is identical whether or not the email exists, to prevent enumeration).
- Invite-teammate / accept-invite flow (invite creates or reuses a `User`, issues an accept token via the same reset-token mechanism, activates the `Membership` on acceptance).
- Multi-company switch (`/auth/switch-company`) — re-scopes the access token to another active `Membership` for the same user.

### Users
- Get/update own profile.
- Change password (revokes all other sessions on success).

### Companies
- Get/update company profile.
- List members (with role).
- Invite member (role-restricted to MANAGER/ACCOUNTANT/EMPLOYEE — OWNER cannot be assigned this way).
- Change a member's role.
- Remove a member (the OWNER membership is protected from removal).

### Roles & Permissions
- Four seeded, global system roles: `OWNER`, `MANAGER`, `ACCOUNTANT`, `EMPLOYEE`.
- Fine-grained module × action permission grid (8 modules × 5 actions = 40 permissions), enforced per-endpoint via `PermissionsGuard` + `@RequirePermission()`.
- Read-only `/roles` endpoint listing system roles and their permissions.
- `SUPER_ADMIN` platform role on `User` (separate axis from company roles) — guard (`SuperAdminGuard`) is wired in; no platform-admin endpoints exist yet (reserved for future platform tooling).

### Security
- Argon2id password hashing.
- Global `JwtAuthGuard` (deny-by-default; `@Public()` opt-out for auth/health endpoints).
- Per-endpoint `PermissionsGuard` reading permissions embedded in the JWT.
- Rate limiting (`@nestjs/throttler`): 5 req/min on register, login, forgot-password; 100 req/min global default.
- Global `ValidationPipe` (whitelist + forbid unknown properties + transform).
- Global exception filter — strips stack traces from API responses, logs server-side.
- `ActivityLog` audit trail: `USER_REGISTERED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `PASSWORD_RESET`, `PASSWORD_CHANGED`, `INVITE_ACCEPTED`, `MEMBER_INVITED`, `MEMBER_ROLE_CHANGED`, `MEMBER_REMOVED`.
- CORS locked to known local origins, `credentials: true` for the refresh cookie.

---

## 2. Database Schema Summary

Defined in `database/prisma/schema.prisma`, applied via migration `20260712020234_iam_phase2`.

| Model | Purpose | Key fields |
|---|---|---|
| `User` | Global identity, not tenant-scoped | `email` (unique), `passwordHash` (nullable — null until an invited user accepts), `platformRole`, verification/reset token fields |
| `Company` | The tenant | `name`, `businessType`, `country`, `currency`, `subscriptionPlan/Status` |
| `Membership` | Join: which user belongs to which company, with which role | unique on `(userId, companyId)`, `status: INVITED\|ACTIVE\|SUSPENDED` |
| `Role` | Mostly-fixed system roles, extensible later | `companyId` nullable — `null` = global system template shared by all companies; unique on `(companyId, key)` |
| `Permission` | Static reference data | unique on `(module, action)` |
| `RolePermission` | Join: role ↔ permission grid | composite PK `(roleId, permissionId)` |
| `RefreshToken` | Session tokens | `tokenHash` (unique, never stores raw token), `revokedAt`, `expiresAt` |
| `ActivityLog` | Audit trail | nullable `userId`/`companyId`, `action`, `metadata` (JSON) |

**Enums:** `UserStatus` (ACTIVE/SUSPENDED), `PlatformRole` (USER/SUPER_ADMIN), `MembershipStatus` (INVITED/ACTIVE/SUSPENDED).

**Design notes / deviations from the original docs sketch:**
- Added `Membership` as a proper join table instead of a flat `company_id` on `User`, so one user can belong to multiple companies later without a schema migration (MVP behavior — one user, one company at signup — is unchanged).
- System roles are **global, shared rows** (`companyId = null`), not cloned per company. Every company's `OWNER`/`MANAGER`/`ACCOUNTANT`/`EMPLOYEE` membership points at the same four `Role` rows.
- `passwordHash` is nullable to represent an invited-but-not-yet-activated user (they get a `Membership(status=INVITED)` and set their password via `/auth/accept-invite`).
- No `ownerId` column on `Company` — the owner is derived from the `Membership` with role `OWNER`, avoiding a second source of truth.

---

## 3. API Modules Created

| Module | Controller | Endpoints |
|---|---|---|
| Auth | `AuthController` (`/auth`) | `POST /register`, `POST /login`, `GET /verify-email`, `POST /forgot-password`, `POST /reset-password`, `POST /accept-invite`, `POST /refresh`, `POST /logout`, `POST /switch-company`, `GET /me` |
| Users | `UsersController` (`/users`) | `GET /me`, `PATCH /me`, `POST /me/change-password` |
| Companies | `CompaniesController` (`/companies`) | `GET /me`, `PATCH /me`, `GET /me/members`, `POST /me/invitations`, `PATCH /me/members/:membershipId`, `DELETE /me/members/:membershipId` |
| Roles | `RolesController` (`/roles`) | `GET /` |

Supporting infrastructure: `PrismaModule` (existing), `MailerModule` (new — logging stub for email delivery), guards/decorators under `apps/api/src/common`.

---

## 4. Security Tests Passed

All verified live against a running instance with a real Postgres database (not mocked):

| Test | Result |
|---|---|
| Register → OWNER membership with all 40 permissions | ✅ 201 |
| `/auth/me` returns correct JWT-derived identity | ✅ 200 |
| Protected route without a token | ✅ 401 |
| Protected route with a valid token | ✅ 200 |
| Refresh rotates the token and issues a new one | ✅ 200 |
| Reusing an already-rotated-out refresh token | ✅ 401 (rejected) |
| Reuse detection revokes the entire session, including the token issued in the same breach event | ✅ 401 |
| Login with correct password | ✅ 200 |
| Login with wrong password | ✅ 401 |
| Duplicate registration (same email) | ✅ 409 |
| Logout revokes the refresh token; subsequent refresh fails | ✅ 401 |
| Invite → accept-invite → new user can log in with EMPLOYEE role and exactly the 6 seeded permissions | ✅ |
| EMPLOYEE denied on `USERS:CREATE` (inviting members) | ✅ 403 |
| EMPLOYEE denied on `SETTINGS:UPDATE` (editing company) | ✅ 403 |
| OWNER membership cannot be removed | ✅ 403 |
| Full workspace typecheck (`turbo run lint`, all 6 packages) | ✅ clean |

Two defects were found and fixed during this verification pass (not left as known issues):
1. Prisma rejects an explicit `null` inside a compound-unique `where` clause for a nullable column — global-role lookups were switched from `upsert`/`findUnique` to `findFirst`.
2. `/health` was not marked `@Public()`, so the global `JwtAuthGuard` blocked infrastructure health checks — fixed.

---

## 5. Current Project Status

- **Phase 1:** Complete — monorepo foundation (NestJS API, Next.js web/marketing, Prisma connection, shared packages).
- **Phase 2:** Complete — Identity & Access Management, as detailed above. Migration applied and seeded in the local dev database; full auth/permission flow smoke-tested end-to-end.
- **Out of scope for Phase 2 (deliberately deferred):**
  - Real transactional email delivery — `MailerService` currently logs instead of calling Resend (`RESEND_API_KEY` is blank in `.env.example`); swapping in the real call is a one-function change.
  - Prisma tenant-isolation query middleware — no business (tenant-scoped) table exists yet to enforce it against; wiring it in now against `Membership` would break the legitimate cross-company queries needed for the company switcher. Scheduled for Phase 3.
  - No business modules (`Customer`, `Product`, `Sale`, `Invoice`, etc.) — schema and API surface are IAM-only.
  - No platform-admin UI/endpoints for `SUPER_ADMIN` — only the schema field and `SuperAdminGuard` exist, reserved for later platform tooling.

---

## 6. Recommended Next Steps for Phase 3

1. **Business schema:** add `Customer`, `Product`, `Category`, `Inventory Movement`, `Sale`, `Sale Item`, `Invoice` models, each carrying `companyId` per the multi-tenant rule already established.
2. **Tenant isolation enforcement:** implement the Prisma query guard/extension against the new business tables (the hook point discussed in Phase 2 but intentionally left unpopulated).
3. **Wire real email delivery:** replace `MailerService.send()`'s stub body with an actual Resend call once `RESEND_API_KEY` is set; no call-site changes needed.
4. **Frontend integration:** build the `apps/web` login/register/invite-accept flows against the Phase 2 API, using the shared `JwtPayload`/`AuthUser` types from `packages/types`.
5. **Business-module permissions:** extend the permission checks on new endpoints using the existing `PermissionsGuard` + `@RequirePermission()` pattern — the module/action grid (`PRODUCTS`, `CUSTOMERS`, `SALES`, `INVENTORY`, `INVOICES`, `REPORTS`) is already seeded and ready to be enforced.
6. **Company onboarding polish:** subscription plan selection/limits, company logo upload (Cloudinary env vars are already reserved), and a real "Manage team" screen backed by the existing `/companies/me/members*` endpoints.
7. **Testing:** convert the ad hoc smoke tests run during Phase 2 verification into a proper e2e test suite (`apps/api` currently has no automated tests).
