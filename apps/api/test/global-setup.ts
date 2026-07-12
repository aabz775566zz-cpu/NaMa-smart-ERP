import { execSync } from 'child_process';
import path from 'path';

import * as dotenv from 'dotenv';

// Runs once before the whole test run (Jest's globalSetup lifecycle, a
// separate process from the test files themselves). Applies pending
// migrations and re-seeds the system roles/permissions against the test
// database — both idempotent, safe on every run. The erp_smart_test
// database itself must already exist (created once via `createdb`); this
// does not create the database, only its schema/seed contents.
export default async function globalSetup(): Promise<void> {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

  const repoRoot = path.resolve(__dirname, '../../..');
  const schemaPath = path.resolve(repoRoot, 'database/prisma/schema.prisma');
  const env = { ...process.env };

  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    stdio: 'inherit',
    env,
    cwd: repoRoot,
  });

  // `prisma db seed` resolves its own .env independently of the env passed
  // here (it picked up the root .env and seeded the dev database in
  // practice) — invoking the seed script's own ts-node command directly
  // guarantees it runs with exactly the env this function already built.
  execSync('npx ts-node --project database/prisma/tsconfig.json database/prisma/seed.ts', {
    stdio: 'inherit',
    env,
    cwd: repoRoot,
  });
}
