import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  googleProvider: GoogleAuthProvider;
}

let cachedServices: FirebaseServices | null = null;

export function getFirebaseServices(): FirebaseServices | null {
  if (!isFirebaseConfigured) return null;
  if (cachedServices) return cachedServices;

  const existingApps = getApps();
  const app = existingApps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  let db: Firestore;
  if (existingApps.length === 0) {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }

  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  cachedServices = { app, auth, db, googleProvider };
  return cachedServices;
}
