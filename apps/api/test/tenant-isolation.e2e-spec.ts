import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { cleanDatabase } from './utils/db';
import { authHeader, registerCompany } from './utils/fixtures';
import { createTestApp } from './utils/test-app';

describe('Tenant isolation (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  // Fresh app per test — see test-app.ts for why.
  beforeEach(async () => {
    await cleanDatabase(prisma);
    const ctx = await createTestApp();
    app = ctx.app;
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("prevents Company B from reading, updating, or deleting Company A's product", async () => {
    const companyA = await registerCompany(app, { email: 'tenant-a-product@example.com', companyName: 'Company A' });
    const companyB = await registerCompany(app, { email: 'tenant-b-product@example.com', companyName: 'Company B' });

    const productRes = await request(app.getHttpServer())
      .post('/products')
      .set(authHeader(companyA.accessToken))
      .send({ name: 'A-Only Widget', purchasePrice: 5, sellingPrice: 10 })
      .expect(201);
    const productId = productRes.body.id;

    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set(authHeader(companyB.accessToken))
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/products/${productId}`)
      .set(authHeader(companyB.accessToken))
      .send({ name: 'Hijacked' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/products/${productId}`)
      .set(authHeader(companyB.accessToken))
      .expect(404);

    const listRes = await request(app.getHttpServer())
      .get('/products')
      .set(authHeader(companyB.accessToken))
      .expect(200);
    expect(listRes.body.find((p: { id: string }) => p.id === productId)).toBeUndefined();

    // Sanity check: Company A can still reach its own product throughout.
    await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set(authHeader(companyA.accessToken))
      .expect(200);
  });

  it("prevents Company B from reading, updating, or deleting Company A's customer", async () => {
    const companyA = await registerCompany(app, {
      email: 'tenant-a-customer@example.com',
      companyName: 'Company A',
    });
    const companyB = await registerCompany(app, {
      email: 'tenant-b-customer@example.com',
      companyName: 'Company B',
    });

    const customerRes = await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(companyA.accessToken))
      .send({ name: 'A-Only Customer' })
      .expect(201);
    const customerId = customerRes.body.id;

    await request(app.getHttpServer())
      .get(`/customers/${customerId}`)
      .set(authHeader(companyB.accessToken))
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/customers/${customerId}`)
      .set(authHeader(companyB.accessToken))
      .send({ name: 'Hijacked' })
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/customers/${customerId}`)
      .set(authHeader(companyB.accessToken))
      .expect(404);

    const listRes = await request(app.getHttpServer())
      .get('/customers')
      .set(authHeader(companyB.accessToken))
      .expect(200);
    expect(listRes.body.find((c: { id: string }) => c.id === customerId)).toBeUndefined();
  });
});
