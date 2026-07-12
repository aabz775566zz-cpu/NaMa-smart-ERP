import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { cleanDatabase } from './utils/db';
import { registerCompany } from './utils/fixtures';
import { createTestApp, MockMailer } from './utils/test-app';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let mailer: MockMailer;
  const prisma = new PrismaClient();

  // Fresh app per test — see test-app.ts for why (each instance gets its
  // own ThrottlerStorage, avoiding cross-test rate-limit interference).
  beforeEach(async () => {
    await cleanDatabase(prisma);
    const ctx = await createTestApp();
    app = ctx.app;
    mailer = ctx.mailer;
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Registration', () => {
    it('succeeds with valid, unique details', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'owner@example.com', password: 'Password123!', fullName: 'Owner', companyName: 'Acme' })
        .expect(201);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.email).toBe('owner@example.com');
      expect(res.body.user.roleKey).toBe('OWNER');
      expect(mailer.sendVerificationEmail).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate email', async () => {
      await registerCompany(app, { email: 'dupe@example.com' });

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'dupe@example.com', password: 'Password123!', fullName: 'Second', companyName: 'Second Co' })
        .expect(409);
    });
  });

  describe('Login', () => {
    it('succeeds with the correct password', async () => {
      const owner = await registerCompany(app, { email: 'login-ok@example.com', password: 'Password123!' });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: owner.email, password: owner.password })
        .expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects the wrong password', async () => {
      const owner = await registerCompany(app, { email: 'login-bad@example.com' });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: owner.email, password: 'WrongPassword999!' })
        .expect(401);
    });
  });

  describe('Refresh token', () => {
    it('issues a new access token for a valid refresh cookie', async () => {
      const owner = await registerCompany(app, { email: 'refresh-ok@example.com' });

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', owner.refreshCookie)
        .expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
    });

    it('rejects an invalid refresh cookie', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=not-a-real-token')
        .expect(401);
    });
  });

  describe('Password reset', () => {
    it('lets the user log in with the new password and rejects the old one afterward', async () => {
      const owner = await registerCompany(app, { email: 'reset-me@example.com', password: 'OldPassword123!' });

      await request(app.getHttpServer()).post('/auth/forgot-password').send({ email: owner.email }).expect(200);

      expect(mailer.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const [, resetToken] = mailer.sendPasswordResetEmail.mock.calls[0];

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword456!' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: owner.email, password: 'OldPassword123!' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: owner.email, password: 'NewPassword456!' })
        .expect(200);
    });
  });

  describe('Email verification', () => {
    it('verifies the account with a valid token and rejects reuse of the same token', async () => {
      await registerCompany(app, { email: 'verify-me@example.com' });

      expect(mailer.sendVerificationEmail).toHaveBeenCalledTimes(1);
      const [, verifyToken] = mailer.sendVerificationEmail.mock.calls[0];

      await request(app.getHttpServer()).get(`/auth/verify-email?token=${verifyToken}`).expect(200);
      await request(app.getHttpServer()).get(`/auth/verify-email?token=${verifyToken}`).expect(400);
    });
  });
});
