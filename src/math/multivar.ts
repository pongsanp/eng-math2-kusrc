import * as THREE from 'three';
import type {
  BilingualLabel,
  Ch3ExtremaPresetId,
  Ch3FuncId,
  Ch3LimitFuncId,
} from '../types';
import {
  BOX_LIMIT,
  buildBufferGeometryFromTriangles,
  clipTriangleToBounds,
  type MathVertex,
  type Vec3,
} from './coords';
import { fmtNum, fmtTerm } from './latex';

export interface MultivarFuncSpec {
  id: Ch3FuncId;
  name: BilingualLabel;
  latex: (a: number) => string;
  eval: (x: number, y: number, a: number) => number;
  fx: (x: number, y: number, a: number) => number;
  fy: (x: number, y: number, a: number) => number;
  zRange: [number, number];
  domainR: number;
}

export const MULTIVAR_FUNCS: Record<Ch3FuncId, MultivarFuncSpec> = {
  gaussian: {
    id: 'gaussian',
    name: { th: 'ภูเขาระฆังคว่ำ (Gaussian)', en: 'Gaussian Bell' },
    latex: (a) => `z = ${fmtNum(2.4 * a)} e^{-0.35(x^2 + y^2)}`,
    eval: (x, y, a) => 2.4 * a * Math.exp(-0.35 * (x * x + y * y)),
    fx: (x, y, a) => -0.7 * x * (2.4 * a * Math.exp(-0.35 * (x * x + y * y))),
    fy: (x, y, a) => -0.7 * y * (2.4 * a * Math.exp(-0.35 * (x * x + y * y))),
    zRange: [-0.2, 3.2],
    domainR: 3.4,
  },
  paraboloid: {
    id: 'paraboloid',
    name: { th: 'พาราโบลอยด์หงาย (Bowl)', en: 'Elliptic Paraboloid' },
    latex: (a) => `z = ${fmtNum(0.35 * a)}(x^2 + y^2) - 1.5`,
    eval: (x, y, a) => 0.35 * a * (x * x + y * y) - 1.5,
    fx: (x, _y, a) => 0.7 * a * x,
    fy: (_x, y, a) => 0.7 * a * y,
    zRange: [-1.5, 3.5],
    domainR: 3.2,
  },
  paraboloid_down: {
    id: 'paraboloid_down',
    name: { th: 'พาราโบลอยด์คว่ำ (Cap)', en: 'Inverted Paraboloid' },
    latex: (a) => `z = 2.6 - ${fmtNum(0.3 * a)}(x^2 + y^2)`,
    eval: (x, y, a) => 2.6 - 0.3 * a * (x * x + y * y),
    fx: (x, _y, a) => -0.6 * a * x,
    fy: (_x, y, a) => -0.6 * a * y,
    zRange: [-2.0, 2.8],
    domainR: 3.2,
  },
  saddle: {
    id: 'saddle',
    name: { th: 'อานม้า (Hyperbolic Saddle)', en: 'Saddle Surface' },
    latex: (a) => `z = ${fmtNum(0.35 * a)}(x^2 - y^2)`,
    eval: (x, y, a) => 0.35 * a * (x * x - y * y),
    fx: (x, _y, a) => 0.7 * a * x,
    fy: (_x, y, a) => -0.7 * a * y,
    zRange: [-3.0, 3.0],
    domainR: 3.2,
  },
  waves: {
    id: 'waves',
    name: { th: 'คลื่น 2 มิติ (Trig Waves)', en: 'Sine-Cosine Waves' },
    latex: (a) => `z = ${fmtNum(1.2 * a)}\\sin(x)\\cos(y)`,
    eval: (x, y, a) => 1.2 * a * Math.sin(x) * Math.cos(y),
    fx: (x, y, a) => 1.2 * a * Math.cos(x) * Math.cos(y),
    fy: (x, y, a) => -1.2 * a * Math.sin(x) * Math.sin(y),
    zRange: [-2.0, 2.0],
    domainR: 3.4,
  },
  dome: {
    id: 'dome',
    name: { th: 'ครึ่งทรงกลม (Hemisphere)', en: 'Upper Hemisphere' },
    latex: (a) => {
      const r = Math.min(3.6, Math.max(1.4, 2.4 * a));
      return `z = \\sqrt{${fmtNum(r * r)} - x^2 - y^2}`;
    },
    eval: (x, y, a) => {
      const r = Math.min(3.6, Math.max(1.4, 2.4 * a));
      const d2 = r * r - x * x - y * y;
      return d2 >= 0 ? Math.sqrt(d2) : Number.NaN;
    },
    fx: (x, y, a) => {
      const r = Math.min(3.6, Math.max(1.4, 2.4 * a));
      const d2 = r * r - x * x - y * y;
      return d2 > 1e-4 ? -x / Math.sqrt(d2) : 0;
    },
    fy: (x, y, a) => {
      const r = Math.min(3.6, Math.max(1.4, 2.4 * a));
      const d2 = r * r - x * x - y * y;
      return d2 > 1e-4 ? -y / Math.sqrt(d2) : 0;
    },
    zRange: [0, 3.6],
    domainR: 3.6,
  },
};

