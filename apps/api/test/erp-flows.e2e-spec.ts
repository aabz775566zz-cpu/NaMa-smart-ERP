import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { cleanDatabase } from './utils/db';
import { authHeader, registerCompany } from './utils/fixtures';
import { createTestApp } from './utils/test-app';

describe('ERP critical flows (e2e)', () => {
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

  it('creates a product', async () => {
    const owner = await registerCompany(app, { email: 'erp-product@example.com' });

    const res = await request(app.getHttpServer())
      .post('/products')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Widget', purchasePrice: 5, sellingPrice: 20 })
      .expect(201);

    expect(res.body.quantityOnHand).toBe(0);
    expect(res.body.sellingPrice).toBe('20');
  });

  it('completing a sale decreases quantityOnHand and generates an ISSUED invoice', async () => {
    const owner = await registerCompany(app, { email: 'erp-sale@example.com' });

    const product = await request(app.getHttpServer())
      .post('/products')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Gadget', purchasePrice: 5, sellingPrice: 20 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/inventory/adjustments')
      .set(authHeader(owner.accessToken))
      .send({ productId: product.body.id, type: 'PURCHASE', quantityChange: 10 })
      .expect(201);

    const sale = await request(app.getHttpServer())
      .post('/sales')
      .set(authHeader(owner.accessToken))
      .send({ items: [{ productId: product.body.id, quantity: 3 }] })
      .expect(201);

    expect(sale.body.status).toBe('DRAFT');
    expect(sale.body.subtotal).toBe('60');

    const completed = await request(app.getHttpServer())
      .post(`/sales/${sale.body.id}/complete`)
      .set(authHeader(owner.accessToken))
      .expect(200);

    expect(completed.body.status).toBe('COMPLETED');
    expect(completed.body.invoice.status).toBe('ISSUED');
    expect(completed.body.invoice.invoiceNumber).toEqual(expect.any(String));

    const productAfter = await request(app.getHttpServer())
      .get(`/products/${product.body.id}`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(productAfter.body.quantityOnHand).toBe(7);
  });
});
