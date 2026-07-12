export interface BrandConfig {
  productName: string;
  tagline: string;
  logoUrl: string | null;
  supportEmail: string;
  /** Where the actual product (login/register/dashboard) lives — apps/marketing's
   * CTAs link here. Was previously named `websiteUrl` and (incorrectly) pointed
   * at the marketing site's own port; renamed since it was unused anywhere
   * else in the codebase, so nothing depended on the old name/value. */
  webAppUrl: string;
}

// "ERP Smart" is the working title used throughout this project's docs and
// earlier phases. The point of this file is that the value lives in exactly
// ONE place: apps/web's metadata reads from here (see layout.tsx), apps/
// marketing does too. apps/api's mailer subject lines (currently hardcoded
// in auth.service.ts's calls to MailerService) and a future AI system-prompt
// identity are the remaining known call sites to point at this same object.
// Changing the product name later means editing the values below, not
// grepping the codebase. logoUrl and supportEmail are not wired into any
// user-facing surface yet — set them here once real assets/inbox exist.
export const brandConfig: BrandConfig = {
  productName: 'ERP Smart',
  tagline: 'Simple, powerful business management',
  logoUrl: null,
  supportEmail: 'support@example.com',
  webAppUrl: process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'http://localhost:3000',
};