export interface LimitFuncSpec {
  id: Ch3LimitFuncId;
  name: BilingualLabel;
  latex: string;
  exists: boolean;
  eval: (x: number, y: number) => number;
}

export const LIMIT_FUNCS: Record<Ch3LimitFuncId, LimitFuncSpec> = {
  xy_over_r2: {
    id: 'xy_over_r2',
    name: { th: 'ไม่มีลิมิต (แยกตามเส้นตรง y=mx)', en: '2xy / (x² + y²) — DNE' },
    latex: 'f(x,y) = \\frac{2xy}{x^2 + y^2}',
    exists: false,
    eval: (x, y) => {
      const r2 = x * x + y * y;
      return r2 < 1e-8 ? 0 : (2 * x * y) / r2;
    },
  },
  x2y_over_x4y2: {
    id: 'x2y_over_x4y2',
    name: { th: 'เส้นตรงได้ 0 แต่พาราโบลาได้ ≠ 0', en: '2x²y / (x⁴ + y²) — DNE' },
    latex: 'f(x,y) = \\frac{2x^2 y}{x^4 + y^2}',
    exists: false,
    eval: (x, y) => {
      const denom = x * x * x * x + y * y;
      return denom < 1e-10 ? 0 : (2 * x * x * y) / denom;
    },
  },
  sinc_r2: {
    id: 'sinc_r2',
    name: { th: 'ลิมิตหาค่าได้ (เท่ากันทุกเส้นทาง)', en: '2sin(x²+y²)/(x²+y²) — Exists' },
    latex: 'f(x,y) = \\frac{2\\sin(x^2 + y^2)}{x^2 + y^2}',
    exists: true,
    eval: (x, y) => {
      const r2 = x * x + y * y;
      return r2 < 1e-6 ? 2 : (2 * Math.sin(r2)) / r2;
    },
  },
};

export function evaluatePathLimit(
  funcId: Ch3LimitFuncId,
  pathType: 'line' | 'parabola',
  param: number,
  lang: 'th' | 'en' = 'th',
): {
  pathLatex: string;
  limitVal: number;
  derivationLatex: string;
} {
  const pStr = fmtNum(param);
  const pathLatex =
    pathType === 'line'
      ? `y = ${Math.abs(param) < 1e-9 ? '0' : `${fmtTerm(param, 'x', true)}`}`
      : `y = ${Math.abs(param) < 1e-9 ? '0' : `${fmtTerm(param, 'x^2', true)}`}`;

  if (funcId === 'xy_over_r2') {
    if (pathType === 'line') {
      const val = (2 * param) / (1 + param * param);
      return {
        pathLatex,
        limitVal: val,
        derivationLatex: `\\lim_{x\\to 0} \\frac{2x(${pStr}x)}{x^2 + (${pStr}x)^2} = \\frac{2(${pStr})}{1 + (${pStr})^2} = ${fmtNum(val)}`,
      };
    }
    return {
      pathLatex,
      limitVal: 0,
      derivationLatex: `\\lim_{x\\to 0} \\frac{2x(${pStr}x^2)}{x^2 + ${pStr}^2 x^4} = \\lim_{x\\to 0} \\frac{2(${pStr})x}{1 + ${pStr}^2 x^2} = 0`,
    };
  }

  if (funcId === 'x2y_over_x4y2') {
    if (pathType === 'line') {
      return {
        pathLatex,
        limitVal: 0,
        derivationLatex: `\\lim_{x\\to 0} \\frac{2x^2(${pStr}x)}{x^4 + (${pStr}x)^2} = \\lim_{x\\to 0} \\frac{2(${pStr})x}{x^2 + ${pStr}^2} = 0`,
      };
    }
    const val = (2 * param) / (1 + param * param);
    return {
      pathLatex,
      limitVal: val,
      derivationLatex: `\\lim_{x\\to 0} \\frac{2x^2(${pStr}x^2)}{x^4 + (${pStr}x^2)^2} = \\frac{2(${pStr})}{1 + (${pStr})^2} = ${fmtNum(val)}`,
    };
  }

  // sinc_r2
  return {
    pathLatex,
    limitVal: 2,
    derivationLatex:
      lang === 'en'
        ? `\\lim_{(x,y)\\to(0,0)} \\frac{2\\sin(r^2)}{r^2} = 2 \\;\\;(\\text{same along all paths})`
        : `\\lim_{(x,y)\\to(0,0)} \\frac{2\\sin(r^2)}{r^2} = 2 \\;\\;(\\text{เหมือนกันทุกเส้นทาง})`,
  };
}

