import { Pause, Play } from 'lucide-react';
import type { AppLang, Ch3LimitFuncId, Ch3LimitsState } from '../../../types';
import { LIMIT_FUNCS, evaluatePathLimit } from '../../../math/multivar';
import { fmtNum } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { SliderControl } from '../../SliderControl';

interface LimitsPanelProps {
  state: Ch3LimitsState;
  onChange: (next: Ch3LimitsState) => void;
  lang?: AppLang;
}

const LIMIT_IDS: Ch3LimitFuncId[] = ['xy_over_r2', 'x2y_over_x4y2', 'sinc_r2'];

export function LimitsPanel({ state, onChange, lang = 'th' }: LimitsPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<Ch3LimitsState>) => onChange({ ...state, ...patch });
  const spec = LIMIT_FUNCS[state.funcId];
  const evalRes = evaluatePathLimit(state.funcId, state.pathType, state.pathParam, lang);
  const yCur =
    state.pathType === 'line'
      ? state.pathParam * state.approachT
      : state.pathParam * state.approachT * state.approachT;
  const zCur =
    Math.abs(state.approachT) < 0.025
      ? evalRes.limitVal
      : spec.eval(state.approachT, yCur);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Limit Examples Near (0, 0)' : 'โจทย์ตัวอย่างลิมิตเข้าใกล้ (0, 0)'}
        </h3>
        <div className="grid grid-cols-1 gap-1.5">
          {LIMIT_IDS.map((fid) => {
            const f = LIMIT_FUNCS[fid];
            const active = state.funcId === fid;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => update({ funcId: fid })}
                className={`px-3 py-2 rounded-xl border text-left transition text-xs ${
                  active
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="truncate">{isEn ? f.name.en : f.name.th}</div>
                {!isEn && <div className="text-[10px] opacity-75 truncate">{f.name.en}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Path Type */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Approach Path to (0, 0)' : 'เลือกเส้นทางเข้าใกล้ (0, 0) (Approach Path)'}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => update({ pathType: 'line' })}
            className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
              state.pathType === 'line'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isEn ? 'Line y = mx' : 'เส้นตรง y = mx'}
          </button>
          <button
            type="button"
            onClick={() => update({ pathType: 'parabola' })}
            className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
              state.pathType === 'parabola'
                ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {isEn ? 'Parabola y = kx²' : 'พาราโบลา y = kx²'}
          </button>
        </div>

        <SliderControl
          label={
            isEn
              ? state.pathType === 'line'
                ? 'Slope m (in y = mx)'
                : 'Coefficient k (in y = kx²)'
              : state.pathType === 'line'
                ? 'ความชัน m (ใน y = mx)'
                : 'สัมประสิทธิ์ k (ใน y = kx²)'
          }
          value={state.pathParam}
          min={-2}
          max={2}
          step={0.25}
          accentColor="#f59e0b"
          onChange={(pathParam) => update({ pathParam })}
        />

        {/* Quick compare buttons */}
        <div className="flex gap-1.5">
          {[-1, 0, 1].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => update({ pathParam: v })}
              className="flex-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold hover:border-amber-400"
            >
              {state.pathType === 'line' ? `m = ${v}` : `k = ${v}`}
            </button>
          ))}
        </div>
      </div>

      {/* Approach Slider + Animation */}
      <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/25 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
            {isEn ? 'Move Point Toward (0, 0) (Approach x → 0)' : 'เลื่อนจุดเข้าใกล้ (0, 0) (Approach x → 0)'}
          </span>
          <button
            type="button"
            onClick={() => update({ isAnimatingApproach: !state.isAnimatingApproach })}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
          >
            {state.isAnimatingApproach ? (
              <>
                <Pause className="w-3.5 h-3.5" /> {isEn ? 'Pause' : 'หยุด'}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> {isEn ? 'Animate → (0,0)' : 'เล่นเข้าหา (0,0)'}
              </>
            )}
          </button>
        </div>

        <SliderControl
          label={isEn ? 'x-coordinate (approaching 0)' : 'ค่าพิกัด x (เข้าใกล้ 0)'}
          value={state.approachT}
          min={-2}
          max={2}
          step={0.05}
          accentColor="#f43f5e"
          onChange={(approachT) => update({ approachT, isAnimatingApproach: false })}
        />

        <div className="flex justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80">
          <span className="text-slate-600 dark:text-slate-300 font-semibold">
            {isEn ? 'Current Point' : 'จุดปัจจุบัน'} (x, y) = ({fmtNum(state.approachT)}, {fmtNum(yCur)})
          </span>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-300">
            z ≈ {fmtNum(zCur)}
          </span>
        </div>
      </div>

      {/* Path Calculation & Existence Badge */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
        <div className="font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Limit Along Path' : 'ลิมิตตามเส้นทาง'} <KaTeX math={evalRes.pathLatex} />
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 overflow-x-auto overflow-y-hidden leading-normal">
          <KaTeX math={evalRes.derivationLatex} />
        </div>
        <div
          className={`px-3 py-2 rounded-xl font-semibold border ${
            spec.exists
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          }`}
        >
          {isEn
            ? spec.exists
              ? 'Conclusion: Limit exists (L = 2 along every path)'
              : 'Conclusion: Limit Does Not Exist (DNE) — value depends on approach path'
            : spec.exists
              ? 'สรุป: ลิมิตหาค่าได้ (L = 2 เท่ากันทุกเส้นทาง)'
              : 'สรุป: ลิมิตหาค่าไม่ได้ (DNE) — เมื่อเปลี่ยนเส้นทางค่าลิมิตเปลี่ยน'}
        </div>
      </div>
    </div>
  );
}
