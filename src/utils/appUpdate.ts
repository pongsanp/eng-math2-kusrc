import { useCallback, useEffect, useState } from 'react';
import { APP_VERSION } from '../data/changelog';

const RELOAD_PARAM = '_app_v';
const CHECK_THROTTLE_MS = 60_000;

let cachedLatestVersion: string | null = null;
let lastCheckedAt = 0;

function parseSemver(v: string): [number, number, number] {
  const clean = v.trim().replace(/^v/i, '').split('-')[0];
  const parts = clean.split('.').map((n) => Number.parseInt(n, 10));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
}

export function isNewerVersion(remote: string, current: string): boolean {
  const [rMaj, rMin, rPat] = parseSemver(remote);
  const [cMaj, cMin, cPat] = parseSemver(current);
  if (rMaj !== cMaj) return rMaj > cMaj;
  if (rMin !== cMin) return rMin > cMin;
  return rPat > cPat;
}

export function cleanupReloadQueryParam(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has(RELOAD_PARAM)) {
      url.searchParams.delete(RELOAD_PARAM);
      window.history.replaceState(null, '', url.toString());
    }
  } catch {
    // Ignore history API errors
  }
}

export function triggerCacheBustReload(targetVersion?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const stamp = `${targetVersion ? targetVersion.replace(/[^a-zA-Z0-9._-]/g, '') : 'r'}_${Date.now().toString(36)}`;
    url.searchParams.set(RELOAD_PARAM, stamp);
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

export function useAppUpdateCheck() {
  const [availableVersion, setAvailableVersion] = useState<string | null>(() => cachedLatestVersion);
  const [checking, setChecking] = useState(false);
  const [checkFeedback, setCheckFeedback] = useState<'none' | 'up-to-date' | 'found' | 'offline'>(
    'none',
  );

  const checkForUpdates = useCallback(async (manual = false) => {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    const now = Date.now();
    if (!manual && now - lastCheckedAt < CHECK_THROTTLE_MS) return;
    lastCheckedAt = now;

    if (manual) {
      setChecking(true);
      setCheckFeedback('none');
    }

    try {
      const res = await fetch(`./version.json?t=${now}`, { cache: 'no-store' });
      if (!res.ok) {
        if (manual) setCheckFeedback('offline');
        return;
      }
      const data = (await res.json()) as { version?: unknown };
      const remoteVer = typeof data.version === 'string' ? data.version.trim() : '';
      if (remoteVer && isNewerVersion(remoteVer, APP_VERSION)) {
        cachedLatestVersion = remoteVer;
        setAvailableVersion(remoteVer);
        if (manual) setCheckFeedback('found');
      } else {
        cachedLatestVersion = null;
        setAvailableVersion(null);
        if (manual) setCheckFeedback('up-to-date');
      }
    } catch {
      if (manual) setCheckFeedback('offline');
    } finally {
      if (manual) setChecking(false);
    }
  }, []);

  useEffect(() => {
    cleanupReloadQueryParam();
    const timer = window.setTimeout(() => {
      void checkForUpdates(false);
    }, 1200);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdates(false);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [checkForUpdates]);

  return {
    availableVersion,
    checking,
    checkFeedback,
    checkForUpdates,
  };
}
