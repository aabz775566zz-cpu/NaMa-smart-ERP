'use client';

import { useSessionBootstrap } from './hooks';

/** Mounted once near the app root (see root layout) — triggers the
 * silent-refresh-on-boot flow so a hard page reload can restore the session
 * from the httpOnly refresh cookie instead of forcing a fresh login.
 * Renders nothing; this is a side-effect-only component. */
export function SessionBootstrap() {
  useSessionBootstrap();
  return null;
}
