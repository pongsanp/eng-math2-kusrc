import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { getFirebaseServices } from './client';
import { FirebaseContext, type FirebaseUserInfo } from './firebaseAuthContext';

function toUserInfo(user: User | null): FirebaseUserInfo | null {
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

function formatAuthError(err: unknown, isEn: boolean): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '';
  }
  if (code === 'auth/unauthorized-domain') {
    return isEn
      ? 'This domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains.'
      : 'โดเมนนี้ยังไม่ได้เพิ่มใน Firebase Console -> Authentication -> Authorized domains';
  }
  if (code === 'auth/network-request-failed') {
    return isEn
      ? 'Network unavailable. You can still write offline; notes will sync when reconnected.'
      : 'ไม่สามารถเชื่อมต่อเครือข่ายได้ (เขียนออฟไลน์ต่อได้ และจะซิงก์เมื่อออนไลน์)';
  }
  if (code === 'auth/operation-not-allowed') {
    return isEn
      ? 'Google Sign-In is not enabled in Firebase Console -> Authentication -> Sign-in method.'
      : 'กรุณาเปิดใช้งาน Google Sign-In ใน Firebase Console -> Authentication';
  }
  return isEn
    ? 'Could not complete Google Sign-In. Please try again.'
    : 'ไม่สามารถเข้าสู่ระบบ Google ได้ กรุณาลองใหม่อีกครั้ง';
}

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const services = getFirebaseServices();
  const [user, setUser] = useState<FirebaseUserInfo | null>(() =>
    toUserInfo(services?.auth.currentUser ?? null),
  );
  const [authLoading, setAuthLoading] = useState<boolean>(Boolean(services));
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const activeServices = getFirebaseServices();
    if (!activeServices) return;

    void getRedirectResult(activeServices.auth).catch(() => {
      // Ignore redirect failures; onAuthStateChanged updates user if signed in.
    });

    const unsub = onAuthStateChanged(
      activeServices.auth,
      (nextUser) => {
        setUser(toUserInfo(nextUser));
        setAuthLoading(false);
      },
      () => {
        setAuthLoading(false);
      },
    );

    return () => {
      unsub();
    };
  }, []);

  const signInWithGoogle = useCallback(async (isEn = false) => {
    const activeServices = getFirebaseServices();
    if (!activeServices) return;
    setAuthError(null);
    setSigningIn(true);
    try {
      await signInWithPopup(activeServices.auth, activeServices.googleProvider);
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(activeServices.auth, activeServices.googleProvider);
          return;
        } catch (redirectErr) {
          const msg = formatAuthError(redirectErr, isEn);
          if (msg) setAuthError(msg);
        }
      } else {
        const msg = formatAuthError(err, isEn);
        if (msg) setAuthError(msg);
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const activeServices = getFirebaseServices();
    if (!activeServices) return;
    setAuthError(null);
    await firebaseSignOut(activeServices.auth);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        isConfigured: Boolean(services),
        user,
        authLoading,
        signingIn,
        authError,
        signInWithGoogle,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}
