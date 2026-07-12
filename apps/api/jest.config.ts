import type { Config } from 'jest';

// e2e suite against a real bootstrapped Nest app + a dedicated test
// Postgres database (see .env.test) — no unit-test layer yet, this is the
// first automated test foundation for the project.
const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
  },
  // Every spec file shares one Postgres database and truncates it between
  // tests — running files in parallel would let one file's truncate race
  // another's inserts.
  maxWorkers: 1,
  testTimeout: 30000,
};

export default config;
