import { ArrowLeftRight } from 'lucide-react';
import type { AppLang, CrossTripleState } from '../../../types';
import {
  CROSS_TRIPLE_PRESETS,
  fmtVecAngle,
  scalarTriple,
  vecCross,
  vecNorm,
} from '../../../math/vectors';
import { fmtNum } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { Vec3SliderGroup } from '../../Vec3SliderGroup';

interface CrossTriplePanelProps {
  state: CrossTripleState;
  lang?: AppLang;
  onChange: (next: CrossTripleState) => void;
}

export function CrossTriplePanel({ state, lang = 'th', onChange }: CrossTriplePanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<CrossTripleState>) => onChange({ ...state, ...patch });

  const a = state.reverseOrder ? state.v : state.u;
  const b = state.reverseOrder ? state.u : state.v;
  const cross = vecCross(a, b);
  const area = vecNorm(cross);
  const triple = scalarTriple(state.u, state.v, state.w);
  const volume = Math.abs(triple);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Presets' : 'ตัวอย่างประกอบการสอน (Presets)'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {CROSS_TRIPLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.value)}
              className="text-left px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-xs"
            >
              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {isEn ? p.label.en : p.label.th}
              </div>
              {!isEn && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {p.label.en}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => update({ subMode: 'cross' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'cross'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isEn ? 'Cross Product (u × v)' : 'ผลคูณไขว้ (u × v)'}
        </button>
        <button
          type="button"
          onClick={() => update({ subMode: 'triple' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'triple'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isEn ? 'Triple Product (Volume)' : '3 เวกเตอร์ (ปริมาตร)'}
        </button>
      </div>

      <Vec3SliderGroup
        title={isEn ? 'Vector u (Blue)' : 'เวกเตอร์ u (สีฟ้า)'}
        value={state.u}
        min={-3}
        max={3}
        lang={lang}
        badgeColor="text-sky-600 dark:text-sky-400"
        onChange={(u) => update({ u })}
      />

      <Vec3SliderGroup
        title={isEn ? 'Vector v (Green)' : 'เวกเตอร์ v (สีเขียว)'}
        value={state.v}
        min={-3}
        max={3}
        lang={lang}
        badgeColor="text-emerald-600 dark:text-emerald-400"
        onChange={(v) => update({ v })}
      />

      {state.subMode === 'triple' && (
        <Vec3SliderGroup
          title={isEn ? 'Vector w (Amber)' : 'เวกเตอร์ w (สีเหลืองอำพัน)'}
          value={state.w}
          min={-3}
          max={3}
          lang={lang}
          badgeColor="text-amber-600 dark:text-amber-400"
          onChange={(w) => update({ w })}
        />
      )}

      {state.subMode === 'cross' ? (
        <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/25 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-rose-900 dark:text-rose-200">
              {isEn ? 'Cross Product (Right-Hand Rule)' : 'ผลคูณไขว้ (กฎมือขวา)'}
            </span>
            <button
              type="button"
              onClick={() => update({ reverseOrder: !state.reverseOrder })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {isEn ? 'Swap' : 'สลับ'} {state.reverseOrder ? 'v × u → u × v' : 'u × v → v × u'}
            </button>
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 overflow-x-auto overflow-y-hidden leading-normal">
            <KaTeX
              math={`${state.reverseOrder ? '\\mathbf{v} \\times \\mathbf{u}' : '\\mathbf{u} \\times \\mathbf{v}'} = ${fmtVecAngle(cross)}`}
            />
          </div>
          <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {isEn ? 'Parallelogram Area' : 'พื้นที่สี่เหลี่ยมด้านขนาน'}
            </span>
            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
              ||u × v|| = {fmtNum(area)}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/25 space-y-2 text-xs">
          <div className="font-bold text-violet-900 dark:text-violet-200">
            {isEn ? 'Scalar Triple Product' : 'ผลคูณเชิงสเกลาร์ของ 3 เวกเตอร์ (Scalar Triple Product)'}
          </div>
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 overflow-x-auto overflow-y-hidden leading-normal">
            <KaTeX math={`\\mathbf{u} \\cdot (\\mathbf{v} \\times \\mathbf{w}) = ${fmtNum(triple)}`} />
          </div>
          <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {isEn ? 'Parallelepiped Volume' : 'ปริมาตรทรงสี่เหลี่ยมด้านขนาน'}
            </span>
            <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
              V = {fmtNum(volume)}
            </span>
          </div>
          {volume < 1e-4 && (
            <div className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold">
              {isEn
                ? 'All three vectors are coplanar (V = 0)'
                : 'ทั้ง 3 เวกเตอร์อยู่บนระนาบเดียวกัน (Coplanar, V = 0)'}
            </div>
          )}
        </div>
      )}

      <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isEn
            ? state.subMode === 'cross'
              ? 'Show Parallelogram Area'
              : 'Show Parallelepiped Volume'
            : state.subMode === 'cross'
              ? 'แสดงพื้นที่สี่เหลี่ยมด้านขนาน (Parallelogram)'
              : 'แสดงกล่องทรงสี่เหลี่ยมด้านขนาน (Parallelepiped)'}
        </span>
        <input
          type="checkbox"
          checked={state.showAreaOrVolume}
          onChange={(e) => update({ showAreaOrVolume: e.target.checked })}
          className="w-4 h-4 accent-sky-600"
        />
      </label>
    </div>
  );
}
