import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@erp-smart/ui', '@erp-smart/i18n', '@erp-smart/types', '@erp-smart/branding'],
};

export default nextConfig;
