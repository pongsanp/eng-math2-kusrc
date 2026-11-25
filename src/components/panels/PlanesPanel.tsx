import type { AppLang, PlanesState } from '../../types';
import { PLANE_PRESETS } from '../../math/presets';
import { fmtNum } from '../../math/latex';
import { SliderControl } from '../SliderControl';

interface PlanesPanelProps {
  state: PlanesState;
  onChange: (next: PlanesState) => void;
  lang?: AppLang;
}

export function PlanesPanel({ state, onChange, lang = 'th' }: PlanesPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<PlanesState>) => onChange({ ...state, ...patch });

  const zeroCount = [state.a, state.b, state.c].filter((v) => Math.abs(v) < 1e-6).length;
  let specialBadge: { th: string; en: string } | null = null;
  if (zeroCount === 3) {
    specialBadge = { th: 'ไม่ใช่สมการระนาบ (A=B=C=0)', en: 'Degenerate (A=B=C=0)' };
  } else if (zeroCount === 2) {
    if (Math.abs(state.c) > 1e-6) {
      specialBadge = { th: 'ขนานระนาบ xy (ตั้งฉากแกน z)', en: 'Parallel to xy-plane (⊥ z-axis)' };
    } else if (Math.abs(state.b) > 1e-6) {
      specialBadge = { th: 'ขนานระนาบ xz (ตั้งฉากแกน y)', en: 'Parallel to xz-plane (⊥ y-axis)' };
    } else {
      specialBadge = { th: 'ขนานระนาบ yz (ตั้งฉากแกน x)', en: 'Parallel to yz-plane (⊥ x-axis)' };
    }
  } else if (zeroCount === 1) {
    const missing = Math.abs(state.a) < 1e-6 ? 'x' : Math.abs(state.b) < 1e-6 ? 'y' : 'z';
    specialBadge = { th: `ขนานแกน ${missing}`, en: `Parallel to ${missing}-axis` };
  } else if (Math.abs(state.d) < 1e-6) {
    specialBadge = { th: 'ระนาบผ่านจุดกำเนิด (0,0,0)', en: 'Passes through Origin (0,0,0)' };
  }

  const fmtIntercept = (num: number, coeff: number, axisIdx: 0 | 1 | 2) => {
    if (Math.abs(coeff) < 1e-6) return isEn ? 'None (parallel to axis)' : 'ไม่มี (ขนานแกน)';
    const v = fmtNum(num / coeff);
    if (axisIdx === 0) return `(${v}, 0, 0)`;
    if (axisIdx === 1) return `(0, ${v}, 0)`;
    return `(0, 0, ${v})`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Examples (Presets)' : 'ตัวอย่างประกอบการสอน (Presets)'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {PLANE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.value)}
              className="text-left px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-xs"
            >
              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {isEn ? p.label.en : p.label.th}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                {p.badge ?? (isEn ? p.label.th : p.label.en)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'Plane Coefficients' : 'สัมประสิทธิ์ของระนาบ (Plane Coefficients)'}
          </span>
          <span className="text-[11px] font-mono text-slate-400">Ax + By + Cz = D</span>
        </div>

        <SliderControl
          label={isEn ? 'A (x-coefficient)' : 'A (สัมประสิทธิ์ x)'}
          value={state.a}
          min={-5}
          max={5}
          step={0.5}
          accentColor="#ef4444"
          onChange={(a) => update({ a })}
        />
        <SliderControl
          label={isEn ? 'B (y-coefficient)' : 'B (สัมประสิทธิ์ y)'}
          value={state.b}
          min={-5}
          max={5}
          step={0.5}
          accentColor="#10b981"
          onChange={(b) => update({ b })}
        />
        <SliderControl
          label={isEn ? 'C (z-coefficient)' : 'C (สัมประสิทธิ์ z)'}
          value={state.c}
          min={-5}
          max={5}
          step={0.5}
          accentColor="#3b82f6"
          onChange={(c) => update({ c })}
        />
        <SliderControl
          label={isEn ? 'D (RHS constant)' : 'D (ค่าคงตัว RHS)'}
          value={state.d}
          min={-12}
          max={12}
          step={0.5}
          onChange={(d) => update({ d })}
        />
      </div>

      {specialBadge && (
        <div className="px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/70 text-xs">
          <div className="font-semibold text-indigo-800 dark:text-indigo-200">
            {isEn ? `Special Case: ${specialBadge.en}` : `ลักษณะพิเศษ: ${specialBadge.th}`}
          </div>
          {!isEn && (
            <div className="text-[11px] text-indigo-600 dark:text-indigo-300">
              {specialBadge.en}
            </div>
          )}
        </div>
      )}

      {/* Intercepts Summary Table */}
      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Axis Intercepts & Normal Vector' : 'จุดตัดแกนและเวกเตอร์แนวฉาก (Intercepts & Normal)'}
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              {isEn ? 'x-intercept' : 'จุดตัดแกน x (x-intercept)'}
            </span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {fmtIntercept(state.d, state.a, 0)}
            </span>
          </div>
          <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {isEn ? 'y-intercept' : 'จุดตัดแกน y (y-intercept)'}
            </span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {fmtIntercept(state.d, state.b, 1)}
            </span>
          </div>
          <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
            <span className="text-sky-600 dark:text-sky-400 font-medium">
              {isEn ? 'z-intercept' : 'จุดตัดแกน z (z-intercept)'}
            </span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
              {fmtIntercept(state.d, state.c, 2)}
            </span>
          </div>
          <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30">
            <span className="text-rose-700 dark:text-rose-300 font-medium">
              {isEn ? 'Normal vector n' : 'เวกเตอร์แนวฉาก (Normal n)'}
            </span>
            <span className="font-mono font-semibold text-rose-700 dark:text-rose-300">
              ⟨{fmtNum(state.a)}, {fmtNum(state.b)}, {fmtNum(state.c)}⟩
            </span>
          </div>
        </div>
      </div>

      {/* Overlay Toggles */}
      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Reference Plane (x=0 / y=0 / z=0)' : 'แสดงระนาบอ้างอิงเทียบ (x=0 / y=0 / z=0)'}
          </span>
          <input
            type="checkbox"
            checked={state.showRefPlane}
            onChange={(e) => update({ showRefPlane: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Normal Vector n' : 'แสดงเวกเตอร์แนวฉาก (Normal Vector n)'}
          </span>
          <input
            type="checkbox"
            checked={state.showNormal}
            onChange={(e) => update({ showNormal: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Axis Intercepts' : 'แสดงจุดตัดแกน (Axis Intercepts)'}
          </span>
          <input
            type="checkbox"
            checked={state.showIntercepts}
            onChange={(e) => update({ showIntercepts: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Coordinate Plane Traces (xy, xz, yz)' : 'แสดงรอยตัดระนาบพิกัด (xy, xz, yz Traces)'}
          </span>
          <input
            type="checkbox"
            checked={state.showCoordTraces}
            onChange={(e) => update({ showCoordTraces: e.target.checked })}
            className="w-4 h-4 accent-sky-600"
          />
        </label>
      </div>
    </div>
  );
}
