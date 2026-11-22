import type { Ch3PartialsState } from '../../../types';
import { MULTIVAR_FUNCS } from '../../../math/multivar';
import { fmtNum, fmtTerm } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { SliderControl } from '../../SliderControl';

interface PartialsTangentPanelProps {
  state: Ch3PartialsState;
  onChange: (next: Ch3PartialsState) => void;
}

const FUNC_IDS = ['paraboloid_down', 'saddle', 'gaussian', 'waves'] as const;

export function PartialsTangentPanel({ state, onChange }: PartialsTangentPanelProps) {
  const update = (patch: Partial<Ch3PartialsState>) => onChange({ ...state, ...patch });
  const spec = MULTIVAR_FUNCS[state.funcId];
  const z0 = spec.eval(state.x0, state.y0, 1);
  const fx0 = spec.fx(state.x0, state.y0, 1);
  const fy0 = spec.fy(state.x0, state.y0, 1);

  const zNew = spec.eval(state.x0 + state.dx, state.y0 + state.dy, 1);
  const deltaZ = zNew - z0;
  const dz = fx0 * state.dx + fy0 * state.dy;

  const tanLatex = `z = ${fmtNum(z0)}${fmtTerm(fx0, `(x ${state.x0 >= 0 ? '-' : '+'} ${fmtNum(Math.abs(state.x0))})`, false)}${fmtTerm(fy0, `(y ${state.y0 >= 0 ? '-' : '+'} ${fmtNum(Math.abs(state.y0))})`, false)}`;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          เลือกพื้นผิว z = f(x, y)
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {FUNC_IDS.map((fid) => {
            const f = MULTIVAR_FUNCS[fid];
            const active = state.funcId === fid;
            return (
              <button
                key={fid}
                type="button"
                onClick={() => update({ funcId: fid })}
                className={`px-2.5 py-2 rounded-xl border text-left transition text-xs ${
                  active
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="truncate">{f.name.th}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          จุดสัมผัส (x₀, y₀) (Base Point)
        </div>
        <SliderControl
          label="x₀"
          value={state.x0}
          min={-2.5}
          max={2.5}
          step={0.25}
          accentColor="#ef4444"
          onChange={(x0) => update({ x0 })}
        />
        <SliderControl
          label="y₀"
          value={state.y0}
          min={-2.5}
          max={2.5}
          step={0.25}
          accentColor="#10b981"
          onChange={(y0) => update({ y0 })}
        />
      </div>

      {/* Live Slopes & Tangent Plane */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="p-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/35 border border-rose-200/70 dark:border-rose-900">
            <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">
              อนุพันธ์ย่อยเทียบ x (ตรึง y = y₀)
            </div>
            <div className="font-bold text-rose-900 dark:text-rose-100 mt-0.5">
              <KaTeX math={`f_x = ${fmtNum(fx0)}`} />
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200/70 dark:border-emerald-900">
            <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              อนุพันธ์ย่อยเทียบ y (ตรึง x = x₀)
            </div>
            <div className="font-bold text-emerald-900 dark:text-emerald-100 mt-0.5">
              <KaTeX math={`f_y = ${fmtNum(fy0)}`} />
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 space-y-1">
          <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            สมการระนาบสัมผัส (Tangent Plane)
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5 text-amber-950 dark:text-amber-100">
            <KaTeX math={tanLatex} />
          </div>
        </div>
      </div>

      {/* Differential dz vs Δz */}
      <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/25 space-y-2.5 text-xs">
        <div className="font-bold text-indigo-900 dark:text-indigo-200">
          ผลต่างเชิงอนุพันธ์ (Differential: dz ≈ Δz)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SliderControl
            label="dx"
            value={state.dx}
            min={-0.5}
            max={0.5}
            step={0.05}
            onChange={(dx) => update({ dx })}
          />
          <SliderControl
            label="dy"
            value={state.dy}
            min={-0.5}
            max={0.5}
            step={0.05}
            onChange={(dy) => update({ dy })}
          />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80 flex justify-between">
            <span className="text-slate-500">ค่าประมาณ dz:</span>
            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
              {fmtNum(dz, 3)}
            </span>
          </div>
          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900/80 flex justify-between">
            <span className="text-slate-500">ค่าจริง Δz:</span>
            <span className="font-mono font-bold text-sky-700 dark:text-sky-300">
              {fmtNum(deltaZ, 3)}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Toggles */}
      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            ระนาบตัด y = y₀ & ความชัน fx (สีแดง)
          </span>
          <input
            type="checkbox"
            checked={state.showSliceX}
            onChange={(e) => update({ showSliceX: e.target.checked })}
            className="w-4 h-4 accent-rose-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            ระนาบตัด x = x₀ & ความชัน fy (สีเขียว)
          </span>
          <input
            type="checkbox"
            checked={state.showSliceY}
            onChange={(e) => update({ showSliceY: e.target.checked })}
            className="w-4 h-4 accent-emerald-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงระนาบสัมผัส (Tangent Plane — สีทอง)
          </span>
          <input
            type="checkbox"
            checked={state.showTangentPlane}
            onChange={(e) => update({ showTangentPlane: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>
      </div>
    </div>
  );
}
