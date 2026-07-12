import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';

import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { MailerService } from '../../src/common/mailer/mailer.service';

export interface MockMailer {
  sendVerificationEmail: jest.Mock<Promise<void>, [string, string]>;
  sendPasswordResetEmail: jest.Mock<Promise<void>, [string, string]>;
  sendInviteEmail: jest.Mock<Promise<void>, [string, string]>;
}

function createMockMailer(): MockMailer {
  return {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    sendInviteEmail: jest.fn().mockResolvedValue(undefined),
  };
}

export interface TestAppContext {
  app: INestApplication;
  mailer: MockMailer;
}

// Mirrors main.ts's bootstrap (cookie parsing, validation, error shaping)
// minus CORS and port-listen, which don't apply to in-process supertest
// requests. MailerService is replaced with a jest.fn()-based double so no
// test ever calls Resend for real.
//
// ThrottlerGuard is registered app-wide via APP_GUARD in app.module.ts, and
// `.overrideGuard(ThrottlerGuard)` does NOT intercept it (confirmed
// empirically — Nest only binds it under the APP_GUARD token, never under
// its own class token, so there's nothing for overrideGuard to match).
// Rather than fight that, every spec file calls createTestApp() fresh in
// beforeEach: a new Test.createTestingModule() gets its own ThrottlerStorage
// instance, so every individual test starts with a clean rate-limit budget.
export async function createTestApp(): Promise<TestAppContext> {
  const mailer = createMockMailer();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailerService)
    .useValue(mailer)
    .compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  return { app, mailer };
}
