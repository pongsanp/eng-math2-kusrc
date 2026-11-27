import { createContext, useContext } from 'react';
import { isFirebaseConfigured } from './config';

export interface FirebaseUserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface FirebaseContextValue {
  isConfigured: boolean;
  user: FirebaseUserInfo | null;
  authLoading: boolean;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: (isEn?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

export const FirebaseContext = createContext<FirebaseContextValue>({
  isConfigured: isFirebaseConfigured,
  user: null,
  authLoading: false,
  signingIn: false,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  clearAuthError: () => {},
});

export function useFirebaseAuth(): FirebaseContextValue {
  return useContext(FirebaseContext);
}
