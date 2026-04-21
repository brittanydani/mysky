import { useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

const PROBE_URL = 'https://www.google.com/generate_204';
const PROBE_TIMEOUT_MS = 5000;
const RECHECK_INTERVAL_MS = 30000;
// Require two consecutive failures before declaring offline to avoid flapping
const FAILURE_THRESHOLD = 2;

async function probe(): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(PROBE_URL, { method: 'HEAD', signal: controller.signal, cache: 'no-cache' });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Returns `true` when the device has confirmed internet access, `false` when
 * offline (after two consecutive failures), and `null` while the initial probe
 * is in progress.
 */
export function useNetworkStatus(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const failureCountRef = useRef(0);
  const currentOnlineRef = useRef<boolean | null>(null);

  const check = async () => {
    const result = await probe();

    if (result) {
      failureCountRef.current = 0;
      if (currentOnlineRef.current !== true) {
        currentOnlineRef.current = true;
        setOnline(true);
      }
    } else {
      failureCountRef.current += 1;
      if (failureCountRef.current >= FAILURE_THRESHOLD && currentOnlineRef.current !== false) {
        currentOnlineRef.current = false;
        setOnline(false);
      }
    }
  };

  useEffect(() => {
    check();

    intervalRef.current = setInterval(check, RECHECK_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return online;
}
