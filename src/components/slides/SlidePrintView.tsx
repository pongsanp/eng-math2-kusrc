import type { SlideDef, SlideEmbed3DKind, SlideExampleScene3D } from '../../slides/ch1SlidesData';
import { CH1_VISIBLE_SLIDES } from '../../slides/ch1SlidesData';
import type { PrintScope } from '../../slides/inkUtils';
import { KaTeX } from '../KaTeX';
import { RichMathText } from './RichMathText';

interface SlidePrintViewProps {
  includeInk: boolean;
  inkImagesBySlide: Record<number, string>;
  printScope: PrintScope;
}

function SvgHaloText({
  x,
  y,
  fill,
  children,
  fontSize = 10,
  haloColor = '#f8fafc',
  textAnchor = 'middle',
  dominantBaseline = 'central',
}: {
  x: number;
  y: number;
  fill: string;
  children: string;
  fontSize?: number;
  haloColor?: string;
  textAnchor?: 'start' | 'middle' | 'end';
  dominantBaseline?: 'auto' | 'central' | 'middle';
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontWeight="bold"
      fill={fill}
      textAnchor={textAnchor}
      dominantBaseline={dominantBaseline}
      stroke={haloColor}
      strokeWidth={3.5}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  );
}

function renderSvgArrow(
  p1: [number, number],
  p2: [number, number],
  color: string,
  key: string,
  options: {
    opacity?: number;
    strokeWidth?: number;
    dashed?: boolean;
    label?: string;
    labelAtTip?: boolean;
    labelDist?: number;
    fontSize?: number;
    bounds?: { minX: number; maxX: number; minY: number; maxY: number };
  } = {},
) {
  const {
    opacity = 1,
    strokeWidth = 2.3,
    dashed = false,
    label,
    labelAtTip = false,
    labelDist = 11,
    fontSize = 10,
    bounds = { minX: 14, maxX: 244, minY: 12, maxY: 178 },
  } = options;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy);
  if (!Number.isFinite(len) || len < 1) {
    return <circle key={key} cx={p1[0]} cy={p1[1]} r="3" fill={color} opacity={opacity} />;
  }
  const ux = dx / len;
  const uy = dy / len;
  const hl = Math.min(7, Math.max(4.5, len * 0.34));
  const hw = hl * 0.52;
  const bx = p2[0] - ux * hl;
  const by = p2[1] - uy * hl;

  let lx = (p1[0] + p2[0]) / 2;
  let ly = (p1[1] + p2[1]) / 2;
  if (labelAtTip) {
    lx = p2[0] + ux * labelDist;
    ly = p2[1] + uy * labelDist;
  } else {
    // Perpendicular unit normal biased upward-sideways so label sits beside shaft without obscuring it
    let nx = -uy;
    let ny = ux;
    if (ny > 0.35 || (Math.abs(ny) <= 0.35 && nx < 0)) {
      nx = -nx;
      ny = -ny;
    }
    lx += nx * labelDist;
    ly += ny * labelDist;
  }
  lx = Math.max(bounds.minX, Math.min(bounds.maxX, lx));
  ly = Math.max(bounds.minY, Math.min(bounds.maxY, ly));

  return (
    <g key={key} opacity={opacity}>
      <line
        x1={p1[0]}
        y1={p1[1]}
        x2={bx}
        y2={by}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashed ? '4 2' : undefined}
      />
      <polygon
        points={`${p2[0]},${p2[1]} ${bx - uy * hw},${by + ux * hw} ${bx + uy * hw},${by - ux * hw}`}
        fill={color}
      />
      {label && (
        <SvgHaloText x={lx} y={ly} fill={color} fontSize={fontSize}>
          {label}
        </SvgHaloText>
      )}
    </g>
  );
}

