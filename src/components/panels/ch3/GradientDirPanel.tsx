import type { Ch3GradientState } from '../../../types';
import { MULTIVAR_FUNCS } from '../../../math/multivar';
import { fmtNum } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { SliderControl } from '../../SliderControl';

interface GradientDirPanelProps {
  state: Ch3GradientState;
  onChange: (next: Ch3GradientState) => void;
}

const FUNC_IDS = ['gaussian', 'paraboloid_down', 'saddle', 'waves'] as const;

export function GradientDirPanel({ state, onChange }: GradientDirPanelProps) {
  const update = (patch: Partial<Ch3GradientState>) => onChange({ ...state, ...patch });
  const spec = MULTIVAR_FUNCS[state.funcId];
  const gx = spec.fx(state.x0, state.y0, 1);
  const gy = spec.fy(state.x0, state.y0, 1);
  const gNorm = Math.hypot(gx, gy);

  const rad = (state.thetaDeg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const duf = gx * ux + gy * uy;

  const setGradAngle = (offsetDeg: number) => {
    if (gNorm < 1e-6) return;
    let deg = ((Math.atan2(gy, gx) * 180) / Math.PI + offsetDeg) % 360;
    if (deg < 0) deg += 360;
    update({ thetaDeg: Math.round(deg) });
  };

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
          ตำแหน่งจุด (x₀, y₀)
        </div>
        <SliderControl
          label="x₀"
          value={state.x0}
          min={-2.5}
          max={2.5}
          step={0.25}
          onChange={(x0) => update({ x0 })}
        />
        <SliderControl
          label="y₀"
          value={state.y0}
          min={-2.5}
          max={2.5}
          step={0.25}
          onChange={(y0) => update({ y0 })}
        />
      </div>

      <div className="p-3.5 rounded-2xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/40 dark:bg-violet-950/25 space-y-2.5">
        <SliderControl
          label="มุมทิศทาง θ ของ u = ⟨cos θ, sin θ⟩"
          value={state.thetaDeg}
          min={0}
          max={360}
          step={5}
          accentColor="#8b5cf6"
          onChange={(thetaDeg) => update({ thetaDeg })}
        />

        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setGradAngle(0)}
            disabled={gNorm < 1e-6}
            className="py-1.5 px-1.5 rounded-xl border border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-200 text-[11px] font-bold hover:bg-orange-100 disabled:opacity-40"
          >
            ทิศ ∇f (ชันสุด)
          </button>
          <button
            type="button"
            onClick={() => setGradAngle(180)}
            disabled={gNorm < 1e-6}
            className="py-1.5 px-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 text-[11px] font-bold hover:bg-rose-100 disabled:opacity-40"
          >
            ทิศ -∇f (ลงสุด)
          </button>
          <button
            type="button"
            onClick={() => setGradAngle(90)}
            disabled={gNorm < 1e-6}
            className="py-1.5 px-1.5 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-200 text-[11px] font-bold hover:bg-sky-100 disabled:opacity-40"
          >
            ตั้งฉาก ∇f (=0)
          </button>
        </div>
      </div>

      {/* Readouts */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
        <div className="p-2.5 rounded-xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/70 dark:border-orange-900/60 space-y-1">
          <div className="text-[11px] font-semibold text-orange-800 dark:text-orange-300">
            เวกเตอร์เกรเดียนต์ (Gradient Vector — ตั้งฉากเส้นชั้นระดับเสมอ)
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal">
            <KaTeX math={`\\nabla f = \\langle ${fmtNum(gx)},\\, ${fmtNum(gy)} \\rangle,\\quad \\|\\nabla f\\| = ${fmtNum(gNorm)}`} />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200/70 dark:border-violet-900/60 space-y-1">
          <div className="text-[11px] font-semibold text-violet-800 dark:text-violet-300">
            อนุพันธ์ระบุทิศ (Directional Derivative D_u f = ∇f · u)
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal">
            <KaTeX math={`D_{\\mathbf{u}}f = ${fmtNum(duf)} \\quad (\\text{สูงสุด } +${fmtNum(gNorm)},\\; \\text{ต่ำสุด } -${fmtNum(gNorm)})`} />
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงลูกศร ∇f บนระนาบ xy (สีส้ม)
          </span>
          <input
            type="checkbox"
            checked={state.showGradient}
            onChange={(e) => update({ showGradient: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงเส้นชั้นระดับผ่านจุด P₀ (Level Curve)
          </span>
          <input
            type="checkbox"
            checked={state.showLevelCurve}
            onChange={(e) => update({ showLevelCurve: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงเวกเตอร์สัมผัสความชัน D_u f บนผิว (สีม่วง)
          </span>
          <input
            type="checkbox"
            checked={state.showDirectionalTangent}
            onChange={(e) => update({ showDirectionalTangent: e.target.checked })}
            className="w-4 h-4 accent-violet-600"
          />
        </label>
      </div>
    </div>
  );
}
