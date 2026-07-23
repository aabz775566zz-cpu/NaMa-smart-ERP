import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { cleanDatabase } from './utils/db';
import { authHeader, inviteAndActivateMember, registerCompany } from './utils/fixtures';
import { createTestApp, MockMailer } from './utils/test-app';

// Exercises the AI write-action pipeline end-to-end through real HTTP calls
// (POST /ai/chat -> POST .../confirm), against the deterministic
// StubLlmProvider that's always bound in this test environment (no
// ANTHROPIC/OPENAI/GEMINI_API_KEY is set in .env.test — see ai.module.ts).
// The stub's regex triggers (RECORD_PAYMENT_PATTERN /
// RECORD_SUPPLIER_PAYMENT_PATTERN in stub-llm-provider.ts) stand in for a
// real LLM's argument extraction, but everything downstream — tool
// execution, the propose/confirm split, the ledger write, the
// double-confirm guard, and per-tool permission enforcement — is exactly
// the same code a real provider would drive.
describe('AI write actions (e2e)', () => {
  let app: INestApplication;
  let mailer: MockMailer;
  const prisma = new PrismaClient();

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

  it('proposes and confirms a customer payment, updating the ledger, and blocks a second confirm', async () => {
    const owner = await registerCompany(app, { email: 'ai-customer-payment@example.com' });

    const customer = await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Acme Corp' })
      .expect(201);

    const chat = await request(app.getHttpServer())
      .post('/ai/chat')
      .set(authHeader(owner.accessToken))
      .send({ message: 'record a payment of 100 from Acme Corp' })
      .expect(201);

    const conversationId = chat.body.conversationId as string;
    const conversation = await request(app.getHttpServer())
      .get(`/ai/conversations/${conversationId}`)
      .set(authHeader(owner.accessToken))
      .expect(200);

    const toolMessage = conversation.body.messages.find((m: { role: string }) => m.role === 'TOOL');
    expect(toolMessage).toBeDefined();
    const toolResult = JSON.parse(toolMessage.content).result;
    expect(toolResult.pendingConfirmation).toBe(true);
    expect(toolResult.action).toBe('RECORD_CUSTOMER_PAYMENT');

    const confirmed = await request(app.getHttpServer())
      .post(`/ai/conversations/${conversationId}/messages/${toolMessage.id}/confirm`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(confirmed.body.message.content).toContain('✓');

    const ledger = await request(app.getHttpServer())
      .get(`/customers/${customer.body.id}/ledger`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(ledger.body.totalPaid).toBe('100.00');

    // Double-confirm guard: the same tool message can't be confirmed twice.
    await request(app.getHttpServer())
      .post(`/ai/conversations/${conversationId}/messages/${toolMessage.id}/confirm`)
      .set(authHeader(owner.accessToken))
      .expect(409);
  });

  it('proposes and confirms a supplier payment, updating the ledger', async () => {
    const owner = await registerCompany(app, { email: 'ai-supplier-payment@example.com' });

    const supplier = await request(app.getHttpServer())
      .post('/suppliers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Acme Supplies' })
      .expect(201);

    const chat = await request(app.getHttpServer())
      .post('/ai/chat')
      .set(authHeader(owner.accessToken))
      .send({ message: 'record a payment of 50 to supplier Acme Supplies' })
      .expect(201);

    const conversationId = chat.body.conversationId as string;
    const conversation = await request(app.getHttpServer())
      .get(`/ai/conversations/${conversationId}`)
      .set(authHeader(owner.accessToken))
      .expect(200);

    const toolMessage = conversation.body.messages.find((m: { role: string }) => m.role === 'TOOL');
    expect(toolMessage).toBeDefined();
    const toolResult = JSON.parse(toolMessage.content).result;
    expect(toolResult.pendingConfirmation).toBe(true);
    expect(toolResult.action).toBe('RECORD_SUPPLIER_PAYMENT');

    const confirmed = await request(app.getHttpServer())
      .post(`/ai/conversations/${conversationId}/messages/${toolMessage.id}/confirm`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(confirmed.body.message.content).toContain('✓');

    const ledger = await request(app.getHttpServer())
      .get(`/suppliers/${supplier.body.id}/ledger`)
      .set(authHeader(owner.accessToken))
      .expect(200);
    expect(ledger.body.totalPaid).toBe('50.00');
  });

  it('never offers either payment tool to a user without the matching permission', async () => {
    const owner = await registerCompany(app, { email: 'ai-employee-perms@example.com' });
    const employee = await inviteAndActivateMember(app, mailer, owner, 'EMPLOYEE', 'ai-employee');

    await request(app.getHttpServer())
      .post('/customers')
      .set(authHeader(owner.accessToken))
      .send({ name: 'Acme Corp' })
      .expect(201);

    // EMPLOYEE lacks INVOICES:UPDATE and PURCHASES:UPDATE, so neither
    // propose_* tool is ever offered to the model (deny by omission — see
    // AiService.chat()'s availableTools filter) — the stub falls through to
    // its generic placeholder reply instead of proposing a payment.
    const chat = await request(app.getHttpServer())
      .post('/ai/chat')
      .set(authHeader(employee.accessToken))
      .send({ message: 'record a payment of 100 from Acme Corp' })
      .expect(201);

    const conversation = await request(app.getHttpServer())
      .get(`/ai/conversations/${chat.body.conversationId}`)
      .set(authHeader(employee.accessToken))
      .expect(200);

    const toolMessages = conversation.body.messages.filter((m: { role: string }) => m.role === 'TOOL');
    expect(toolMessages).toHaveLength(0);
  });
});