function StaticDiagramSVG({ kind }: { kind: SlideEmbed3DKind }) {
  const ox = 100;
  const oy = 115;
  const axBounds = { minX: 14, maxX: 226, minY: 12, maxY: 178 };

  return (
    <div className="h-full flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-bold text-slate-600 flex items-center justify-between">
        <span>แผนภาพประกอบ 3 มิติ (Interactive 3D บนเว็บ)</span>
        <span className="font-mono text-xs text-sky-700">pongsanp.github.io/eng-math2-kusrc</span>
      </div>
      <svg viewBox="0 0 240 190" className="w-full flex-1 my-2">
        {/* Consistent 3D Axes with clear arrowheads & clear halo labels past arrow tips */}
        {renderSvgArrow([ox, oy], [48, 152], '#ef4444', 'ax-x', {
          strokeWidth: 1.5,
          label: 'x',
          labelAtTip: true,
          labelDist: 10,
          fontSize: 11,
          bounds: axBounds,
        })}
        {renderSvgArrow([ox, oy], [202, 115], '#10b981', 'ax-y', {
          strokeWidth: 1.5,
          label: 'y',
          labelAtTip: true,
          labelDist: 10,
          fontSize: 11,
          bounds: axBounds,
        })}
        {renderSvgArrow([ox, oy], [100, 26], '#3b82f6', 'ax-z', {
          strokeWidth: 1.5,
          label: 'z',
          labelAtTip: true,
          labelDist: 10,
          fontSize: 11,
          bounds: axBounds,
        })}

        {kind === 'plot_point' && (
          <g>
            <polyline points="100,115 72,135 160,135 160,60" fill="none" stroke="#0284c7" strokeWidth="2.5" />
            <rect x="72" y="60" width="88" height="75" fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
            <circle cx="160" cy="60" r="4.5" fill="#f59e0b" />
            <SvgHaloText x={166} y={50} fill="#b45309" fontSize={11} textAnchor="start">
              P(x, y, z)
            </SvgHaloText>
          </g>
        )}

        {kind === 'arithmetic' && (
          <g>
            {renderSvgArrow([ox, oy], [145, 85], '#0284c7', 'st-u', { strokeWidth: 2.5, label: 'u', bounds: axBounds })}
            {renderSvgArrow([145, 85], [190, 105], '#059669', 'st-v', {
              strokeWidth: 2.2,
              dashed: true,
              label: 'v',
              bounds: axBounds,
            })}
            {renderSvgArrow([ox, oy], [190, 105], '#d97706', 'st-uv', {
              strokeWidth: 2.8,
              label: 'u + v',
              labelDist: 13,
              bounds: axBounds,
            })}
          </g>
        )}

        {(kind === 'dir_angles' || kind === 'projection') && (
          <g>
            {renderSvgArrow([ox, oy], [165, 55], '#0284c7', 'st-pu', { strokeWidth: 2.6, label: 'u', bounds: axBounds })}
            {renderSvgArrow([ox, oy], [195, 115], '#059669', 'st-pv', {
              strokeWidth: 2.2,
              label: 'v',
              labelAtTip: true,
              labelDist: 9,
              bounds: axBounds,
            })}
            <line x1="165" y1="55" x2="165" y2="115" stroke="#e11d48" strokeWidth="1.6" strokeDasharray="3 3" />
            {renderSvgArrow([ox, oy], [165, 115], '#d97706', 'st-proj', {
              strokeWidth: 3,
              label: 'Proj_v(u)',
              labelDist: 14,
              bounds: axBounds,
            })}
          </g>
        )}

        {kind === 'cross' && (
          <g>
            <polygon points="100,115 155,140 205,115 150,90" fill="rgba(6,182,212,0.18)" stroke="#0891b2" strokeDasharray="3 2" />
            {renderSvgArrow([ox, oy], [155, 140], '#0284c7', 'st-cu', { strokeWidth: 2.5, label: 'u', bounds: axBounds })}
            {renderSvgArrow([ox, oy], [150, 90], '#059669', 'st-cv', { strokeWidth: 2.5, label: 'v', bounds: axBounds })}
            {renderSvgArrow([ox, oy], [100, 40], '#e11d48', 'st-cx', {
              strokeWidth: 3,
              label: 'u × v',
              labelDist: 16,
              bounds: axBounds,
            })}
          </g>
        )}

        {kind === 'triple' && (
          <g>
            <polygon points="100,115 155,135 190,110 135,90" fill="rgba(139,92,246,0.12)" stroke="#7c3aed" strokeDasharray="3 2" />
            <polygon points="112,55 167,75 202,50 147,30" fill="rgba(139,92,246,0.16)" stroke="#7c3aed" strokeDasharray="3 2" />
            {renderSvgArrow([ox, oy], [112, 55], '#d97706', 'st-tw', { strokeWidth: 2.5, label: 'w', bounds: axBounds })}
            {renderSvgArrow([ox, oy], [155, 135], '#0284c7', 'st-tu', { strokeWidth: 2.5, label: 'u', bounds: axBounds })}
            {renderSvgArrow([ox, oy], [135, 90], '#059669', 'st-tv', { strokeWidth: 2.5, label: 'v', bounds: axBounds })}
            <SvgHaloText x={174} y={154} fill="#6d28d9" fontSize={10}>
              V = |u · (v × w)|
            </SvgHaloText>
          </g>
        )}

        {kind === 'line3d' && (
          <g>
            <line x1="40" y1="95" x2="215" y2="45" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="110" cy="75" r="4.5" fill="#0284c7" />
            <circle cx="165" cy="59" r="5" fill="#d97706" />
            <line x1="100" y1="115" x2="110" y2="75" stroke="#6366f1" strokeWidth="1.8" />
            <line x1="100" y1="115" x2="165" y2="59" stroke="#d97706" strokeWidth="1.8" strokeDasharray="3 2" />
            <SvgHaloText x={108} y={63} fill="#0284c7" fontSize={10}>
              P₀
            </SvgHaloText>
            <SvgHaloText x={170} y={46} fill="#b45309" fontSize={10}>
              P(t)
            </SvgHaloText>
          </g>
        )}
      </svg>
      <div className="text-xs text-slate-500 text-center">
        สแกนหรือเปิดเว็บเพื่อหมุนกราฟ 3 มิติแบบ Interactive
      </div>
    </div>
  );
}

