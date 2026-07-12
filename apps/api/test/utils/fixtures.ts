import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { MockMailer } from './test-app';

export interface RegisteredCompany {
  accessToken: string;
  email: string;
  password: string;
  companyId: string;
  userId: string;
  refreshCookie: string;
}

let counter = 0;
function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@example.com`;
}

export function extractRefreshCookie(res: request.Response): string {
  const rawCookies = res.headers['set-cookie'] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
  const refreshCookie = cookies.find((cookie) => cookie.startsWith('refresh_token='));
  if (!refreshCookie) {
    throw new Error('No refresh_token cookie found in response.');
  }
  return refreshCookie.split(';')[0];
}

export function authHeader(accessToken: string): { Authorization: string } {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function registerCompany(
  app: INestApplication,
  overrides: Partial<{ email: string; password: string; fullName: string; companyName: string }> = {},
): Promise<RegisteredCompany> {
  const email = overrides.email ?? uniqueEmail('owner');
  const password = overrides.password ?? 'Password123!';

  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      password,
      fullName: overrides.fullName ?? 'Test Owner',
      companyName: overrides.companyName ?? 'Test Co',
    })
    .expect(201);

  return {
    accessToken: res.body.accessToken,
    email,
    password,
    companyId: res.body.user.companyId,
    userId: res.body.user.sub,
    refreshCookie: extractRefreshCookie(res),
  };
}

// Drives the real invite -> accept-invite -> login sequence (through HTTP,
// not by writing to the DB directly) so tests exercise the same path a real
// invited user goes through, and captures the invite token the same way the
// frontend's mock-mailer contract tests do (from the mocked mailer's own
// call arguments, since no real email is ever sent in tests).
export async function inviteAndActivateMember(
  app: INestApplication,
  mailer: MockMailer,
  owner: RegisteredCompany,
  roleKey: 'MANAGER' | 'ACCOUNTANT' | 'EMPLOYEE',
  emailPrefix: string,
): Promise<RegisteredCompany> {
  const email = uniqueEmail(emailPrefix);

  await request(app.getHttpServer())
    .post('/companies/me/invitations')
    .set(authHeader(owner.accessToken))
    .send({ email, roleKey })
    .expect(201);

  const inviteCall = mailer.sendInviteEmail.mock.calls.find(([to]) => to === email);
  if (!inviteCall) {
    throw new Error(`No invite email captured for ${email}`);
  }
  const [, inviteToken] = inviteCall;
  const password = 'MemberPassword123!';

  await request(app.getHttpServer()).post('/auth/accept-invite').send({ token: inviteToken, password }).expect(200);

  const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(200);

  return {
    accessToken: loginRes.body.accessToken,
    email,
    password,
    companyId: loginRes.body.user.companyId,
    userId: loginRes.body.user.sub,
    refreshCookie: extractRefreshCookie(loginRes),
  };
}
