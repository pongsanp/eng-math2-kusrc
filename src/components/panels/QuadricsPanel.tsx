import { Eye, EyeOff } from 'lucide-react';
import type { AppLang, AxisName, QuadricMode, QuadricsState } from '../../types';
import { getQuadricInterceptRows } from '../../math/intercepts';
import { buildQuadricEquationLatex, buildQuadricGeneralLatex } from '../../math/latex';
import { QUADRIC_INFO, QUADRIC_PRESETS } from '../../math/presets';
import { axisVarNames } from '../../math/coords';
import { AxisInterceptsBox } from '../AxisInterceptsBox';
import { KaTeX } from '../KaTeX';
import { SliderControl } from '../SliderControl';

interface QuadricsPanelProps {
  state: QuadricsState;
  onChange: (next: QuadricsState) => void;
  lang?: AppLang;
}

const QUADRIC_MODES: QuadricMode[] = [
  'ellipsoid',
  'cone',
  'elliptic_paraboloid',
  'hyperbolic_paraboloid',
  'hyperboloid_1',
  'hyperboloid_2',
  'morph',
];

const AXES: AxisName[] = ['x', 'y', 'z'];

export function QuadricsPanel({ state, onChange, lang = 'th' }: QuadricsPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<QuadricsState>) => onChange({ ...state, ...patch });
  const { u, v, w } = axisVarNames(state.symmetryAxis);
  const info = QUADRIC_INFO[state.mode];

  const isEllipsoid = state.mode === 'ellipsoid';
  const isParaboloid =
    state.mode === 'elliptic_paraboloid' || state.mode === 'hyperbolic_paraboloid';
  const hideSolution = state.quizMode && !state.quizRevealed;

  const generalLatex = buildQuadricGeneralLatex(state);
  const standardLatex = buildQuadricEquationLatex(state);
  const interceptRows = getQuadricInterceptRows(state);

  let morphStatus = '';
  if (state.mode === 'morph') {
    if (Math.abs(state.morphD) < 0.04) {
      morphStatus = isEn ? 'd = 0 → Elliptic Cone' : 'd = 0 → กรวยเชิงวงรี (Elliptic Cone)';
    } else if (state.morphD > 0) {
      morphStatus = isEn ? 'd > 0 → 1-Sheet Hyperboloid' : 'd > 0 → ไฮเพอร์โบลอยด์ 1 ชิ้น (1-Sheet)';
    } else {
      morphStatus = isEn ? 'd < 0 → 2-Sheet Hyperboloid' : 'd < 0 → ไฮเพอร์โบลอยด์ 2 ชิ้น (2-Sheet)';
    }
  }

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Examples (Presets)' : 'ตัวอย่างประกอบการสอน (Presets)'}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {QUADRIC_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                update({
                  ...p.value,
                  quizRevealed: state.quizMode ? false : state.quizRevealed,
                })
              }
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/60 hover:border-sky-400 hover:bg-sky-50/60 dark:hover:bg-sky-950/40 transition text-[11px] font-semibold text-slate-700 dark:text-slate-200"
            >
              {isEn ? p.label.en : p.label.th}
            </button>
          ))}
        </div>
      </div>

      {/* Equation & Quiz Mode */}
      <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            {isEn ? 'Equation & Classification' : 'สมการและการจำแนกรูปทรง'}
          </span>
          <button
            type="button"
            onClick={() => update({ quizMode: !state.quizMode, quizRevealed: false })}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
              state.quizMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
            }`}
          >
            {isEn
              ? state.quizMode
                ? 'Quiz Mode: ON'
                : 'Quiz Mode'
              : state.quizMode
                ? 'โหมดทายรูปทรง: เปิด'
                : 'โหมดควิซ (ทายรูปทรง)'}
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            {isEn ? 'General Form (Given Problem)' : 'สมการรูปทั่วไป (โจทย์)'}
          </div>
          <div className="overflow-x-auto overflow-y-hidden leading-normal py-1 text-slate-800 dark:text-slate-100">
            <KaTeX math={generalLatex} />
          </div>
        </div>

        {hideSolution ? (
          <button
            type="button"
            onClick={() => update({ quizRevealed: true })}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Eye className="w-4 h-4" />{' '}
            {isEn ? 'Reveal Surface Name, Standard Form & Intercepts' : 'เฉลยชื่อรูปทรง รูปมาตรฐาน และจุดตัดแกน'}
          </button>
        ) : (
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-sky-200/80 dark:border-sky-900/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {isEn ? 'Standard Form' : 'สมการรูปมาตรฐาน (Standard Form)'}
              </span>
              {state.quizMode && (
                <button
                  type="button"
                  onClick={() => update({ quizRevealed: false })}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  <EyeOff className="w-3 h-3" /> {isEn ? 'Hide' : 'ซ่อนเฉลย'}
                </button>
              )}
            </div>
            <div className="overflow-x-auto overflow-y-hidden leading-normal py-1 text-sky-700 dark:text-sky-300">
              <KaTeX math={standardLatex} />
            </div>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          {isEn ? 'Quadric Surface Type' : 'ชนิดพื้นผิวกำลังสอง (Quadric Surface Type)'}
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {QUADRIC_MODES.map((m) => {
            const active = state.mode === m && !hideSolution;
            const isMorph = m === 'morph';
            return (
              <button
                key={m}
                type="button"
                onClick={() =>
                  update({
                    mode: m,
                    quizRevealed: state.quizMode ? false : state.quizRevealed,
                  })
                }
                className={`px-3 py-2 rounded-xl border text-left transition text-xs flex items-center justify-between gap-2 ${
                  active
                    ? isMorph
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/60 text-violet-900 dark:text-violet-100 font-semibold shadow-sm'
                      : 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="truncate">{isEn ? QUADRIC_INFO[m].name.en : QUADRIC_INFO[m].name.th}</span>
                {!isEn && (
                  <span className="text-[10px] opacity-75 shrink-0">{QUADRIC_INFO[m].name.en}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!hideSolution && (
        <>
          {/* Summary Note */}
          <div className="px-3 py-2.5 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 text-xs space-y-0.5">
            <div className="font-semibold text-sky-900 dark:text-sky-200">
              {isEn ? info.name.en : info.name.th}
            </div>
            <div className="text-[11px] text-sky-800/90 dark:text-sky-300/90 leading-relaxed">
              {isEn ? info.summary.en : info.summary.th}
            </div>
          </div>

          <AxisInterceptsBox rows={interceptRows} lang={lang} />
        </>
      )}

      {/* Morph Slider */}
      {state.mode === 'morph' && (
        <div className="p-3.5 rounded-2xl border border-violet-300 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/40 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-violet-900 dark:text-violet-200">
              {isEn ? 'Morph Parameter d' : 'ค่าคงตัว d (Morph Parameter)'}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-200/70 dark:bg-violet-900 text-violet-900 dark:text-violet-100">
              {morphStatus}
            </span>
          </div>
          <SliderControl
            label={isEn ? 'd (RHS constant)' : 'ค่า d (ฝั่งขวาของสมการ)'}
            value={state.morphD}
            min={-2}
            max={2}
            step={0.1}
            accentColor="#8b5cf6"
            onChange={(morphD) => update({ morphD })}
          />
          <div className="flex justify-between gap-1.5 pt-0.5">
            {[
              { label: isEn ? 'd = 1 (1-Sheet)' : 'd = 1 (1 ชิ้น)', val: 1 },
              { label: isEn ? 'd = 0 (Cone)' : 'd = 0 (กรวย)', val: 0 },
              { label: isEn ? 'd = -1 (2-Sheet)' : 'd = -1 (2 ชิ้น)', val: -1 },
            ].map((q) => (
              <button
                key={q.val}
                type="button"
                onClick={() => update({ morphD: q.val })}
                className="flex-1 py-1 rounded-lg text-[11px] font-semibold border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-800 dark:text-violet-200"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Symmetry Axis */}
      {!isEllipsoid && (
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isEn ? 'Symmetry Axis' : 'แกนสมมาตรของพื้นผิว (Symmetry Axis)'}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {AXES.map((ax) => (
              <button
                key={ax}
                type="button"
                onClick={() => update({ symmetryAxis: ax })}
                className={`py-1.5 rounded-xl border font-semibold text-xs transition ${
                  state.symmetryAxis === ax
                    ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                }`}
              >
                {isEn ? `${ax}-axis` : `แกน ${ax}`}
              </button>
            ))}
          </div>

          {isParaboloid && (
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isEn ? 'Sign / Opening Orientation' : 'ทิศทางเปิด / เครื่องหมายสมการ (Sign / Orientation)'}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => update({ paraboloidSign: 1 })}
                  className={`py-1.5 px-2 rounded-xl border font-semibold text-xs transition ${
                    state.paraboloidSign === 1
                      ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                  }`}
                >
                  {isEn ? `+${w} (opens +)` : `+${w} (หงาย / ด้านบวก)`}
                </button>
                <button
                  type="button"
                  onClick={() => update({ paraboloidSign: -1 })}
                  className={`py-1.5 px-2 rounded-xl border font-semibold text-xs transition ${
                    state.paraboloidSign === -1
                      ? 'border-rose-500 bg-rose-600 text-white shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                  }`}
                >
                  {isEn ? `-${w} (opens -)` : `-${w} (คว่ำ / ด้านลบ)`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parameters a, b, c */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Scale Parameters' : 'พารามิเตอร์สเกล (Scale Parameters)'}
        </div>
        <SliderControl
          label={
            isEn
              ? isEllipsoid
                ? 'a (x-radius)'
                : `a (${u}-scale)`
              : isEllipsoid
                ? 'a (รัศมีแกน x)'
                : `a (สเกลแกน ${u})`
          }
          value={state.a}
          min={0.5}
          max={4}
          step={0.25}
          onChange={(a) => update({ a })}
        />
        <SliderControl
          label={
            isEn
              ? isEllipsoid
                ? 'b (y-radius)'
                : `b (${v}-scale)`
              : isEllipsoid
                ? 'b (รัศมีแกน y)'
                : `b (สเกลแกน ${v})`
          }
          value={state.b}
          min={0.5}
          max={4}
          step={0.25}
          onChange={(b) => update({ b })}
        />
        {!isParaboloid && (
          <SliderControl
            label={
              isEn
                ? isEllipsoid
                  ? 'c (z-radius)'
                  : `c (${w}-scale)`
                : isEllipsoid
                  ? 'c (รัศมีแกน z)'
                  : `c (สเกลแกน ${w})`
            }
            value={state.c}
            min={0.5}
            max={4}
            step={0.25}
            onChange={(c) => update({ c })}
          />
        )}
      </div>

      {/* Slicing Plane & Traces */}
      <div className="p-3.5 rounded-2xl border border-amber-300/80 dark:border-amber-800/70 bg-amber-50/60 dark:bg-amber-950/30 space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
              {isEn ? 'Slicing Plane & Traces' : 'ระนาบตัดและรอยตัด (Slicing Plane & Traces)'}
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300/80">
              {isEn ? 'Show 2D cross-section trace alongside 3D cut' : 'แสดงกราฟรอยตัด 2 มิติคู่กับเส้นตัด 3 มิติ'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={state.slicingEnabled}
            onChange={(e) => update({ slicingEnabled: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>

        {state.slicingEnabled && (
          <div className="space-y-2.5 pt-1 border-t border-amber-200/70 dark:border-amber-800/50">
            <div className="grid grid-cols-3 gap-1.5">
              {AXES.map((ax) => (
                <button
                  key={ax}
                  type="button"
                  onClick={() => update({ slicePlane: ax })}
                  className={`py-1.5 rounded-xl border font-semibold text-xs transition ${
                    state.slicePlane === ax
                      ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                      : 'border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {ax} = k
                </button>
              ))}
            </div>
            <SliderControl
              label={isEn ? `Slice Plane Level (${state.slicePlane} = k)` : `ตำแหน่งระนาบตัด (${state.slicePlane} = k)`}
              value={state.sliceK}
              min={-4}
              max={4}
              step={0.25}
              accentColor="#f59e0b"
              onChange={(sliceK) => update({ sliceK })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
