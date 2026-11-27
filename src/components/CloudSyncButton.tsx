import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  CloudOff,
  Loader2,
  LogOut,
  RefreshCw,
  X,
} from 'lucide-react';
import { useFirebaseAuth } from '../firebase/firebaseAuthContext';

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface CloudSyncButtonProps {
  isEn: boolean;
  tone?: 'auto' | 'light';
  syncState?: CloudSyncState;
  lastSyncedAt?: number | null;
  syncError?: string | null;
  onSyncNow?: () => void;
  compact?: boolean;
}

function GoogleMark() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export function CloudSyncButton({
  isEn,
  tone = 'auto',
  syncState = 'idle',
  lastSyncedAt = null,
  syncError = null,
  onSyncNow,
  compact = false,
}: CloudSyncButtonProps) {
  const {
    isConfigured,
    user,
    authLoading,
    signingIn,
    authError,
    signInWithGoogle,
    signOut,
    clearAuthError,
  } = useFirebaseAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    if (!setupOpen && !menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSetupOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setupOpen, menuOpen]);

  const surfaceCls =
    tone === 'light'
      ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200';

  const dropdownSurface =
    tone === 'light'
      ? 'border-slate-200 bg-white text-slate-900'
      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100';

  if (!isConfigured) {
    const setupModal =
      setupOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-3 sm:p-4 select-text"
              onClick={() => setSetupOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={isEn ? 'Firebase Cloud Sync Setup' : 'ตั้งค่าซิงก์ข้ามอุปกรณ์ (Firebase)'}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-sky-50 dark:bg-sky-950/40">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Cloud className="w-4 h-4 text-sky-600" />
                    <span>
                      {isEn
                        ? 'Firebase Cloud Sync Setup'
                        : 'ตั้งค่าซิงก์ข้ามอุปกรณ์ (Firebase)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSetupOpen(false)}
                    aria-label={isEn ? 'Close' : 'ปิด'}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                  <p>
                    {isEn
                      ? 'Google Sign-In and automatic Firestore note syncing are built in, waiting for your Firebase Web App credentials.'
                      : 'ระบบ Google Sign-In และ Auto-Sync ลง Firestore พร้อมใช้งานแล้ว เหลือเพียงเชื่อมต่อ Firebase Project ของรายวิชา:'}
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>
                      {isEn
                        ? 'Create a project at Firebase Console (Spark Free Plan) and enable Authentication -> Google.'
                        : 'สร้างโปรเจกต์ใน Firebase Console (แผน Spark ฟรี) และเปิดใช้ Authentication -> Google'}
                    </li>
                    <li>
                      {isEn
                        ? 'Add Authorized domains (localhost and pongsanp.github.io) and create Firestore Database.'
                        : 'เพิ่ม Authorized domain (pongsanp.github.io) และสร้าง Firestore Database พร้อมใส่ firestore.rules'}
                    </li>
                    <li>
                      {isEn
                        ? 'Paste your Web App config into src/firebase/config.ts or .env (VITE_FIREBASE_*).'
                        : 'นำค่า Web App Config มาใส่ในไฟล์ src/firebase/config.ts หรือ .env (VITE_FIREBASE_*)'}
                    </li>
                  </ol>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isEn
                      ? 'Until then, all handwritten notes continue saving safely in local IndexedDB.'
                      : 'ระหว่างนี้ลายมือทั้งหมดยังถูกบันทึกอัตโนมัติลงในเครื่อง (IndexedDB) ตามปกติ'}
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null;

    return (
      <>
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          title={
            isEn
              ? 'Google Cloud Sync ready — add Firebase Web Config to activate'
              : 'ระบบซิงก์ลายมือพร้อมแล้ว — เหลือใส่ค่า Firebase Config เพื่อเปิดใช้งาน'
          }
          className={`inline-flex items-center gap-1.5 rounded-xl border text-xs font-semibold transition shrink-0 ${surfaceCls} ${
            compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
          }`}
        >
          <Cloud className="w-3.5 h-3.5 text-sky-600" />
          <span className="hidden sm:inline">
            {isEn ? 'Cloud Sync' : 'ซิงก์ Cloud'}
          </span>
        </button>
        {setupModal}
      </>
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <button
          type="button"
          disabled={authLoading || signingIn}
          onClick={() => void signInWithGoogle(isEn)}
          title={
            isEn
              ? 'Sign in with Google to auto-sync handwritten notes across devices'
              : 'ล็อกอิน Google เพื่อซิงก์ลายมือและหน้ากระดาษอัตโนมัติข้ามอุปกรณ์'
          }
          className={`inline-flex items-center gap-1.5 rounded-xl border text-xs font-bold transition shrink-0 disabled:opacity-60 ${surfaceCls} ${
            compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
          }`}
        >
          {signingIn || authLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
          ) : (
            <GoogleMark />
          )}
          <span className="hidden sm:inline">
            {isEn ? 'Google Sync' : 'ล็อกอินซิงก์'}
          </span>
        </button>

        {authError && (
          <div
            className="absolute right-0 mt-1.5 w-72 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 p-2.5 shadow-lg z-50 text-[11px] leading-snug flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{authError}</div>
            <button
              type="button"
              onClick={clearAuthError}
              className="p-0.5 rounded hover:bg-rose-200/60"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  const firstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User';

  const statusBadge = (() => {
    if (syncState === 'syncing') {
      return {
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />,
        label: isEn ? 'Syncing' : 'กำลังซิงก์',
        dotCls: 'bg-amber-500',
      };
    }
    if (syncState === 'error') {
      return {
        icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
        label: isEn ? 'Sync error' : 'ซิงก์พลาด',
        dotCls: 'bg-rose-500',
      };
    }
    if (syncState === 'offline') {
      return {
        icon: <CloudOff className="w-3.5 h-3.5 text-slate-500" />,
        label: isEn ? 'Offline' : 'ออฟไลน์',
        dotCls: 'bg-slate-400',
      };
    }
    if (syncState === 'synced') {
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        label: isEn ? 'Synced' : 'ซิงก์แล้ว',
        dotCls: 'bg-emerald-500',
      };
    }
    return {
      icon: <Cloud className="w-3.5 h-3.5 text-sky-600" />,
      label: isEn ? 'Cloud On' : 'พร้อมซิงก์',
      dotCls: 'bg-sky-500',
    };
  })();

  const formattedLastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString(isEn ? 'en-US' : 'th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        title={
          syncError ||
          (isEn
            ? `Signed in as ${user.email ?? firstName} (${statusBadge.label})`
            : `บัญชี ${user.email ?? firstName} (${statusBadge.label})`)
        }
        className={`inline-flex items-center gap-1.5 rounded-xl border text-xs font-bold transition shrink-0 ${surfaceCls} ${
          compact ? 'px-1.5 py-1' : 'px-2 py-1'
        }`}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={firstName}
            referrerPolicy="no-referrer"
            className="w-5 h-5 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center">
            {firstName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden md:inline max-w-[90px] truncate">{firstName}</span>
        {statusBadge.icon}
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className={`absolute right-0 mt-1.5 w-64 rounded-2xl border shadow-xl p-3 z-50 text-xs space-y-2.5 select-text ${dropdownSurface}`}
          >
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-700">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={firstName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center shrink-0">
                  {firstName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-bold truncate">{user.displayName ?? firstName}</div>
                {user.email && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80">
              <div className="flex items-center gap-1.5 font-semibold">
                <span className={`w-2 h-2 rounded-full ${statusBadge.dotCls}`} />
                <span>{statusBadge.label}</span>
              </div>
              {formattedLastSync && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formattedLastSync}
                </span>
              )}
            </div>

            {syncError && (
              <div className="px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                {syncError}
              </div>
            )}

            {onSyncNow ? (
              <button
                type="button"
                onClick={() => {
                  onSyncNow();
                  setMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isEn ? 'Sync Notes Now' : 'ซิงก์โน้ตเดี๋ยวนี้'}</span>
              </button>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {isEn
                  ? 'Open Ch. 1 Slides to sync handwritten notes automatically across your devices.'
                  : 'เปิดสไลด์บทที่ 1 เพื่อซิงก์ลายมือและหน้ากระดาษอัตโนมัติข้ามอุปกรณ์'}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isEn ? 'Sign Out (Keep Local Copy)' : 'ออกจากระบบ (เก็บไฟล์ในเครื่องไว้)'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
