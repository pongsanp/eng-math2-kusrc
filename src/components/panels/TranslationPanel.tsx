import { Eye, EyeOff } from 'lucide-react';
import type { TranslatedSurfaceType, TranslationState } from '../../types';
import { TRANSLATION_PRESETS, TRANSLATION_SURFACE_NAMES } from '../../math/presets';
import { buildTranslationEquationsLatex } from '../../math/latex';
import { KaTeX } from '../KaTeX';
import { SliderControl } from '../SliderControl';

interface TranslationPanelProps {
  state: TranslationState;
  onChange: (next: TranslationState) => void;
}

const SURFACE_TYPES: TranslatedSurfaceType[] = [
  'ellipsoid',
  'elliptic_paraboloid',
  'cone',
  'hyperboloid_1',
  'elliptic_cylinder',
];

export function TranslationPanel({ state, onChange }: TranslationPanelProps) {
  const update = (patch: Partial<TranslationState>) => onChange({ ...state, ...patch });
  const eqs = buildTranslationEquationsLatex(state);
  const hideSolution = state.quizMode && !state.quizRevealed;

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          ตัวอย่างประกอบการสอน (Presets)
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {TRANSLATION_PRESETS.map((p) => (
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

      {/* Base Surface Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          พื้นผิวต้นแบบ (Base Surface)
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SURFACE_TYPES.map((st) => {
            const active = state.surfaceType === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => update({ surfaceType: st })}
                className={`px-2.5 py-2 rounded-xl border text-left transition text-xs ${
                  active
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="truncate">{TRANSLATION_SURFACE_NAMES[st].th}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shift Sliders */}
      <div className="p-3.5 rounded-2xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/50 dark:bg-orange-950/25 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-orange-900 dark:text-orange-200">
            จุดศูนย์กลาง / จุดยอดใหม่ O'(x₀, y₀, z₀)
          </span>
          <button
            type="button"
            onClick={() => update({ x0: 0, y0: 0, z0: 0 })}
            className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 hover:underline"
          >
            รีเซ็ต (0,0,0)
          </button>
        </div>

        <SliderControl
          label="x₀ (เลื่อนตามแกน x)"
          value={state.x0}
          min={-3.5}
          max={3.5}
          step={0.5}
          accentColor="#ef4444"
          onChange={(x0) => update({ x0 })}
        />
        <SliderControl
          label="y₀ (เลื่อนตามแกน y)"
          value={state.y0}
          min={-3.5}
          max={3.5}
          step={0.5}
          accentColor="#10b981"
          onChange={(y0) => update({ y0 })}
        />
        <SliderControl
          label="z₀ (เลื่อนตามแกน z)"
          value={state.z0}
          min={-3.5}
          max={3.5}
          step={0.5}
          accentColor="#3b82f6"
          onChange={(z0) => update({ z0 })}
        />
      </div>

      {/* Shape Scale Sliders */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          สเกลรูปทรง (a, b, c)
        </div>
        <SliderControl
          label="a (แกน x')"
          value={state.a}
          min={0.5}
          max={3}
          step={0.5}
          onChange={(a) => update({ a })}
        />
        <SliderControl
          label="b (แกน y')"
          value={state.b}
          min={0.5}
          max={3}
          step={0.5}
          onChange={(b) => update({ b })}
        />
        {state.surfaceType === 'elliptic_paraboloid' && (
          <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
              ทิศทางเปิด (Orientation)
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
                +z (หงาย)
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
                -z (คว่ำ)
              </button>
            </div>
          </div>
        )}
        {state.surfaceType !== 'elliptic_paraboloid' &&
          state.surfaceType !== 'elliptic_cylinder' && (
            <SliderControl
              label="c (แกน z')"
              value={state.c}
              min={0.5}
              max={3}
              step={0.5}
              onChange={(c) => update({ c })}
            />
          )}
      </div>

      {/* 3-Form Equation Comparison & Quiz Mode */}
      <div className="p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/70 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
            การจัดรูปสมการ 3 ขั้น (Complete the Square)
          </span>
          <button
            type="button"
            onClick={() =>
              update({
                quizMode: !state.quizMode,
                quizRevealed: false,
              })
            }
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition ${
              state.quizMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
            }`}
          >
            {state.quizMode ? 'โหมดฝึกหัด: เปิด' : 'โหมดถาม-ตอบ (Quiz)'}
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              1. รูปกระจาย (Expanded Form — โจทย์)
            </div>
            <div className="overflow-x-auto overflow-y-hidden leading-normal py-1 text-slate-800 dark:text-slate-100">
              <KaTeX math={eqs.expanded} />
            </div>
          </div>

          {hideSolution ? (
            <button
              type="button"
              onClick={() => update({ quizRevealed: true })}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Eye className="w-4 h-4" /> แสดงเฉลยรูปมาตรฐานและแกนใหม่
            </button>
          ) : (
            <>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    2. รูปมาตรฐาน (Standard Form)
                  </span>
                  {state.quizMode && (
                    <button
                      type="button"
                      onClick={() => update({ quizRevealed: false })}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-300 hover:underline"
                    >
                      <EyeOff className="w-3 h-3" /> ซ่อนเฉลย
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto overflow-y-hidden leading-normal py-1.5 text-sky-700 dark:text-sky-300">
                  <KaTeX math={eqs.standard} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-orange-200/80 dark:border-orange-900/60">
                <div className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 mb-1">
                  3. รูปแกนย้ายขนาน (Shifted Axes Form)
                </div>
                <div className="overflow-x-auto overflow-y-hidden leading-normal py-1.5 text-orange-700 dark:text-orange-300">
                  <KaTeX math={eqs.shifted} />
                </div>
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 overflow-x-auto overflow-y-hidden leading-normal py-0.5">
                  <KaTeX math={eqs.axisShiftSummary} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visual Toggles */}
      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงกราฟเงาเดิมที่ (0,0,0) (Ghost Surface)
          </span>
          <input
            type="checkbox"
            checked={state.showGhost}
            onChange={(e) => update({ showGhost: e.target.checked })}
            className="w-4 h-4 accent-indigo-600"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            แสดงแกนย้ายขนาน x', y', z' (Shifted Axes)
          </span>
          <input
            type="checkbox"
            checked={state.showShiftedAxes}
            onChange={(e) => update({ showShiftedAxes: e.target.checked })}
            className="w-4 h-4 accent-orange-500"
          />
        </label>
      </div>
    </div>
  );
}
