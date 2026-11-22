import type { Ch3ExtremaPresetId, Ch3ExtremaState } from '../../../types';
import { EXTREMA_PRESETS, classifySecondDeriv } from '../../../math/multivar';
import { fmtNum } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { SliderControl } from '../../SliderControl';

interface ExtremaPanelProps {
  state: Ch3ExtremaState;
  onChange: (next: Ch3ExtremaState) => void;
}

const PRESET_IDS: Ch3ExtremaPresetId[] = [
  'cubic_saddle_min',
  'quartic_two_mins',
  'double_peak',
];

export function ExtremaPanel({ state, onChange }: ExtremaPanelProps) {
  const update = (patch: Partial<Ch3ExtremaState>) => onChange({ ...state, ...patch });

  const quadCp = classifySecondDeriv(
    0,
    0,
    0,
    2 * state.quadA,
    2 * state.quadC,
    state.quadB,
  );
  const preset = EXTREMA_PRESETS[state.presetFunc];

  return (
    <div className="space-y-4">
      {/* Sub-mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => update({ subMode: 'quadratic_test' })}
          className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'quadratic_test'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          ทดลองค่า D (Ax²+Bxy+Cy²)
        </button>
        <button
          type="button"
          onClick={() => update({ subMode: 'multi_critical' })}
          className={`py-2 px-2 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'multi_critical'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          โจทย์หลายจุดวิกฤต
        </button>
      </div>

      {state.subMode === 'quadratic_test' ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'ต่ำสุด (Min)', a: 0.6, b: 0, c: 0.6 },
              { label: 'สูงสุด (Max)', a: -0.6, b: 0, c: -0.6 },
              { label: 'อานม้า (Saddle)', a: 0.6, b: 0, c: -0.6 },
              { label: 'พจน์ xy คว่ำ', a: 0.4, b: 1.4, c: 0.4 },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => update({ quadA: q.a, quadB: q.b, quadC: q.c })}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 text-[11px] font-semibold"
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              ปรับสัมประสิทธิ์ z = Ax² + Bxy + Cy²
            </div>
            <SliderControl
              label="A (สัมประสิทธิ์ x²)"
              value={state.quadA}
              min={-1}
              max={1}
              step={0.1}
              onChange={(quadA) => update({ quadA })}
            />
            <SliderControl
              label="B (สัมประสิทธิ์ xy)"
              value={state.quadB}
              min={-2}
              max={2}
              step={0.2}
              onChange={(quadB) => update({ quadB })}
            />
            <SliderControl
              label="C (สัมประสิทธิ์ y²)"
              value={state.quadC}
              min={-1}
              max={1}
              step={0.1}
              onChange={(quadC) => update({ quadC })}
            />
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
            <div className="font-bold text-slate-700 dark:text-slate-200">
              การทดสอบอนุพันธ์อันดับสองที่ (0, 0)
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 overflow-x-auto overflow-y-hidden leading-normal">
              <KaTeX
                math={`f_{xx}=${fmtNum(quadCp.fxx)},\\; f_{yy}=${fmtNum(quadCp.fyy)},\\; f_{xy}=${fmtNum(quadCp.fxy)}`}
              />
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 overflow-x-auto overflow-y-hidden leading-normal">
              <KaTeX
                math={`D = f_{xx}f_{yy} - (f_{xy})^2 = ${fmtNum(quadCp.dVal)}`}
              />
            </div>
            <div
              className="px-3 py-2 rounded-xl font-bold text-white text-center shadow-sm"
              style={{ backgroundColor: quadCp.color }}
            >
              {quadCp.label.th} ({quadCp.label.en})
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-1.5">
            {PRESET_IDS.map((pid) => {
              const p = EXTREMA_PRESETS[pid];
              const active = state.presetFunc === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => update({ presetFunc: pid })}
                  className={`px-3 py-2 rounded-xl border text-left transition text-xs flex items-center justify-between gap-2 ${
                    active
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold shadow-sm'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate">{p.name.th}</span>
                  <span className="text-[10px] opacity-75 shrink-0">{p.name.en}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
            <div className="font-bold text-slate-700 dark:text-slate-200">
              ตารางสรุปจุดวิกฤตทั้งหมด (Critical Points)
            </div>
            <div className="space-y-1.5">
              {preset.criticalPoints.map((cp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 space-y-0.5"
                  style={{ borderLeftColor: cp.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                      ({fmtNum(cp.x)}, {fmtNum(cp.y)}, {fmtNum(cp.z)})
                    </span>
                    <span className="font-bold" style={{ color: cp.color }}>
                      {cp.label.th}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    D = {fmtNum(cp.dVal)}, f_xx = {fmtNum(cp.fxx)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
