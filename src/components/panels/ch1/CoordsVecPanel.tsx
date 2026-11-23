import type { AppLang, CoordsVecState } from '../../../types';
import {
  COORDS_VEC_PRESETS,
  SINGLE_POINT_PRESETS,
  fmtNormExactOrDecimal,
  fmtPoint,
  fmtVecAngle,
  fmtVecIJK,
  getOctant,
  vecSub,
  vecUnit,
} from '../../../math/vectors';
import { KaTeX } from '../../KaTeX';
import { Vec3SliderGroup } from '../../Vec3SliderGroup';

interface CoordsVecPanelProps {
  state: CoordsVecState;
  lang?: AppLang;
  onChange: (next: CoordsVecState) => void;
}

export function CoordsVecPanel({ state, lang = 'th', onChange }: CoordsVecPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<CoordsVecState>) => onChange({ ...state, ...patch });
  const v = vecSub(state.p2, state.p1);
  const uHat = vecUnit(v);
  const oct1 = getOctant(state.p1);
  const oct2 = getOctant(state.p2);

  return (
    <div className="space-y-4">
      {/* Sub-mode Toggle: Point Plotting vs Vector */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => update({ subMode: 'single_point' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'single_point'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isEn ? 'Plot Point (3D)' : 'จุดใน 3 มิติ (Plot Point)'}
        </button>
        <button
          type="button"
          onClick={() => update({ subMode: 'vector' })}
          className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
            state.subMode === 'vector'
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          }`}
        >
          {isEn ? 'Vector P₁P₂' : 'เวกเตอร์ P₁P₂ (Vector)'}
        </button>
      </div>

      {state.subMode === 'single_point' ? (
        <>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {isEn ? 'Point Presets' : 'ตัวอย่างตำแหน่งจุด (Point Presets)'}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SINGLE_POINT_PRESETS.map((p) => (
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

          <Vec3SliderGroup
            title={isEn ? 'Point Coordinates P(x, y, z)' : 'พิกัดจุด P(x, y, z)'}
            value={state.p2}
            isPoint
            lang={lang}
            badgeColor="text-amber-600 dark:text-amber-400"
            onChange={(p2) => update({ p2 })}
          />

          {/* Step-by-step plotting walkthrough */}
          <div className="p-3.5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/25 space-y-2.5 text-xs">
            <div className="font-bold text-sky-900 dark:text-sky-200">
              {isEn ? 'Step-by-Step Plotting Guide' : 'ลำดับการพล็อตจุดทีละขั้น (Step-by-Step)'}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(isEn
                ? [
                    { step: 1, title: 'Step 1: x-axis', sub: 'Along x' },
                    { step: 2, title: 'Step 2: xy-plane', sub: 'Parallel y' },
                    { step: 3, title: 'Step 3: Point P', sub: 'Parallel z' },
                  ]
                : [
                    { step: 1, title: 'ขั้น 1: แกน x', sub: 'เดินตาม x' },
                    { step: 2, title: 'ขั้น 2: ระนาบ xy', sub: 'เลื่อนตาม y' },
                    { step: 3, title: 'ขั้น 3: จุด P', sub: 'ยกขึ้นตาม z' },
                  ] as const
              ).map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => update({ plotStep: item.step as 1 | 2 | 3 })}
                  className={`py-2 px-1.5 rounded-xl border text-center transition ${
                    state.plotStep === item.step
                      ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{item.title}</div>
                  <div className="text-[10px] opacity-80">{item.sub}</div>
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {state.plotStep === 1 &&
                (isEn
                  ? `1) Start from (0,0,0) and move along the x-axis to (${state.p2[0]}, 0, 0)`
                  : `1) เริ่มจาก (0,0,0) เดินตามแกน x ไปที่ (${state.p2[0]}, 0, 0)`)}
              {state.plotStep === 2 &&
                (isEn
                  ? `2) Next, move parallel to the y-axis in the xy-plane to (${state.p2[0]}, ${state.p2[1]}, 0)`
                  : `2) จากนั้นเลื่อนขนานแกน y บนระนาบ xy ไปที่ (${state.p2[0]}, ${state.p2[1]}, 0)`)}
              {state.plotStep === 3 &&
                (isEn
                  ? `3) Finally, move parallel to the z-axis to point P${fmtPoint(state.p2)}`
                  : `3) สุดท้ายยกขึ้น/ลงขนานแกน z ไปที่จุด P${fmtPoint(state.p2)}`)}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2 text-xs">
            <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-sky-50/80 dark:bg-sky-950/40">
              <span className="font-semibold text-sky-700 dark:text-sky-300">
                {isEn ? 'Octant' : 'ตำแหน่งอัฐภาค'}
              </span>
              <span className="font-bold text-sky-900 dark:text-sky-100">
                {isEn ? oct2.en : `${oct2.th} (${oct2.en})`}
              </span>
            </div>
            <div className="flex justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {isEn ? 'Distance from Origin' : 'ระยะจากจุดกำเนิด'}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                <KaTeX math={`d(O,P) = ${fmtNormExactOrDecimal(state.p2)}`} />
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {isEn ? 'Show Coordinate Box' : 'แสดงกล่องเส้นประพิกัด (Coordinate Box)'}
              </span>
              <input
                type="checkbox"
                checked={state.showCoordBox}
                onChange={(e) => update({ showCoordBox: e.target.checked })}
                className="w-4 h-4 accent-sky-600"
              />
            </label>
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {isEn
                  ? 'Show Plane Projections (xy, xz, yz)'
                  : 'แสดงจุดฉายบนระนาบ xy, xz, yz (Projections)'}
              </span>
              <input
                type="checkbox"
                checked={state.showPlaneProjections}
                onChange={(e) => update({ showPlaneProjections: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>
          </div>
        </>
      ) : (
        <>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              {isEn ? 'Presets' : 'ตัวอย่างประกอบการสอน (Presets)'}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {COORDS_VEC_PRESETS.map((p) => (
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

          <Vec3SliderGroup
            title={isEn ? 'Initial Point P₁' : 'จุดเริ่มต้น P₁ (Initial Point)'}
            value={state.p1}
            isPoint
            lang={lang}
            badgeColor="text-indigo-600 dark:text-indigo-400"
            onChange={(p1) => update({ p1 })}
          />

          <Vec3SliderGroup
            title={isEn ? 'Terminal Point P₂' : 'จุดปลาย P₂ (Terminal Point)'}
            value={state.p2}
            isPoint
            lang={lang}
            badgeColor="text-sky-600 dark:text-sky-400"
            onChange={(p2) => update({ p2 })}
          />

          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="px-2.5 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900">
                <div className="text-[10px] text-indigo-600 dark:text-indigo-300 font-semibold">
                  {isEn ? 'Location of P₁' : 'ตำแหน่ง P₁'}
                </div>
                <div className="font-bold text-indigo-900 dark:text-indigo-100 truncate">
                  {isEn ? oct1.en : oct1.th}
                </div>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-900">
                <div className="text-[10px] text-sky-600 dark:text-sky-300 font-semibold">
                  {isEn ? 'Location of P₂' : 'ตำแหน่ง P₂'}
                </div>
                <div className="font-bold text-sky-900 dark:text-sky-100 truncate">
                  {isEn ? oct2.en : oct2.th}
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {isEn
                  ? 'Vector Component & Standard Basis (i, j, k)'
                  : 'เวกเตอร์ (Vector Component & i, j, k Form)'}
              </div>
              <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5 text-slate-800 dark:text-slate-100">
                <KaTeX math={`\\overrightarrow{P_1P_2} = ${fmtVecAngle(v)} = ${fmtVecIJK(v)}`} />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {isEn ? 'Magnitude / Distance:' : 'ขนาด / ระยะทาง:'}
              </span>
              <span className="text-sky-700 dark:text-sky-300 font-semibold">
                <KaTeX math={`\\|\\mathbf{v}\\| = ${fmtNormExactOrDecimal(v)}`} />
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 space-y-1">
              <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                {isEn ? 'Unit Vector (û = v / ||v||)' : 'เวกเตอร์หนึ่งหน่วย (Unit Vector û = v / ||v||)'}
              </div>
              <div className="overflow-x-auto overflow-y-hidden leading-normal py-0.5 text-amber-900 dark:text-amber-100">
                <KaTeX
                  math={
                    uHat
                      ? `\\hat{\\mathbf{u}} = ${fmtVecAngle(uHat)}`
                      : isEn
                        ? '\\text{None (Zero Vector)}'
                        : '\\text{ไม่มี (เวกเตอร์ศูนย์)}'
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {isEn ? 'Show Coordinate Box' : 'แสดงกล่องเส้นประพิกัด (Coordinate Box)'}
              </span>
              <input
                type="checkbox"
                checked={state.showCoordBox}
                onChange={(e) => update({ showCoordBox: e.target.checked })}
                className="w-4 h-4 accent-sky-600"
              />
            </label>
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {isEn ? 'Show Position Vector at Origin' : 'แสดงเวกเตอร์ตำแหน่งที่จุดกำเนิด (Position Vector)'}
              </span>
              <input
                type="checkbox"
                checked={state.showPositionVec}
                onChange={(e) => update({ showPositionVec: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
            </label>
            <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {isEn ? 'Show Unit Vector û' : 'แสดงเวกเตอร์หนึ่งหน่วย û (Unit Vector)'}
              </span>
              <input
                type="checkbox"
                checked={state.showUnitVec}
                onChange={(e) => update({ showUnitVec: e.target.checked })}
                className="w-4 h-4 accent-amber-500"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
