import { LogoMark } from '@erp-smart/ui';

/**
 * Minimal branded loading indicator — a gently pulsing logo mark. Used for
 * the brief windows where the app has nothing meaningful to show yet (auth
 * bootstrap, the "/" redirect interstitial) so even those moments carry the
 * brand instead of a bare generic skeleton.
 */
export function BrandedLoader() {
  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={40} className="animate-pulse" />
    </div>
  );
}
