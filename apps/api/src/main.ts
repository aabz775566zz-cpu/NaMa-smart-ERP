import path from 'path';

import * as dotenv from 'dotenv';

// Must run before any other import — ai.module.ts and others read
// process.env.* at module-evaluation time (not inside a function body), so
// .env has to be loaded before those imports are require()'d, not merely
// before bootstrap() runs. Silently a no-op in an environment (prod) that
// has no .env file and already injects real env vars directly — dotenv
// never overwrites a variable that's already set. Mirrors
// test/setup-env.ts's approach, minus the test-only path override.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const PLACEHOLDER_JWT_SECRET = 'change-me-in-production';
const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

// Fails fast in production rather than silently signing tokens with a
// secret that's checked into .env.example — dev/staging just get a loud
// warning so a placeholder never blocks local work.
function checkJwtSecret(logger: Logger) {
  const secret = process.env.JWT_SECRET;
  const isPlaceholder = !secret || secret === PLACEHOLDER_JWT_SECRET;
  if (!isPlaceholder) return;

  const message =
    'JWT_SECRET is unset or still the placeholder value from .env.example. ' +
    'Every access/refresh token issued with it is forgeable by anyone who has read the repo.';

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${message} Refusing to start in production.`);
  }
  logger.warn(`${message} Rotate it before deploying.`);
}

// CORS_ORIGINS is an optional comma-separated override; unset keeps the
// existing localhost dev origins exactly as before.
function resolveCorsOrigins(logger: Logger): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_DEV_ORIGINS;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    logger.warn('CORS_ORIGINS was set but empty after parsing — falling back to default dev origins.');
    return DEFAULT_DEV_ORIGINS;
  }
  return origins;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  checkJwtSecret(logger);

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: resolveCorsOrigins(logger),
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}

bootstrap();
