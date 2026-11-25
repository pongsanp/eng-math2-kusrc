import type { AppLang } from '../types';
import type { AxisInterceptRow } from '../math/intercepts';

interface AxisInterceptsBoxProps {
  rows: AxisInterceptRow[];
  lang: AppLang;
  titleTh?: string;
  titleEn?: string;
}

const AXIS_TEXT_COLOR: Record<'x' | 'y' | 'z', string> = {
  x: 'text-rose-600 dark:text-rose-400',
  y: 'text-emerald-600 dark:text-emerald-400',
  z: 'text-sky-600 dark:text-sky-400',
};

export function AxisInterceptsBox({
  rows,
  lang,
  titleTh = 'จุดตัดแกนพิกัด (Axis Intercepts)',
  titleEn = 'Axis Intercepts',
}: AxisInterceptsBoxProps) {
  const isEn = lang === 'en';
  return (
    <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-2">
      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
        {isEn ? titleEn : titleTh}
      </div>
      <div className="grid grid-cols-1 gap-1.5 text-xs">
        {rows.map((row) => (
          <div
            key={row.axis}
            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60"
          >
            <span className={`${AXIS_TEXT_COLOR[row.axis]} font-medium shrink-0`}>
              {isEn ? `${row.axis}-intercept` : `จุดตัดแกน ${row.axis}`}
            </span>
            <span
              className={`font-mono text-right font-semibold ${
                row.intersects
                  ? 'text-slate-700 dark:text-slate-200'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {isEn ? row.text.en : row.text.th}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
