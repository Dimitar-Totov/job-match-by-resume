import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getCurrentSession } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import { AuthContext } from './authContext';
import type { AuthContextValue, AuthStatus } from './authContext';

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthState {
  session: Session | null;
  user: User | null;
}

function statusFor(session: Session | null): AuthStatus {
  return session ? 'authenticated' : 'guest';
}

/**
 * `onAuthStateChange` fires an `INITIAL_SESSION` event as soon as it's
 * subscribed to (with the current session, or null), so subscribing first
 * and treating it as the sole source of truth avoids a race between it and
 * the seed `getCurrentSession()` call below — whichever resolves is only
 * ever used to fill state before that first event arrives.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState | null>(null);

  useEffect(() => {
    let initialized = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      initialized = true;
      setState({ session, user: session?.user ?? null });
    });

    getCurrentSession()
      .then((session) => {
        if (initialized) return;
        setState({ session, user: session?.user ?? null });
      })
      .catch(() => {
        if (initialized) return;
        setState({ session: null, user: null });
      });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state ? statusFor(state.session) : 'loading',
      user: state?.user ?? null,
      session: state?.session ?? null,
    }),
    [state],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
