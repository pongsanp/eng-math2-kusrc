import type { DotProjState } from '../../../types';
import {
  DOT_PROJ_PRESETS,
  fmtVecAngle,
  vecAngleDeg,
  vecDot,
  vecNorm,
  vecProj,
} from '../../../math/vectors';
import { fmtNum } from '../../../math/latex';
import { KaTeX } from '../../KaTeX';
import { Vec3SliderGroup } from '../../Vec3SliderGroup';

interface DotProjPanelProps {
  state: DotProjState;
  onChange: (next: DotProjState) => void;
}

export function DotProjPanel({ state, onChange }: DotProjPanelProps) {
  const update = (patch: Partial<DotProjState>) => onChange({ ...state, ...patch });
  const dot = vecDot(state.u, state.v);
  const angle = vecAngleDeg(state.u, state.v);
  const proj = vecProj(state.u, state.v);
  const uNorm = vecNorm(state.u);

  const isOrthogonal =
    uNorm > 1e-4 && vecNorm(state.v) > 1e-4 && Math.abs(dot) < 1e-5;

  const alpha = vecAngleDeg(state.u, [1, 0, 0]);
  const beta = vecAngleDeg(state.u, [0, 1, 0]);
  const gamma = vecAngleDeg(state.u, [0, 0, 1]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          ตัวอย่างประกอบการสอน (Presets)
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {DOT_PROJ_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update(p.value)}
              className="text-left px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-xs"
            >
              <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                {p.label.th}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {p.label.en}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sub-mode Toggle */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => update({ subMode: 'dot_proj' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'dot_proj'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          ผลคูณจุด & การฉาย (Dot)
        </button>
        <button
          type="button"
          onClick={() => update({ subMode: 'dir_angles' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'dir_angles'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          มุมบอกทิศทาง (α, β, γ)
        </button>
      </div>

      <Vec3SliderGroup
        title="เวกเตอร์ u (สีฟ้า)"
        value={state.u}
        min={-3.5}
        max={3.5}
        badgeColor="text-sky-600 dark:text-sky-400"
        onChange={(u) => update({ u })}
      />

      {state.subMode === 'dot_proj' ? (
        <>
          <Vec3SliderGroup
            title="เวกเตอร์ v (สีเขียว — ฐานการฉาย)"
            value={state.v}
            min={-3.5}
            max={3.5}
            badgeColor="text-emerald-600 dark:text-emerald-400"
            onChange={(v) => update({ v })}
          />

          {isOrthogonal && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              ตั้งฉากกัน (Orthogonal): u · v = 0 และ θ = 90°
            </div>
          )}

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
            <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-600 dark:text-slate-300">ผลคูณจุด (u · v)</span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-300">
                {fmtNum(dot)}
              </span>
            </div>
            <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-600 dark:text-slate-300">มุมระหว่างเวกเตอร์ (θ)</span>
              <span className="font-mono font-bold text-violet-700 dark:text-violet-300">
                {angle !== null ? `${fmtNum(angle, 1)}°` : '—'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 space-y-1">
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                การฉายเชิงตั้งฉาก (Vector Projection)
              </div>
              <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5 text-amber-900 dark:text-amber-100">
                <KaTeX
                  math={
                    proj
                      ? `\\operatorname{proj}_{\\mathbf{v}}\\mathbf{u} = ${fmtVecAngle(proj)}`
                      : '\\text{ไม่สามารถฉายได้ (v = 0)}'
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                แสดงเวกเตอร์ฉาย (proj_v u)
              </span>
              <input
                type="checkbox"
                checked={state.showProjection}
                onChange={(e) => update({ showProjection: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </label>
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                แสดงส่วนโค้งมุม θ (Angle Arc)
              </span>
              <input
                type="checkbox"
                checked={state.showAngleArc}
                onChange={(e) => update({ showAngleArc: e.target.checked })}
                className="w-4 h-4 accent-violet-600"
              />
            </label>
          </div>
        </>
      ) : (
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
          <div className="font-bold text-slate-700 dark:text-slate-200">
            มุมและโคไซน์แสดงทิศทาง (Direction Angles & Cosines)
          </div>
          {uNorm > 1e-4 && alpha !== null && beta !== null && gamma !== null ? (
            <>
              <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30">
                <span className="font-semibold text-rose-700 dark:text-rose-300">α (เทียบแกน +x)</span>
                <span className="font-mono font-bold text-rose-700 dark:text-rose-300">
                  {fmtNum(alpha, 1)}° (cos α = {fmtNum(state.u[0] / uNorm)})
                </span>
              </div>
              <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30">
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">β (เทียบแกน +y)</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {fmtNum(beta, 1)}° (cos β = {fmtNum(state.u[1] / uNorm)})
                </span>
              </div>
              <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/30">
                <span className="font-semibold text-sky-700 dark:text-sky-300">γ (เทียบแกน +z)</span>
                <span className="font-mono font-bold text-sky-700 dark:text-sky-300">
                  {fmtNum(gamma, 1)}° (cos γ = {fmtNum(state.u[2] / uNorm)})
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center overflow-x-auto overflow-y-hidden leading-normal">
                <KaTeX math={`\\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1`} />
              </div>
            </>
          ) : (
            <div className="text-amber-700 dark:text-amber-300">
              กรุณาปรับ u ไม่ให้เป็นเวกเตอร์ศูนย์
            </div>
          )}
        </div>
      )}
    </div>
  );
}
