import { Pause, Play } from 'lucide-react';
import type { AppLang, AxisName, CylinderType, CylindersState } from '../../types';
import { CYLINDER_INFO, CYLINDER_PRESETS } from '../../math/presets';
import { axisVarNames } from '../../math/coords';
import { SliderControl } from '../SliderControl';

interface CylindersPanelProps {
  state: CylindersState;
  onChange: (next: CylindersState) => void;
  lang?: AppLang;
}

const CYLINDER_TYPES: CylinderType[] = ['elliptic', 'parabolic', 'hyperbolic', 'sine'];
const AXES: AxisName[] = ['x', 'y', 'z'];

export function CylindersPanel({ state, onChange, lang = 'th' }: CylindersPanelProps) {
  const isEn = lang === 'en';
  const update = (patch: Partial<CylindersState>) => onChange({ ...state, ...patch });
  const { u, v } = axisVarNames(state.missingAxis);
  const info = CYLINDER_INFO[state.type];

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {isEn ? 'Examples (Presets)' : 'ตัวอย่างประกอบการสอน (Presets)'}
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {CYLINDER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ ...p.value, isAnimatingExtrusion: false })}
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

      {/* Cylinder Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
          {isEn ? 'Cylinder Type' : 'รูปแบบพื้นผิวทรงกระบอก (Cylinder Type)'}
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {CYLINDER_TYPES.map((t) => {
            const active = state.type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (t === 'parabolic') {
                    update({ type: t, a: 0.5, c: -1 });
                  } else if (t === 'sine') {
                    update({ type: t, a: 1.5, b: 1.5 });
                  } else {
                    update({ type: t, a: Math.max(0.5, state.a), b: Math.max(0.5, state.b) });
                  }
                }}
                className={`px-2.5 py-2 rounded-xl border text-left transition text-xs ${
                  active
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-semibold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="truncate">{isEn ? CYLINDER_INFO[t].name.en : CYLINDER_INFO[t].name.th}</div>
                {!isEn && (
                  <div className="text-[10px] opacity-75 truncate">{CYLINDER_INFO[t].name.en}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="px-3 py-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs space-y-0.5">
        <div className="font-semibold text-amber-900 dark:text-amber-200">
          {isEn ? info.name.en : info.name.th}
        </div>
        <div className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
          {isEn ? info.desc.en : info.desc.th}
        </div>
      </div>

      {/* Missing Variable / Ruling Axis */}
      <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Missing Variable / Ruling Axis' : 'ตัวแปรที่หายไป / แนวยืดขนาน (Missing Variable / Ruling Axis)'}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {AXES.map((ax) => {
            const active = state.missingAxis === ax;
            return (
              <button
                key={ax}
                type="button"
                onClick={() => update({ missingAxis: ax })}
                className={`py-2 rounded-xl border font-semibold text-xs transition ${
                  active
                    ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400'
                }`}
              >
                {isEn ? `No ${ax} (${ax}-axis)` : `ขาด ${ax} (แกน ${ax})`}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {isEn ? (
            <>
              The equation involves only <span className="font-mono font-semibold">{u}, {v}</span> (no{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>), so the surface is extruded from the generating curve in the{' '}
              <span className="font-mono font-semibold">{u}{v}</span>-plane parallel to the{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>-axis.
            </>
          ) : (
            <>
              สมการมีเพียงตัวแปร <span className="font-mono font-semibold">{u}, {v}</span> (ไม่มี{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>) กราฟจึงเกิดจากการดึงเส้นโค้งในระนาบ{' '}
              <span className="font-mono font-semibold">{u}{v}</span> ขนานไปตามแกน{' '}
              <span className="font-mono font-semibold">{state.missingAxis}</span>
            </>
          )}
        </p>
      </div>

      {/* Parameters */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {isEn ? 'Generating Curve Parameters' : 'พารามิเตอร์ของเส้นโค้งฐาน (Generating Curve Parameters)'}
        </div>

        {state.type === 'parabolic' ? (
          <>
            <SliderControl
              label={isEn ? 'a (parabola curvature)' : 'a (ความโค้งพาราโบลา)'}
              value={state.a}
              min={-2}
              max={2}
              step={0.25}
              onChange={(a) => update({ a: Math.abs(a) < 0.1 ? 0.25 : a })}
            />
            <SliderControl
              label={isEn ? 'c (axis shift)' : 'c (ระยะเลื่อนแนวแกน)'}
              value={state.c}
              min={-3.5}
              max={3.5}
              step={0.5}
              onChange={(c) => update({ c })}
            />
          </>
        ) : state.type === 'sine' ? (
          <>
            <SliderControl
              label={isEn ? 'a (Amplitude)' : 'a (แอมพลิจูด Amplitude)'}
              value={state.a}
              min={-3.5}
              max={3.5}
              step={0.25}
              onChange={(a) => update({ a: Math.abs(a) < 0.1 ? 0.25 : a })}
            />
            <SliderControl
              label={isEn ? 'b (Frequency)' : 'b (ความถี่ Frequency)'}
              value={state.b}
              min={0.5}
              max={3}
              step={0.25}
              onChange={(b) => update({ b })}
            />
          </>
        ) : (
          <>
            <SliderControl
              label={isEn ? `a (${u}-semi-axis)` : `a (กึ่งแกน ${u})`}
              value={state.a}
              min={0.5}
              max={3.5}
              step={0.25}
              onChange={(a) => update({ a })}
            />
            <SliderControl
              label={isEn ? `b (${v}-semi-axis)` : `b (กึ่งแกน ${v})`}
              value={state.b}
              min={0.5}
              max={3.5}
              step={0.25}
              onChange={(b) => update({ b })}
            />
            {state.type === 'hyperbolic' && (
              <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {isEn ? 'Hyperbola Opening Axis' : 'ทิศทางเปิดของไฮเพอร์โบลา (Opening Axis)'}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ hyperbolicSign: 1 })}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-xs transition ${
                      state.hyperbolicSign === 1
                        ? 'border-sky-500 bg-sky-600 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isEn ? `Opens along ${u} (${u}² - ${v}²)` : `เปิดตามแกน ${u} (${u}² - ${v}²)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ hyperbolicSign: -1 })}
                    className={`py-1.5 px-2 rounded-xl border font-semibold text-xs transition ${
                      state.hyperbolicSign === -1
                        ? 'border-rose-500 bg-rose-600 text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isEn ? `Opens along ${v} (${v}² - ${u}²)` : `เปิดตามแกน ${v} (${v}² - ${u}²)`}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Extrusion Length & Animation */}
      <div className="p-3.5 rounded-2xl border border-sky-200/80 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/30 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
            {isEn ? 'Extrusion Length' : 'ความยาวยืดผิว (Extrusion Length)'}
          </span>
          <button
            type="button"
            onClick={() => update({ isAnimatingExtrusion: !state.isAnimatingExtrusion })}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition"
          >
            {state.isAnimatingExtrusion ? (
              <>
                <Pause className="w-3.5 h-3.5" /> {isEn ? 'Pause' : 'หยุด (Pause)'}
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> {isEn ? 'Animate Extrusion' : 'เล่นแอนิเมชันยืดผิว'}
              </>
            )}
          </button>
        </div>

        <SliderControl
          label={isEn ? 'Extrusion Length along Axis' : 'ระยะยืดตามแกน (Length)'}
          value={state.extrusionLength}
          min={0}
          max={9}
          step={0.25}
          onChange={(extrusionLength) => update({ extrusionLength, isAnimatingExtrusion: false })}
        />
      </div>

      {/* Guides */}
      <div className="space-y-2 text-xs">
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Highlight Generating Curve' : 'ไฮไลต์เส้นโค้งฐาน (Generating Curve)'}
          </span>
          <input
            type="checkbox"
            checked={state.showGeneratingCurve}
            onChange={(e) => update({ showGeneratingCurve: e.target.checked })}
            className="w-4 h-4 accent-amber-500"
          />
        </label>
        <label className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {isEn ? 'Show Ruling Lines' : 'แสดงเส้นกำเนิดผิว (Ruling Lines)'}
          </span>
          <input
            type="checkbox"
            checked={state.showRulings}
            onChange={(e) => update({ showRulings: e.target.checked })}
            className="w-4 h-4 accent-rose-500"
          />
        </label>
      </div>
    </div>
  );
}