export interface CriticalPointInfo {
  x: number;
  y: number;
  z: number;
  fxx: number;
  fyy: number;
  fxy: number;
  dVal: number;
  kind: 'min' | 'max' | 'saddle' | 'inconclusive';
  label: BilingualLabel;
  color: string;
}

export function classifySecondDeriv(
  x: number,
  y: number,
  z: number,
  fxx: number,
  fyy: number,
  fxy: number,
): CriticalPointInfo {
  const dVal = fxx * fyy - fxy * fxy;
  if (dVal < -1e-5) {
    return {
      x,
      y,
      z,
      fxx,
      fyy,
      fxy,
      dVal,
      kind: 'saddle',
      label: { th: 'จุดอานม้า (Saddle Point)', en: 'Saddle Point' },
      color: '#f59e0b',
    };
  }
  if (dVal > 1e-5) {
    if (fxx > 0) {
      return {
        x,
        y,
        z,
        fxx,
        fyy,
        fxy,
        dVal,
        kind: 'min',
        label: { th: 'ค่าต่ำสุดสัมพัทธ์ (Local Min)', en: 'Local Minimum' },
        color: '#10b981',
      };
    }
    return {
      x,
      y,
      z,
      fxx,
      fyy,
      fxy,
      dVal,
      kind: 'max',
      label: { th: 'ค่าสูงสุดสัมพัทธ์ (Local Max)', en: 'Local Maximum' },
      color: '#ef4444',
    };
  }
  return {
    x,
    y,
    z,
    fxx,
    fyy,
    fxy,
    dVal,
    kind: 'inconclusive',
    label: { th: 'สรุปไม่ได้ (D = 0)', en: 'Inconclusive (D = 0)' },
    color: '#64748b',
  };
}

export interface ExtremaPresetSpec {
  id: Ch3ExtremaPresetId;
  name: BilingualLabel;
  latex: string;
  eval: (x: number, y: number) => number;
  fx: (x: number, y: number) => number;
  fy: (x: number, y: number) => number;
  criticalPoints: CriticalPointInfo[];
  domainR: number;
}

export const EXTREMA_PRESETS: Record<Ch3ExtremaPresetId, ExtremaPresetSpec> = {
  cubic_saddle_min: {
    id: 'cubic_saddle_min',
    name: { th: 'จุดอานม้า + จุดต่ำสุด', en: 'Cubic (Saddle + Min)' },
    latex: 'f(x,y) = 0.3(x^3 + y^3 - 3xy)',
    eval: (x, y) => 0.3 * (x * x * x + y * y * y - 3 * x * y),
    fx: (x, y) => 0.9 * (x * x - y),
    fy: (x, y) => 0.9 * (y * y - x),
    criticalPoints: [
      classifySecondDeriv(0, 0, 0, 0, 0, -0.9),
      classifySecondDeriv(1, 1, -0.3, 1.8, 1.8, -0.9),
    ],
    domainR: 2.3,
  },
  quartic_two_mins: {
    id: 'quartic_two_mins',
    name: { th: '2 จุดต่ำสุด + 1 อานม้า', en: 'Quartic (2 Mins + Saddle)' },
    latex: 'f(x,y) = 0.25(x^4 + y^4 - 4xy + 1)',
    eval: (x, y) => 0.25 * (x ** 4 + y ** 4 - 4 * x * y + 1),
    fx: (x, y) => x * x * x - y,
    fy: (x, y) => y * y * y - x,
    criticalPoints: [
      classifySecondDeriv(0, 0, 0.25, 0, 0, -1),
      classifySecondDeriv(1, 1, -0.25, 3, 3, -1),
      classifySecondDeriv(-1, -1, -0.25, 3, 3, -1),
    ],
    domainR: 2.0,
  },
  double_peak: {
    id: 'double_peak',
    name: { th: '1 ยอดสูงสุด + 1 หลุมต่ำสุด', en: 'Gaussian Dipole (Max + Min)' },
    latex: 'f(x,y) = 3x\\,e^{-(x^2+y^2)/2}',
    eval: (x, y) => 3 * x * Math.exp(-(x * x + y * y) / 2),
    fx: (x, y) => 3 * (1 - x * x) * Math.exp(-(x * x + y * y) / 2),
    fy: (x, y) => -3 * x * y * Math.exp(-(x * x + y * y) / 2),
    criticalPoints: [
      classifySecondDeriv(
        1,
        0,
        3 * Math.exp(-0.5),
        -6 * Math.exp(-0.5),
        -3 * Math.exp(-0.5),
        0,
      ),
      classifySecondDeriv(
        -1,
        0,
        -3 * Math.exp(-0.5),
        6 * Math.exp(-0.5),
        3 * Math.exp(-0.5),
        0,
      ),
    ],
    domainR: 3.0,
  },
};

