import { useCallback, useEffect, useRef, useState } from 'react';
import { getProfile } from '../services/profileService';
import type { Profile } from '../types';

export type ProfileStatus = 'idle' | 'loading' | 'done' | 'error';

export interface UseProfile {
  status: ProfileStatus;
  profile: Profile | null;
  error: string | null;
  reload: () => void;
  /** Overwrites the cached profile in place (e.g. after a successful save) without refetching. */
  setProfile: (profile: Profile) => void;
}

/**
 * Fetches the given user's profile row on mount (and whenever `userId`
 * changes), following the same explicit-status-enum pattern as
 * `useResumeParsing`. Stale responses (e.g. a fast userId change) are
 * ignored via a request-id ref.
 */
export function useProfile(userId: string | undefined): UseProfile {
  const [status, setStatus] = useState<ProfileStatus>('idle');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    if (!userId) {
      requestIdRef.current += 1;
      setStatus('idle');
      setProfile(null);
      setError(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');
    setError(null);

    getProfile(userId)
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setProfile(result);
        setStatus('done');
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return;
        setStatus('error');
        setError('We could not load your profile. Please try again.');
      });
  }, [userId]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const setProfileDirect = useCallback((next: Profile) => {
    requestIdRef.current += 1;
    setProfile(next);
    setStatus('done');
    setError(null);
  }, []);

  return { status, profile, error, reload: load, setProfile: setProfileDirect };
}
