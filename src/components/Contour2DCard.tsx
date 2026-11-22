import { useMemo } from 'react';
import type { Ch3LevelCurvesState } from '../types';
import { MULTIVAR_FUNCS, extractContours2D } from '../math/multivar';
import { fmtNum } from '../math/latex';
import { KaTeX } from './KaTeX';

interface Contour2DCardProps {
  state: Ch3LevelCurvesState;
}

const CONTOUR_LEVELS: Array<{ z: number; color: string }> = [
  { z: -2.0, color: '#3b82f6' },
  { z: -1.2, color: '#06b6d4' },
  { z: -0.4, color: '#10b981' },
  { z: 0.4, color: '#84cc16' },
  { z: 1.2, color: '#eab308' },
  { z: 2.0, color: '#f97316' },
  { z: 2.8, color: '#ef4444' },
];

export function Contour2DCard({ state }: Contour2DCardProps) {
  const spec = MULTIVAR_FUNCS[state.funcId];
  const R = spec.domainR;
  const size = 180;
  const pad = 16;
  const half = (size - 2 * pad) / 2;
  const scale = half / R;

  const toSvgX = (x: number) => size / 2 + x * scale;
  const toSvgY = (y: number) => size / 2 - y * scale;

  const { backgroundContours, activeContour } = useMemo(() => {
    const evalFn = (x: number, y: number) => spec.eval(x, y, state.scaleA);
    const bg = CONTOUR_LEVELS.map((lv) => ({
      z: lv.z,
      color: lv.color,
      segs: extractContours2D(evalFn, R, lv.z, 38),
    }));
    const active = extractContours2D(evalFn, R, state.sliceK, 48);
    return { backgroundContours: bg, activeContour: active };
  }, [spec, R, state.scaleA, state.sliceK]);

  return (
    <div className="w-64 sm:w-72 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/92 dark:bg-slate-900/92 backdrop-blur-md shadow-xl p-3.5 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          แผนที่เส้นชั้นระดับ (Contour Map)
        </div>
        <div className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60">
          <KaTeX math={`z = ${fmtNum(state.sliceK)}`} />
        </div>
      </div>

      <div className="flex justify-center bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/70 dark:border-slate-800 p-1.5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Axes */}
          <line
            x1={pad}
            y1={size / 2}
            x2={size - pad}
            y2={size / 2}
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth={1.2}
          />
          <line
            x1={size / 2}
            y1={pad}
            x2={size / 2}
            y2={size - pad}
            className="stroke-slate-300 dark:stroke-slate-700"
            strokeWidth={1.2}
          />
          <text x={size - pad + 4} y={size / 2 + 4} className="fill-slate-500 text-[10px] font-bold">
            x
          </text>
          <text x={size / 2 + 4} y={pad - 3} className="fill-slate-500 text-[10px] font-bold">
            y
          </text>

          {/* Multi-level elevation contours */}
          {backgroundContours.map((lv) =>
            lv.segs.map((seg, i) => (
              <line
                key={`${lv.z}-${i}`}
                x1={toSvgX(seg[0][0])}
                y1={toSvgY(seg[0][1])}
                x2={toSvgX(seg[1][0])}
                y2={toSvgY(seg[1][1])}
                stroke={lv.color}
                strokeWidth={1.2}
                strokeOpacity={0.5}
              />
            )),
          )}

          {/* Active slice level k */}
          {activeContour.map((seg, i) => (
            <line
              key={`act-${i}`}
              x1={toSvgX(seg[0][0])}
              y1={toSvgY(seg[0][1])}
              x2={toSvgX(seg[1][0])}
              y2={toSvgY(seg[1][1])}
              stroke="#f59e0b"
              strokeWidth={2.8}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span>เส้นสีทอง = ระดับที่กำลังตัด</span>
        <span className="font-mono font-semibold text-amber-600 dark:text-amber-300">
          {activeContour.length > 0 ? 'มีรอยตัด' : 'ไม่มีรอยตัด'}
        </span>
      </div>
    </div>
  );
}
