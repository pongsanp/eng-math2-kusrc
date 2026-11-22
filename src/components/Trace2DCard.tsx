import type { AxisName, TraceResult } from '../types';
import { BOX_LIMIT } from '../math/coords';
import { getSlicePlaneLatex } from '../math/latex';
import { KaTeX } from './KaTeX';

interface Trace2DCardProps {
  slicePlane: AxisName;
  sliceK: number;
  trace: TraceResult;
}

export function Trace2DCard({ slicePlane, sliceK, trace }: Trace2DCardProps) {
  const size = 180;
  const pad = 18;
  const half = (size - 2 * pad) / 2;
  const scale = half / BOX_LIMIT;

  const toSvgX = (h: number) => size / 2 + h * scale;
  const toSvgY = (v: number) => size / 2 - v * scale;

  return (
    <div className="w-64 sm:w-72 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/92 dark:bg-slate-900/92 backdrop-blur-md shadow-xl p-3.5 text-slate-800 dark:text-slate-100">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
          รอยตัด 2 มิติ (2D Trace)
        </div>
        <div className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60">
          <KaTeX math={getSlicePlaneLatex(slicePlane, sliceK)} />
        </div>
      </div>

      <div className="flex justify-center bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/70 dark:border-slate-800 p-1.5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Subtle grid */}
          {[-4, -2, 2, 4].map((t) => (
            <g key={t}>
              <line
                x1={toSvgX(t)}
                y1={pad}
                x2={toSvgX(t)}
                y2={size - pad}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
              <line
                x1={pad}
                y1={toSvgY(t)}
                x2={size - pad}
                y2={toSvgY(t)}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth={1}
              />
            </g>
          ))}

          {/* Main 2D Axes */}
          <line
            x1={pad}
            y1={size / 2}
            x2={size - pad}
            y2={size / 2}
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1.3}
          />
          <line
            x1={size / 2}
            y1={pad}
            x2={size / 2}
            y2={size - pad}
            className="stroke-slate-400 dark:stroke-slate-600"
            strokeWidth={1.3}
          />

          {/* Axis Labels */}
          <text
            x={size - pad + 5}
            y={size / 2 + 4}
            className="fill-slate-600 dark:fill-slate-300 text-[11px] font-bold"
          >
            {trace.hAxisLabel}
          </text>
          <text
            x={size / 2 + 5}
            y={pad - 4}
            className="fill-slate-600 dark:fill-slate-300 text-[11px] font-bold"
          >
            {trace.vAxisLabel}
          </text>

          {/* 2D Curves */}
          {trace.curves2D.map((poly, idx) => {
            const d = poly
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p[0]).toFixed(1)} ${toSvgY(p[1]).toFixed(1)}`)
              .join(' ');
            return (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Single Points */}
          {trace.points2D.map((pt, idx) => (
            <circle
              key={idx}
              cx={toSvgX(pt[0])}
              cy={toSvgY(pt[1])}
              r={4.5}
              fill="#f59e0b"
            />
          ))}
        </svg>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400">รูปตัด (Shape):</span>
          <span className="font-semibold text-sky-700 dark:text-sky-300">
            {trace.classification.th} ({trace.classification.en})
          </span>
        </div>
        <div className="px-2.5 py-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-center overflow-x-auto overflow-y-hidden leading-normal text-xs">
          <KaTeX math={trace.equationLatex} />
        </div>
      </div>
    </div>
  );
}
