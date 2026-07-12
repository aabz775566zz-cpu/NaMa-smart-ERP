// NEXT_PUBLIC_API_URL is already defined in apps/web/.env.example, pointing
// at the NestJS API (http://localhost:4000 in dev).
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
