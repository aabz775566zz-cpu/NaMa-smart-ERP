import path from 'path';

import * as dotenv from 'dotenv';

// Runs once per test file, before ts-jest/Nest bootstrap in that file, so
// process.env.DATABASE_URL etc. point at the test database by the time
// AppModule (and its PrismaService) are constructed.
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
