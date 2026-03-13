// File: hooks/useIdentityVault.ts
import { useState, useEffect } from 'react';
import { IdentityVault, CosmicIdentity } from '../utils/IdentityVault';

interface IdentityVaultState {
  identity: CosmicIdentity | null;
  loading: boolean;
  /** True if the vault was opened but returned null (first-run, or hard reset). */
  empty: boolean;
}

/**
 * Reads the user's CosmicIdentity from the hardware vault into React state.
 *
 * The data lives in volatile memory only while the component is mounted.
 * There is no global cache — each consumer gets its own decryption call,
 * so the plaintext PII is never kept alive beyond what the screen needs.
 *
 * Usage:
 *   const { identity, loading } = useIdentityVault();
 */
export function useIdentityVault(): IdentityVaultState {
  const [identity, setIdentity] = useState<CosmicIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let cancelled = false;

    IdentityVault.openVault()
      .then((result) => {
        if (cancelled) return;
        setIdentity(result);
        setEmpty(result === null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIdentity(null);
        setEmpty(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
      // Explicitly null out the reference so the plantext PII is eligible
      // for GC as soon as this component unmounts.
      setIdentity(null);
    };
  }, []);

  return { identity, loading, empty };
}
