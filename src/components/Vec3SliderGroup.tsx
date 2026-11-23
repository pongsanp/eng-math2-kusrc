import type { AppLang, Vec3Tuple } from '../types';
import { fmtNum } from '../math/latex';
import { SliderControl } from './SliderControl';

interface Vec3SliderGroupProps {
  title: string;
  value: Vec3Tuple;
  min?: number;
  max?: number;
  step?: number;
  badgeColor?: string;
  isPoint?: boolean;
  lang?: AppLang;
  onChange: (next: Vec3Tuple) => void;
}

export function Vec3SliderGroup({
  title,
  value,
  min = -4,
  max = 4,
  step = 0.5,
  badgeColor = 'text-sky-700 dark:text-sky-300',
  isPoint = false,
  lang = 'th',
  onChange,
}: Vec3SliderGroupProps) {
  const isEn = lang === 'en';
  const formatted = isPoint
    ? `(${fmtNum(value[0])}, ${fmtNum(value[1])}, ${fmtNum(value[2])})`
    : `⟨${fmtNum(value[0])}, ${fmtNum(value[1])}, ${fmtNum(value[2])}⟩`;

  return (
    <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
          {title}
        </span>
        <span className={`font-mono text-xs font-bold ${badgeColor}`}>
          {formatted}
        </span>
      </div>
      <SliderControl
        label={isPoint ? 'x' : isEn ? 'x-component' : 'องค์ประกอบ x'}
        value={value[0]}
        min={min}
        max={max}
        step={step}
        accentColor="#ef4444"
        onChange={(x) => onChange([x, value[1], value[2]])}
      />
      <SliderControl
        label={isPoint ? 'y' : isEn ? 'y-component' : 'องค์ประกอบ y'}
        value={value[1]}
        min={min}
        max={max}
        step={step}
        accentColor="#10b981"
        onChange={(y) => onChange([value[0], y, value[2]])}
      />
      <SliderControl
        label={isPoint ? 'z' : isEn ? 'z-component' : 'องค์ประกอบ z'}
        value={value[2]}
        min={min}
        max={max}
        step={step}
        accentColor="#3b82f6"
        onChange={(z) => onChange([value[0], value[1], z])}
      />
    </div>
  );
}