function ExampleSceneSVG({ scene }: { scene: SlideExampleScene3D }) {
  const vecs = scene.vectors ?? [];
  const pts = scene.points ?? [];
  const lines = scene.lines ?? [];
  const tri = scene.triangle;

  let maxAbs = 0;
  for (const item of vecs) {
    const o = item.origin ?? [0, 0, 0];
    for (let k = 0; k < 3; k += 1) {
      maxAbs = Math.max(maxAbs, Math.abs(o[k]), Math.abs(o[k] + item.vec[k]));
    }
  }
  for (const p of pts) {
    for (let k = 0; k < 3; k += 1) {
      maxAbs = Math.max(maxAbs, Math.abs(p.pos[k]));
    }
  }
  for (const l of lines) {
    for (let k = 0; k < 3; k += 1) {
      maxAbs = Math.max(maxAbs, Math.abs(l.point[k]));
    }
  }
  if (tri) {
    for (const v of tri) {
      for (let k = 0; k < 3; k += 1) {
        maxAbs = Math.max(maxAbs, Math.abs(v[k]));
      }
    }
  }

  const scale = maxAbs > 4.0 ? 3.6 / maxAbs : 1;
  const sv = (t: [number, number, number]): [number, number, number] => [
    t[0] * scale,
    t[1] * scale,
    t[2] * scale,
  ];

  const ox = 128;
  const oy = 102;
  const unit = 17;
  const proj = ([x, y, z]: [number, number, number]): [number, number] => [
    ox - x * 0.72 * unit + y * 0.96 * unit,
    oy + x * 0.42 * unit + y * 0.14 * unit - z * 0.96 * unit,
  ];
  const clampLabel = (x: number, y: number): [number, number] => [
    Math.max(12, Math.min(220, x)),
    Math.max(14, Math.min(176, y)),
  ];

  const scaledVecs = vecs.map((item) => {
    const o = item.origin ? sv(item.origin) : ([0, 0, 0] as [number, number, number]);
    const v = sv(item.vec);
    const tip: [number, number, number] = [o[0] + v[0], o[1] + v[1], o[2] + v[2]];
    return { ...item, o, v, tip, p1: proj(o), p2: proj(tip) };
  });

  const axX = proj([3.4, 0, 0]);
  const axY = proj([0, 3.4, 0]);
  const axZ = proj([0, 0, 3.4]);
  const axNegX = proj([-2.1, 0, 0]);
  const axNegY = proj([0, -2.1, 0]);
  const axNegZ = proj([0, 0, -2.1]);
  const exBounds = { minX: 16, maxX: 244, minY: 12, maxY: 178 };

  const parallelepipedFaces = (() => {
    if (!scene.showParallelepiped || scaledVecs.length < 3) return null;
    const u = scaledVecs[0].v;
    const v = scaledVecs[1].v;
    const w = scaledVecs[2].v;
    const add = (a: [number, number, number], b: [number, number, number]): [number, number, number] => [
      a[0] + b[0],
      a[1] + b[1],
      a[2] + b[2],
    ];
    const uv = add(u, v);
    const uw = add(u, w);
    const vw = add(v, w);
    const uvw = add(uv, w);
    const toPts = (arr: Array<[number, number, number]>) =>
      arr.map((p) => proj(p).join(',')).join(' ');
    const edges: Array<[[number, number, number], [number, number, number]]> = [
      [u, uv],
      [v, uv],
      [u, uw],
      [w, uw],
      [v, vw],
      [w, vw],
      [uv, uvw],
      [uw, uvw],
      [vw, uvw],
    ];
    return (
      <g>
        <polygon points={toPts([[0, 0, 0], u, uv, v])} fill="rgba(14,165,233,0.12)" />
        <polygon points={toPts([w, uw, uvw, vw])} fill="rgba(14,165,233,0.16)" />
        {edges.map(([a, b], idx) => {
          const pa = proj(a);
          const pb = proj(b);
          return (
            <line
              key={idx}
              x1={pa[0]}
              y1={pa[1]}
              x2={pb[0]}
              y2={pb[1]}
              stroke="#0ea5e9"
              strokeWidth="1.2"
              strokeDasharray="3 2"
            />
          );
        })}
      </g>
    );
  })();

  const angleArc = (() => {
    if (!scene.showAngle || scaledVecs.length < 2) return null;
    const a = scaledVecs[0].v;
    const b = scaledVecs[1].v;
    const na = Math.hypot(a[0], a[1], a[2]);
    const nb = Math.hypot(b[0], b[1], b[2]);
    if (na < 1e-4 || nb < 1e-4) return null;
    const ua: [number, number, number] = [a[0] / na, a[1] / na, a[2] / na];
    const ub: [number, number, number] = [b[0] / nb, b[1] / nb, b[2] / nb];
    const r = Math.min(1.2, na * 0.7, nb * 0.7);
    const pts2d: Array<[number, number]> = [[ox, oy]];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const mix: [number, number, number] = [
        ua[0] * (1 - t) + ub[0] * t,
        ua[1] * (1 - t) + ub[1] * t,
        ua[2] * (1 - t) + ub[2] * t,
      ];
      const nm = Math.hypot(mix[0], mix[1], mix[2]) || 1;
      pts2d.push(proj([(mix[0] / nm) * r, (mix[1] / nm) * r, (mix[2] / nm) * r]));
    }
    const mid = pts2d[Math.floor(pts2d.length / 2)];
    return (
      <g>
        <polygon
          points={pts2d.map((p) => p.join(',')).join(' ')}
          fill="rgba(245,158,11,0.24)"
          stroke="#d97706"
          strokeWidth="1.2"
        />
        <SvgHaloText x={mid[0] + 4} y={mid[1] - 5} fill="#b45309" fontSize={10}>
          {scene.angleLabel ?? 'θ'}
        </SvgHaloText>
      </g>
    );
  })();

  const rightAngleBox = (() => {
    if (!scene.showRightAngle || scaledVecs.length < 2) return null;
    const a = scaledVecs[0].v;
    const b = scaledVecs[1].v;
    const na = Math.hypot(a[0], a[1], a[2]);
    const nb = Math.hypot(b[0], b[1], b[2]);
    if (na < 1e-4 || nb < 1e-4) return null;
    const s = Math.min(0.85, na * 0.4, nb * 0.4);
    const ua: [number, number, number] = [(a[0] / na) * s, (a[1] / na) * s, (a[2] / na) * s];
    const ub: [number, number, number] = [(b[0] / nb) * s, (b[1] / nb) * s, (b[2] / nb) * s];
    const p1 = proj(ua);
    const p2 = proj([ua[0] + ub[0], ua[1] + ub[1], ua[2] + ub[2]]);
    const p3 = proj(ub);
    return (
      <polyline
        points={`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`}
        fill="none"
        stroke="#e11d48"
        strokeWidth="1.6"
      />
    );
  })();

  return (
    <div className="h-full flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden">
      <svg viewBox="0 0 260 190" className="w-full flex-1 min-h-0">
        {/* Negative faint axes */}
        <line x1={ox} y1={oy} x2={axNegX[0]} y2={axNegX[1]} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
        <line x1={ox} y1={oy} x2={axNegY[0]} y2={axNegY[1]} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
        <line x1={ox} y1={oy} x2={axNegZ[0]} y2={axNegZ[1]} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />

        {/* Positive axes with crisp arrowheads & clear x, y, z labels past arrow tips */}
        {renderSvgArrow([ox, oy], axX, '#ef4444', 'ex-ax-x', {
          strokeWidth: 1.4,
          label: 'x',
          labelAtTip: true,
          labelDist: 10,
          bounds: exBounds,
        })}
        {renderSvgArrow([ox, oy], axY, '#10b981', 'ex-ax-y', {
          strokeWidth: 1.4,
          label: 'y',
          labelAtTip: true,
          labelDist: 10,
          bounds: exBounds,
        })}
        {renderSvgArrow([ox, oy], axZ, '#3b82f6', 'ex-ax-z', {
          strokeWidth: 1.4,
          label: 'z',
          labelAtTip: true,
          labelDist: 10,
          bounds: exBounds,
        })}

        {tri && (
          <polygon
            points={tri.map((v) => proj(sv(v)).join(',')).join(' ')}
            fill="rgba(16,185,129,0.22)"
            stroke="#059669"
            strokeWidth="1.5"
          />
        )}

        {parallelepipedFaces}
        {angleArc}
        {rightAngleBox}

        {lines.map((l, idx) => {
          const p0 = sv(l.point);
          const len = Math.hypot(l.dir[0], l.dir[1], l.dir[2]) || 1;
          const u: [number, number, number] = [l.dir[0] / len, l.dir[1] / len, l.dir[2] / len];
          const span = 3.2;
          const pa = proj([p0[0] - span * u[0], p0[1] - span * u[1], p0[2] - span * u[2]]);
          const pb = proj([p0[0] + span * u[0], p0[1] + span * u[1], p0[2] + span * u[2]]);
          const pm = proj(p0);
          const ldx = pb[0] - pa[0];
          const ldy = pb[1] - pa[1];
          const llen = Math.hypot(ldx, ldy) || 1;
          let nx = -ldy / llen;
          let ny = ldx / llen;
          if (ny > 0) {
            nx = -nx;
            ny = -ny;
          }
          const [lx, ly] = clampLabel(pb[0] * 0.7 + pm[0] * 0.3 + nx * 10, pb[1] * 0.7 + pm[1] * 0.3 + ny * 10);
          return (
            <g key={`l-${idx}`}>
              <line x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={l.color} strokeWidth="2" />
              <circle cx={pm[0]} cy={pm[1]} r="3" fill={l.color} />
              {l.label && (
                <SvgHaloText x={lx} y={ly} fill={l.color} fontSize={10}>
                  {l.label}
                </SvgHaloText>
              )}
            </g>
          );
        })}

        {scaledVecs.map((v, idx) =>
          renderSvgArrow(v.p1, v.p2, v.color, `v-${idx}`, {
            opacity: v.opacity ?? 1,
            label: v.label,
            labelAtTip: false,
            labelDist: 11,
            bounds: exBounds,
          }),
        )}

        {pts.map((p, idx) => {
          const pp = proj(sv(p.pos));
          const [lx, ly] = clampLabel(pp[0] + 6, pp[1] - 9);
          return (
            <g key={`p-${idx}`}>
              <circle cx={pp[0]} cy={pp[1]} r="3.6" fill={p.color} stroke="#ffffff" strokeWidth="1" />
              {p.label && (
                <SvgHaloText x={lx} y={ly} fill={p.color} fontSize={10}>
                  {p.label}
                </SvgHaloText>
              )}
            </g>
          );
        })}
      </svg>
      {scene.hintTh && (
        <div className="text-[10px] text-slate-600 leading-tight truncate text-center pt-0.5 border-t border-slate-200/80">
          {scene.hintTh}
        </div>
      )}
    </div>
  );
}

