import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { cleanDatabase } from './utils/db';
import { authHeader, inviteAndActivateMember, registerCompany } from './utils/fixtures';
import { createTestApp, MockMailer } from './utils/test-app';

describe('Permissions (e2e)', () => {
  let app: INestApplication;
  let mailer: MockMailer;
  const prisma = new PrismaClient();

  // Fresh app per test — see test-app.ts for why.
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

  it('lets OWNER manage members (invite and list)', async () => {
    const owner = await registerCompany(app, { email: 'owner-manage@example.com' });

    await request(app.getHttpServer())
      .post('/companies/me/invitations')
      .set(authHeader(owner.accessToken))
      .send({ email: 'owner-invitee@example.com', roleKey: 'EMPLOYEE' })
      .expect(201);

    const membersRes = await request(app.getHttpServer())
      .get('/companies/me/members')
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(membersRes.body).toHaveLength(2);
  });

  it('lets MANAGER invite members and change roles, but not edit company settings', async () => {
    const owner = await registerCompany(app, { email: 'owner-for-manager@example.com' });
    const manager = await inviteAndActivateMember(app, mailer, owner, 'MANAGER', 'manager-user');

    // MANAGER has USERS:CREATE -> can invite.
    await request(app.getHttpServer())
      .post('/companies/me/invitations')
      .set(authHeader(manager.accessToken))
      .send({ email: 'manager-invitee@example.com', roleKey: 'EMPLOYEE' })
      .expect(201);

    // MANAGER has USERS:UPDATE -> can change a member's role.
    const membersRes = await request(app.getHttpServer())
      .get('/companies/me/members')
      .set(authHeader(manager.accessToken))
      .expect(200);
    const invitee = membersRes.body.find(
      (m: { user: { email: string } }) => m.user.email === 'manager-invitee@example.com',
    );
    await request(app.getHttpServer())
      .patch(`/companies/me/members/${invitee.id}`)
      .set(authHeader(manager.accessToken))
      .send({ roleKey: 'ACCOUNTANT' })
      .expect(200);

    // MANAGER lacks SETTINGS:UPDATE -> cannot edit company settings.
    await request(app.getHttpServer())
      .patch('/companies/me')
      .set(authHeader(manager.accessToken))
      .send({ name: 'Renamed By Manager' })
      .expect(403);
  });

  it('blocks EMPLOYEE from restricted actions', async () => {
    const owner = await registerCompany(app, { email: 'owner-for-employee@example.com' });
    const employee = await inviteAndActivateMember(app, mailer, owner, 'EMPLOYEE', 'employee-user');

    // EMPLOYEE has PRODUCTS:READ only, not CREATE.
    await request(app.getHttpServer())
      .post('/products')
      .set(authHeader(employee.accessToken))
      .send({ name: 'Should Fail', purchasePrice: 1, sellingPrice: 2 })
      .expect(403);

    // EMPLOYEE has CUSTOMERS:CREATE/READ but not DELETE.
    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Owner-created customer' })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/customers/${customerRes.body.id}`)
      .set(authHeader(employee.accessToken))
      .expect(403);

    // EMPLOYEE has no USERS:* permissions at all.
    await request(app.getHttpServer())
      .get('/companies/me/members')
      .set(authHeader(employee.accessToken))
      .expect(403);
  });
});