/**
 * Builds a clipped smooth mesh over [-domainR, domainR]^2 for any analytical f(x, y).
 */
export function buildCartesianMultivarMesh(
  evalFn: (x: number, y: number) => number,
  fxFn: (x: number, y: number) => number,
  fyFn: (x: number, y: number) => number,
  domainR: number,
  limit = BOX_LIMIT,
): THREE.BufferGeometry | null {
  const n = 60;
  const grid: MathVertex[][] = [];
  for (let i = 0; i <= n; i++) {
    const x = -domainR + (2 * domainR * i) / n;
    const row: MathVertex[] = [];
    for (let j = 0; j <= n; j++) {
      const y = -domainR + (2 * domainR * j) / n;
      const z = evalFn(x, y);
      const fx = fxFn(x, y);
      const fy = fyFn(x, y);
      const len = Math.hypot(fx, fy, 1) || 1;
      row.push({
        p: [x, y, z],
        n: [-fx / len, -fy / len, 1 / len],
      });
    }
    grid.push(row);
  }

  const bounds: [number, number, number, number, number, number] = [
    -limit,
    limit,
    -limit,
    limit,
    -limit,
    limit,
  ];
  const tris: Array<[MathVertex, MathVertex, MathVertex]> = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v00 = grid[i][j];
      const v10 = grid[i + 1][j];
      const v01 = grid[i][j + 1];
      const v11 = grid[i + 1][j + 1];
      tris.push(...clipTriangleToBounds(v00, v10, v11, bounds));
      tris.push(...clipTriangleToBounds(v00, v11, v01, bounds));
    }
  }
  if (tris.length === 0) return null;
  return buildBufferGeometryFromTriangles(tris, 'teal', 3.2);
}

/**
 * Builds a clean polar surface mesh (for hemisphere dome & origin-singularity limits).
 */
