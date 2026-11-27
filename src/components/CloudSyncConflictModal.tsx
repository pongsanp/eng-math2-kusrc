import { Cloud, GitMerge, HardDrive, ShieldCheck } from 'lucide-react';

export interface CloudSyncConflictInfo {
  localSlideCount: number;
  localPageCount: number;
  cloudSlideCount: number;
  cloudPageCount: number;
}

interface CloudSyncConflictModalProps {
  isEn: boolean;
  conflict: CloudSyncConflictInfo;
  busy: boolean;
  onResolve: (choice: 'merge' | 'use-cloud' | 'use-local') => void;
  onSignOutInstead: () => void;
}

export function CloudSyncConflictModal({
  isEn,
  conflict,
  busy,
  onResolve,
  onSignOutInstead,
}: CloudSyncConflictModalProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 select-text">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3.5 border-b border-slate-200 bg-sky-50 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              {isEn
                ? 'Notes Found on Both This Device & Cloud'
                : 'พบโน้ตลายมือทั้งในเครื่องนี้และบน Cloud'}
            </h2>
            <p className="text-xs text-slate-600">
              {isEn
                ? 'Choose how to combine your notes safely without losing work.'
                : 'เลือกวิธีจัดการก่อนเริ่ม Auto-Sync เพื่อป้องกันข้อมูลทับกัน'}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-2.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{isEn ? 'This Device' : 'ในเครื่องนี้'}</span>
              </div>
              <div className="mt-1 text-amber-800">
                {isEn
                  ? `${conflict.localSlideCount} annotated slides • ${conflict.localPageCount} extra pages`
                  : `มีลายมือ ${conflict.localSlideCount} หน้า • หน้าเปล่า ${conflict.localPageCount} หน้า`}
              </div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-2.5">
              <div className="flex items-center gap-1.5 font-bold text-sky-900">
                <Cloud className="w-3.5 h-3.5" />
                <span>Cloud (Google)</span>
              </div>
              <div className="mt-1 text-sky-800">
                {isEn
                  ? `${conflict.cloudSlideCount} annotated slides • ${conflict.cloudPageCount} extra pages`
                  : `มีลายมือ ${conflict.cloudSlideCount} หน้า • หน้าเปล่า ${conflict.cloudPageCount} หน้า`}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => onResolve('merge')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <GitMerge className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  {isEn
                    ? 'Merge Both Together (Recommended)'
                    : 'รวมโน้ตทั้งสองฝั่งเข้าด้วยกัน (แนะนำ)'}
                </span>
              </div>
              <div className="text-xs text-emerald-800 mt-0.5 pl-6">
                {isEn
                  ? 'Keeps everything from this device and your Google Cloud account.'
                  : 'เก็บลายมือและหน้ากระดาษเปล่าจากทั้งเครื่องนี้และ Cloud ไม่ลบของเก่าทิ้ง'}
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => onResolve('use-cloud')}
              className="w-full text-left px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 transition disabled:opacity-50"
            >
              <div className="font-bold text-xs sm:text-sm">
                {isEn ? 'Use Cloud Notes Only' : 'ใช้ข้อมูลจาก Cloud แทนที่เครื่องนี้'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isEn
                  ? 'Replaces notes on this device with your Cloud notes.'
                  : 'โหลดโน้ตจาก Cloud มาทับโน้ตในเบราว์เซอร์เครื่องนี้'}
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => onResolve('use-local')}
              className="w-full text-left px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 transition disabled:opacity-50"
            >
              <div className="font-bold text-xs sm:text-sm">
                {isEn ? 'Keep This Device & Overwrite Cloud' : 'ใช้ข้อมูลเครื่องนี้ส่งขึ้นทับ Cloud'}
              </div>
              <div className="text-[11px] text-slate-500">
                {isEn
                  ? 'Uploads notes from this device to replace Cloud notes.'
                  : 'ส่งลายมือจากเครื่องนี้ไปแทนที่ข้อมูลเดิมบน Cloud'}
              </div>
            </button>
          </div>

          <div className="pt-1 flex justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={onSignOutInstead}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition disabled:opacity-50"
            >
              {isEn ? 'Cancel & Sign Out' : 'ยกเลิกและออกจากระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