function renderPrintSlide(
  slide: SlideDef,
  index: number,
  total: number,
  includeInk: boolean,
  scopeText: string,
  inkDataUrl?: string,
) {
  return (
    <div
      key={slide.id}
      className="print-slide-page bg-white text-slate-900 p-5 pb-3 flex flex-col justify-between border border-slate-200"
    >
      {/* Slide Stage (matches on-screen overlay stage for 1:1 handwritten ink alignment) */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-200 pb-2.5">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white">01417168</span>
              <span>{slide.tagTh}</span>
              <span className="text-slate-400">• {slide.tagEn}</span>
            </div>
            <h2 className="text-[28px] leading-tight font-extrabold text-slate-900 mt-1">
              {slide.titleTh}
            </h2>
            <p className="text-sm text-slate-500">{slide.subtitle ?? slide.titleEn}</p>
          </div>
          <div className="text-sm font-mono font-bold text-slate-500 shrink-0">
            {index + 1} / {total}
          </div>
        </div>

        {/* Body */}
        <div className="relative flex-1 min-h-0 py-3">
          {slide.kind === 'example' && slide.examples ? (
            <div className="h-full flex flex-col gap-3">
              {slide.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 p-3.5 bg-slate-50/50"
                >
                  <div className="text-[19px] font-bold text-slate-900 leading-snug">
                    {ex.label && (
                      <span
                        className={`mr-2 px-2.5 py-0.5 rounded text-sm font-bold ${
                          ex.label.includes('แนวข้อสอบ')
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {ex.label}
                      </span>
                    )}
                    <RichMathText text={ex.promptTh} />
                  </div>
                  {ex.promptLatex && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 inline-block text-[20px] text-sky-900">
                      <KaTeX math={ex.promptLatex} />
                    </div>
                  )}

                  {ex.scene3D ? (
                    <div className="flex-1 min-h-0 mt-2.5 grid grid-cols-12 gap-3">
                      <div
                        className="col-span-8 h-full rounded-xl border border-dashed border-slate-300 bg-white"
                        style={{
                          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                          backgroundSize: '18px 18px',
                        }}
                      />
                      <div className="col-span-4 min-h-0">
                        <ExampleSceneSVG scene={ex.scene3D} />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex-1 mt-2.5 rounded-xl border border-dashed border-slate-300 bg-white"
                      style={{
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`h-full grid gap-4 ${slide.embed3D ? 'grid-cols-12' : 'grid-cols-1'}`}>
              <div
                className={
                  slide.embed3D
                    ? 'col-span-7 flex flex-col justify-center gap-3'
                    : slide.kind === 'summary'
                      ? 'grid grid-cols-2 gap-4 items-stretch'
                      : 'flex flex-col justify-center gap-3'
                }
              >
                {slide.cards?.map((card, cIdx) => (
                  <div
                    key={cIdx}
                    className={`rounded-2xl border border-slate-200 bg-slate-50/60 ${
                      slide.kind === 'summary'
                        ? 'p-3.5 space-y-1.5 flex flex-col justify-between'
                        : 'p-4 space-y-2'
                    }`}
                  >
                    <div className="text-[19px] font-bold text-slate-800">
                      <RichMathText text={card.heading} />
                    </div>
                    {card.bullets && (
                      <ul className="space-y-1.5 text-[17px] text-slate-700 list-disc pl-6 leading-relaxed">
                        {card.bullets.map((b, bIdx) => (
                          <li key={bIdx}>
                            <RichMathText text={b} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.formulas && (
                      <div
                        className={
                          card.formulaCols === 2 ? 'grid grid-cols-2 gap-2' : 'space-y-2'
                        }
                      >
                        {card.formulas.map((f, fIdx) => (
                          <div
                            key={fIdx}
                            className={`rounded-xl bg-white border border-slate-200 px-3.5 py-2 ${
                              slide.kind === 'summary' ? 'text-[16px]' : 'text-[18px]'
                            }`}
                          >
                            {f.label && (
                              <div className="text-[13px] font-semibold text-slate-500 mb-0.5">
                                {f.label}
                              </div>
                            )}
                            <KaTeX math={f.latex} />
                          </div>
                        ))}
                      </div>
                    )}
                    {card.note && (
                      <div className="text-[14px] font-semibold text-amber-800">{card.note}</div>
                    )}
                  </div>
                ))}
              </div>
              {slide.embed3D && (
                <div className="col-span-5">
                  <StaticDiagramSVG kind={slide.embed3D} />
                </div>
              )}
            </div>
          )}

          {/* Transparent Handwritten Ink PNG Overlay (aligned 1:1 to Slide Body) */}
          {includeInk && inkDataUrl && (
            <img
              src={inkDataUrl}
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 pt-2">
        <span>01417168 คณิตศาสตร์วิศวกรรม II • คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์</span>
        <span>
          {scopeText} •{' '}
          {includeInk ? 'ฉบับรวมลายมือประกอบการสอน' : 'ฉบับเว้นที่เขียนประกอบการสอน (GoodNotes)'}
        </span>
      </div>
    </div>
  );
}

export function SlidePrintView({
  includeInk,
  inkImagesBySlide,
  printScope,
}: SlidePrintViewProps) {
  const slidesToPrint =
    printScope === 'lec1'
      ? CH1_VISIBLE_SLIDES.filter((s) => s.lecture === 1)
      : printScope === 'lec2'
        ? CH1_VISIBLE_SLIDES.filter((s) => s.lecture === 2)
        : CH1_VISIBLE_SLIDES;

  const scopeText =
    printScope === 'lec1' ? 'คาบที่ 1' : printScope === 'lec2' ? 'คาบที่ 2' : 'ครบทั้งบท';

  return (
    <div className="hidden print:block">
      {slidesToPrint.map((s, idx) =>
        renderPrintSlide(s, idx, slidesToPrint.length, includeInk, scopeText, inkImagesBySlide[s.id]),
      )}
    </div>
  );
}
