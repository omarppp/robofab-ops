'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User, onAuthStateChanged,
  signInWithEmailAndPassword, signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { AppUser } from '@/types';

const VALID_ROLES = ['owner', 'admin', 'staff', 'viewer'];

// Possible non-loading error codes surfaced to the UI
export type ProfileErrorCode =
  | 'not_found'        // users/{uid} does not exist
  | 'inactive'         // status !== 'active'
  | 'invalid_role'     // role not in VALID_ROLES
  | 'permission_denied'// Firestore permission-denied
  | 'error';           // any other Firestore/network error

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  profileError: ProfileErrorCode | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, appUser: null, loading: true, profileError: null,
  signIn: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,         setUser]         = useState<User | null>(null);
  const [appUser,      setAppUser]      = useState<AppUser | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [profileError, setProfileError] = useState<ProfileErrorCode | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Reset error on every auth state change
      setProfileError(null);

      // ── Not signed in ──────────────────────────────────────────────────────
      if (!firebaseUser) {
        setUser(null);
        setAppUser(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      // ── Dev diagnostics ────────────────────────────────────────────────────
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth] uid:  ', firebaseUser.uid);
        console.log('[Auth] email:', firebaseUser.email);
        console.log('[Auth] reading path: users/' + firebaseUser.uid);
      }

      // ── Read profile from users/{uid} ─────────────────────────────────────
      // setLoading(false) is ALWAYS called in finally — no infinite loading.
      try {
        const ref  = doc(db, 'users', firebaseUser.uid);
        const snap = await getDoc(ref);

        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] profile exists:', snap.exists());
          if (snap.exists()) console.log('[Auth] profile data:', snap.data());
        }

        // Document missing → user not registered in the system
        if (!snap.exists()) {
          setAppUser(null);
          setProfileError('not_found');
          return;
        }

        const data = snap.data();

        // Account must be active
        if (data.status !== 'active') {
          setAppUser(null);
          setProfileError('inactive');
          return;
        }

        // Role must be a known value
        if (!VALID_ROLES.includes(data.role)) {
          setAppUser(null);
          setProfileError('invalid_role');
          return;
        }

        // All checks passed — build AppUser
        // Firestore stores "name" but AppUser interface uses "displayName"
        setAppUser({
          id:          snap.id,
          email:       data.email       ?? firebaseUser.email ?? '',
          displayName: data.name        ?? data.displayName ?? firebaseUser.displayName ?? firebaseUser.email ?? '',
          role:        data.role,
          status:      data.status,
          createdAt:   typeof data.createdAt === 'string'
                         ? data.createdAt
                         : data.createdAt?.toDate?.().toISOString() ?? new Date().toISOString(),
        } as AppUser);

      } catch (err: unknown) {
        const fbErr = err as { code?: string; message?: string };

        if (process.env.NODE_ENV === 'development') {
          console.error('[Auth] Firestore error code:   ', fbErr.code);
          console.error('[Auth] Firestore error message:', fbErr.message);
        }

        setAppUser(null);
        setProfileError(fbErr.code === 'permission-denied' ? 'permission_denied' : 'error');

      } finally {
        // Guaranteed to run — app never hangs on loading
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, profileError, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
