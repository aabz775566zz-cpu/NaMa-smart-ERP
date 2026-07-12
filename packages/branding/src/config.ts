export interface BrandConfig {
  productName: string;
  tagline: string;
  logoUrl: string | null;
  supportEmail: string;
  websiteUrl: string;
}

// No final product name has been decided yet — "ERP Smart" is the existing
// working title already used throughout this project's docs and earlier
// phases (not a new name introduced here). The point of this file is that
// the value now lives in exactly ONE place: apps/web's metadata reads from
// here (see layout.tsx), apps/marketing does too. apps/api's mailer subject
// lines (currently hardcoded in auth.service.ts's calls to MailerService)
// and a future AI system-prompt identity are the remaining known call sites
// to point at this same object — see the Frontend Architecture Plan §7.
// Changing the product name later means editing the values below, not
// grepping the codebase.
export const brandConfig: BrandConfig = {
  productName: 'ERP Smart', // TODO: placeholder pending final naming decision
  tagline: 'Simple, powerful business management',
  logoUrl: null, // TODO: no logo asset exists yet
  supportEmail: 'support@example.com', // TODO: placeholder
  websiteUrl: 'http://localhost:3001',
};
