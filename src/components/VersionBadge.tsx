import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, RefreshCw, Sparkles, X } from 'lucide-react';
import { APP_VERSION, CHANGELOG_ENTRIES } from '../data/changelog';
import { triggerCacheBustReload, useAppUpdateCheck } from '../utils/appUpdate';

interface VersionBadgeProps {
  isEn: boolean;
  compact?: boolean;
  tone?: 'auto' | 'light';
}

export function VersionBadge({ isEn, compact = false, tone = 'auto' }: VersionBadgeProps) {
  const [open, setOpen] = useState(false);
  const { availableVersion, checking, checkFeedback, checkForUpdates } = useAppUpdateCheck();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const buttonTone = availableVersion
    ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
    : tone === 'light'
      ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
      : 'border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300';

  const modal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 backdrop-blur-xs p-3 sm:p-4 select-text"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={isEn ? 'Release Notes' : 'ประวัติการอัปเดต'}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85dvh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h2 className="text-sm sm:text-base font-bold">
                    {isEn ? `What's New — v${APP_VERSION}` : `อัปเดตล่าสุด — v${APP_VERSION}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={isEn ? 'Close' : 'ปิด'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
                {availableVersion ? (
                  <>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        {isEn
                          ? `New version v${availableVersion} available! (Notes kept safe)`
                          : `พบเวอร์ชันใหม่ v${availableVersion} แล้ว! (ลายมือไม่หาย)`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerCacheBustReload(availableVersion)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{isEn ? `Update to v${availableVersion}` : `อัปเดตเป็น v${availableVersion}`}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      {checkFeedback === 'up-to-date' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {isEn ? `v${APP_VERSION} is up to date` : `เป็นเวอร์ชันล่าสุดแล้ว (v${APP_VERSION})`}
                          </span>
                        </>
                      ) : checkFeedback === 'offline' ? (
                        <span className="text-amber-700 dark:text-amber-400">
                          {isEn ? 'Could not reach server' : 'ตรวจสอบเซิร์ฟเวอร์ไม่สำเร็จ (ลองใหม่อีกครั้ง)'}
                        </span>
                      ) : (
                        <span>
                          {isEn
                            ? 'Using from iPad Home Screen icon? Tap to refresh.'
                            : 'เปิดจากไอคอน iPad? กดปุ่มนี้เพื่ออัปเดตข้ามแคชได้เลย'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={checking}
                        onClick={() => void checkForUpdates(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
                        <span>{isEn ? 'Check' : 'ตรวจอัปเดต'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerCacheBustReload(APP_VERSION)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isEn ? 'Force Reload' : 'รีเฟรชแอป'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="overflow-y-auto p-4 space-y-4">
                {CHANGELOG_ENTRIES.map((entry, idx) => (
                  <div
                    key={entry.version}
                    className={`rounded-xl border p-3.5 space-y-2 ${
                      idx === 0
                        ? 'border-sky-300 dark:border-sky-700 bg-sky-50/70 dark:bg-sky-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                            idx === 0
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          v{entry.version}
                        </span>
                        <span className="font-bold text-xs sm:text-sm">
                          {isEn ? entry.titleEn : entry.titleTh}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                        {entry.date}
                      </span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs sm:text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed">
                      {(isEn ? entry.highlightsEn : entry.highlightsTh).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
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
        onClick={() => setOpen(true)}
        title={
          availableVersion
            ? isEn
              ? `Update available: v${availableVersion}`
              : `มีอัปเดตใหม่ v${availableVersion} — กดเพื่ออัปเดต`
            : isEn
              ? 'Version, Update Check & Release Notes'
              : 'เวอร์ชัน ตรวจอัปเดต และประวัติการแก้ไข'
        }
        className={`inline-flex items-center gap-1 rounded-lg border font-mono font-bold transition shrink-0 ${buttonTone} ${
          compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[11px]'
        }`}
      >
        {availableVersion && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
        <span>v{APP_VERSION}</span>
        {availableVersion && <span className="hidden sm:inline font-sans text-[10px]">{isEn ? 'Update' : 'อัปเดต'}</span>}
      </button>
      {modal}
    </>
  );
}
