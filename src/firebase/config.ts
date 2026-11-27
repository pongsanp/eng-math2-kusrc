export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Public Firebase Web App config (safe for frontend bundles; protected by Firestore Rules & Authorized Domains).
// Can be populated via Vite env vars (VITE_FIREBASE_*) or filled directly here once created in Firebase Console.
const PUBLIC_FIREBASE_CONFIG: FirebaseWebConfig = {
  apiKey: 'AIzaSyC4NBzlkLUrwCsS_ioZ3JithZOt4oGdvDc',
  authDomain: 'eng-math2-kusrc.firebaseapp.com',
  projectId: 'eng-math2-kusrc',
  storageBucket: 'eng-math2-kusrc.firebasestorage.app',
  messagingSenderId: '904858949221',
  appId: '1:904858949221:web:e61554c64f8e50fccad88c',
};

export const firebaseConfig: FirebaseWebConfig = {
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_CONFIG.apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_CONFIG.authDomain,
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_CONFIG.projectId,
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_CONFIG.messagingSenderId,
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() ||
    PUBLIC_FIREBASE_CONFIG.appId,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);
