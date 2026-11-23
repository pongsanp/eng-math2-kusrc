import { Pause, Play } from 'lucide-react';
import type { AppLang, Lines3DState } from '../../../types';
import {
  LINES3D_PRESETS,
  buildLineEquationsLatex,
  fmtPoint,
  vecAdd,
  vecScale,
  vecSub,
} from '../../../math/vectors';
import { KaTeX } from '../../KaTeX';
import { SliderControl } from '../../SliderControl';
import { Vec3SliderGroup } from '../../Vec3SliderGroup';

interface Lines3DPanelProps {
  state: Lines3DState;
  lang?: AppLang;
  onChange: (next: Lines3DState) => void;
}

export function Lines3DPanel({ state, lang = 'th', onChange }: Lines3DPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<Lines3DState>) => onChange({ ...state, ...patch });

  const effDir =
    state.inputMode === 'two_points' ? vecSub(state.p2, state.p0) : state.dir;
  const pt = vecAdd(state.p0, vecScale(effDir, state.t));
  const eqs = buildLineEquationsLatex(state.p0, effDir, lang);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Presets' : 'ตัวอย่างประกอบการสอน (Presets)'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {LINES3D_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ ...p.value, isAnimatingT: false })}
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

      {/* Input Mode */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => update({ inputMode: 'point_dir' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.inputMode === 'point_dir'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isEn ? 'Point P₀ + Vector v' : 'จุด P₀ + เวกเตอร์ v'}
        </button>
        <button
          type="button"
          onClick={() => update({ inputMode: 'two_points' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.inputMode === 'two_points'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isEn ? 'Two Points (P₀, P₂)' : 'ผ่านจุด 2 จุด (P₀, P₂)'}
        </button>
      </div>

      <Vec3SliderGroup
        title={isEn ? 'Reference Point P₀ (Blue)' : 'จุดอ้างอิง P₀ (สีฟ้า)'}
        value={state.p0}
        isPoint
        min={-3.5}
        max={3.5}
        lang={lang}
        badgeColor="text-sky-600 dark:text-sky-400"
        onChange={(p0) => update({ p0 })}
      />

      {state.inputMode === 'point_dir' ? (
        <Vec3SliderGroup
          title={isEn ? 'Direction Vector v = ⟨a, b, c⟩ (Green)' : 'เวกเตอร์ทิศทาง v = ⟨a, b, c⟩ (สีเขียว)'}
          value={state.dir}
          min={-3}
          max={3}
          lang={lang}
          badgeColor="text-emerald-600 dark:text-emerald-400"
          onChange={(dir) => update({ dir })}
        />
      ) : (
        <Vec3SliderGroup
          title={isEn ? 'Second Point P₂ (Green)' : 'จุดที่สอง P₂ (สีเขียว)'}
          value={state.p2}
          isPoint
          min={-3.5}
          max={3.5}
          lang={lang}
          badgeColor="text-emerald-600 dark:text-emerald-400"
          onChange={(p2) => update({ p2 })}
        />
      )}

      {/* Parameter t Slider + Animation */}
      <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/25 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
            {isEn ? 'Parameter t Along the Line' : 'พารามิเตอร์ t บนเส้นตรง'}
          </span>
          <button
            type="button"
            onClick={() => update({ isAnimatingT: !state.isAnimatingT })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition"
          >
            {state.isAnimatingT ? (
              <>
                <Pause className="w-3.5 h-3.5" /> {isEn ? 'Pause' : 'หยุด'}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> {isEn ? 'Animate P(t)' : 'เล่นจุด P(t)'}
              </>
            )}
          </button>
        </div>

        <SliderControl
          label={isEn ? 'Parameter t' : 'ค่า t (Parameter)'}
          value={state.t}
          min={-2}
          max={2}
          step={0.1}
          accentColor="#f59e0b"
          onChange={(t) => update({ t, isAnimatingT: false })}
        />

        <div className="flex justify-between items-center text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {isEn ? 'Point P(t):' : 'พิกัดจุด P(t):'}
          </span>
          <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
            {fmtPoint(pt)}
          </span>
        </div>
      </div>

      {/* 3 Line Equation Forms */}
      <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2 text-xs">
        <div className="font-bold text-indigo-900 dark:text-indigo-200">
          {isEn ? 'Three Forms of a 3D Line' : 'สมการเส้นตรง 3 รูปแบบ (3 Forms of 3D Line)'}
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            {isEn ? '1. Vector Equation' : '1. สมการเวกเตอร์ (Vector Equation)'}
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5">
            <KaTeX math={eqs.vector} />
          </div>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            {isEn ? '2. Parametric Equations' : '2. สมการอิงตัวแปรเสริม (Parametric Equations)'}
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5 text-sky-700 dark:text-sky-300">
            <KaTeX math={eqs.parametric} />
          </div>
        </div>
        <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
            {isEn ? '3. Symmetric Equations' : '3. สมการสมมาตร (Symmetric Equations)'}
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal py-1 text-emerald-700 dark:text-emerald-300">
            <KaTeX math={eqs.symmetric} />
          </div>
        </div>
      </div>

      <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {isEn
            ? 'Show Position Vectors r₀, tv, r(t)'
            : 'แสดงเวกเตอร์ตำแหน่ง r₀, tv, r(t) (Position Vectors)'}
        </span>
        <input
          type="checkbox"
          checked={state.showPositionVectors}
          onChange={(e) => update({ showPositionVectors: e.target.checked })}
          className="w-4 h-4 accent-indigo-600"
        />
      </label>
    </div>
  );
}