export function buildPolarMultivarMesh(
  evalFn: (x: number, y: number) => number,
  rMin: number,
  rMax: number,
  limit = BOX_LIMIT,
): THREE.BufferGeometry | null {
  const nR = 36;
  const nT = 84;
  const pts: Vec3[][] = [];

  for (let i = 0; i <= nR; i++) {
    const r = rMin + ((rMax - rMin) * i) / nR;
    const row: Vec3[] = [];
    for (let j = 0; j <= nT; j++) {
      const th = (2 * Math.PI * j) / nT;
      const x = r * Math.cos(th);
      const y = r * Math.sin(th);
      const z = evalFn(x, y);
      row.push([x, y, Number.isFinite(z) ? z : 0]);
    }
    pts.push(row);
  }

  // Numerical smooth normals on grid
  const normals: Vec3[][] = [];
  for (let i = 0; i <= nR; i++) {
    const row: Vec3[] = [];
    for (let j = 0; j <= nT; j++) {
      const i0 = Math.max(0, i - 1);
      const i1 = Math.min(nR, i + 1);
      const j0 = (j - 1 + nT) % nT;
      const j1 = (j + 1) % nT;
      const pR0 = pts[i0][j];
      const pR1 = pts[i1][j];
      const pT0 = pts[i][j0];
      const pT1 = pts[i][j1];
      const dR: Vec3 = [pR1[0] - pR0[0], pR1[1] - pR0[1], pR1[2] - pR0[2]];
      const dT: Vec3 = [pT1[0] - pT0[0], pT1[1] - pT0[1], pT1[2] - pT0[2]];
      const nx = dR[1] * dT[2] - dR[2] * dT[1];
      const ny = dR[2] * dT[0] - dR[0] * dT[2];
      const nz = dR[0] * dT[1] - dR[1] * dT[0];
      const len = Math.hypot(nx, ny, nz) || 1;
      row.push([nx / len, ny / len, nz / len]);
    }
    normals.push(row);
  }

  const bounds: [number, number, number, number, number, number] = [
    -limit,
    limit,
    -limit,
    limit,
    -limit,
    limit,
  ];
  const tris: Array<[MathVertex, MathVertex, MathVertex]> = [];
  for (let i = 0; i < nR; i++) {
    for (let j = 0; j < nT; j++) {
      const v00: MathVertex = { p: pts[i][j], n: normals[i][j] };
      const v10: MathVertex = { p: pts[i + 1][j], n: normals[i + 1][j] };
      const v01: MathVertex = { p: pts[i][j + 1], n: normals[i][j + 1] };
      const v11: MathVertex = { p: pts[i + 1][j + 1], n: normals[i + 1][j + 1] };
      tris.push(...clipTriangleToBounds(v00, v10, v11, bounds));
      tris.push(...clipTriangleToBounds(v00, v11, v01, bounds));
    }
  }
  if (tris.length === 0) return null;
  return buildBufferGeometryFromTriangles(tris, 'teal', 2.8);
}

/**
 * Extracts 2D contour line segments via Marching Squares for level z = levelK.
 */
export function extractContours2D(
  evalFn: (x: number, y: number) => number,
  domainR: number,
  levelK: number,
  resolution = 52,
): Array<[[number, number], [number, number]]> {
  const step = (2 * domainR) / resolution;
  const grid: number[][] = [];
  for (let i = 0; i <= resolution; i++) {
    const x = -domainR + i * step;
    const row: number[] = [];
    for (let j = 0; j <= resolution; j++) {
      const y = -domainR + j * step;
      row.push(evalFn(x, y));
    }
    grid.push(row);
  }

  const interp = (
    p1: [number, number],
    p2: [number, number],
    v1: number,
    v2: number,
  ): [number, number] => {
    const dv = v2 - v1;
    const t = Math.abs(dv) < 1e-12 ? 0.5 : Math.max(0, Math.min(1, (levelK - v1) / dv));
    return [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])];
  };

  const segments: Array<[[number, number], [number, number]]> = [];

  for (let i = 0; i < resolution; i++) {
    const x0 = -domainR + i * step;
    const x1 = x0 + step;
    for (let j = 0; j < resolution; j++) {
      const y0 = -domainR + j * step;
      const y1 = y0 + step;

      const v0 = grid[i][j]; // bottom-left
      const v1 = grid[i + 1][j]; // bottom-right
      const v2 = grid[i + 1][j + 1]; // top-right
      const v3 = grid[i][j + 1]; // top-left

      if (
        !Number.isFinite(v0) ||
        !Number.isFinite(v1) ||
        !Number.isFinite(v2) ||
        !Number.isFinite(v3)
      ) {
        continue;
      }

      const p0: [number, number] = [x0, y0];
      const p1: [number, number] = [x1, y0];
      const p2: [number, number] = [x1, y1];
      const p3: [number, number] = [x0, y1];

      const crossings: Array<[number, number]> = [];
      const b0 = v0 >= levelK;
      const b1 = v1 >= levelK;
      const b2 = v2 >= levelK;
      const b3 = v3 >= levelK;

      if (b0 !== b1) crossings.push(interp(p0, p1, v0, v1));
      if (b1 !== b2) crossings.push(interp(p1, p2, v1, v2));
      if (b2 !== b3) crossings.push(interp(p2, p3, v2, v3));
      if (b3 !== b0) crossings.push(interp(p3, p0, v3, v0));

      if (crossings.length === 2) {
        segments.push([crossings[0], crossings[1]]);
      } else if (crossings.length === 4) {
        const avg = 0.25 * (v0 + v1 + v2 + v3);
        if ((avg >= levelK) === b0) {
          segments.push([crossings[0], crossings[3]]);
          segments.push([crossings[1], crossings[2]]);
        } else {
          segments.push([crossings[0], crossings[1]]);
          segments.push([crossings[2], crossings[3]]);
        }
      }
    }
  }

  return segments;
}
