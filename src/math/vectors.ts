import type {
  ArithmeticState,
  BilingualLabel,
  CoordsVecState,
  CrossTripleState,
  DotProjState,
  Lines3DState,
  Vec3Tuple,
} from '../types';
import { fmtNum, fmtTerm } from './latex';
import type { PresetItem } from './presets';

export function vecAdd(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vecSub(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vecScale(a: Vec3Tuple, k: number): Vec3Tuple {
  return [a[0] * k, a[1] * k, a[2] * k];
}

export function vecDot(a: Vec3Tuple, b: Vec3Tuple): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vecCross(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function vecNorm(a: Vec3Tuple): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function vecUnit(a: Vec3Tuple): Vec3Tuple | null {
  const n = vecNorm(a);
  if (n < 1e-8) return null;
  return [a[0] / n, a[1] / n, a[2] / n];
}

export function vecAngleDeg(a: Vec3Tuple, b: Vec3Tuple): number | null {
  const na = vecNorm(a);
  const nb = vecNorm(b);
  if (na < 1e-8 || nb < 1e-8) return null;
  const cos = Math.max(-1, Math.min(1, vecDot(a, b) / (na * nb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function vecProj(u: Vec3Tuple, ontoV: Vec3Tuple): Vec3Tuple | null {
  const v2 = vecDot(ontoV, ontoV);
  if (v2 < 1e-8) return null;
  const scale = vecDot(u, ontoV) / v2;
  return vecScale(ontoV, scale);
}

export function scalarTriple(u: Vec3Tuple, v: Vec3Tuple, w: Vec3Tuple): number {
  return vecDot(u, vecCross(v, w));
}

export function getOctant(p: Vec3Tuple): BilingualLabel {
  const [x, y, z] = p;
  const eps = 1e-6;
  if (Math.abs(x) < eps && Math.abs(y) < eps && Math.abs(z) < eps) {
    return { th: 'จุดกำเนิด (0,0,0)', en: 'Origin (0,0,0)' };
  }
  if (Math.abs(x) < eps || Math.abs(y) < eps || Math.abs(z) < eps) {
    const zeros: string[] = [];
    if (Math.abs(x) < eps) zeros.push('x=0');
    if (Math.abs(y) < eps) zeros.push('y=0');
    if (Math.abs(z) < eps) zeros.push('z=0');
    return {
      th: `อยู่บนแกน/ระนาบ (${zeros.join(', ')})`,
      en: `On Plane/Axis (${zeros.join(', ')})`,
    };
  }

  let roman = 'I';
  if (z > 0) {
    if (x > 0 && y > 0) roman = 'I';
    else if (x < 0 && y > 0) roman = 'II';
    else if (x < 0 && y < 0) roman = 'III';
    else roman = 'IV';
  } else {
    if (x > 0 && y > 0) roman = 'V';
    else if (x < 0 && y > 0) roman = 'VI';
    else if (x < 0 && y < 0) roman = 'VII';
    else roman = 'VIII';
  }
  return {
    th: `อัฐภาคที่ ${roman}`,
    en: `Octant ${roman}`,
  };
}

export function fmtPoint(p: Vec3Tuple, decimals = 2): string {
  return `(${fmtNum(p[0], decimals)}, ${fmtNum(p[1], decimals)}, ${fmtNum(p[2], decimals)})`;
}

export function fmtVecAngle(v: Vec3Tuple, decimals = 2): string {
  return `\\langle ${fmtNum(v[0], decimals)},\\, ${fmtNum(v[1], decimals)},\\, ${fmtNum(v[2], decimals)} \\rangle`;
}

export function fmtVecIJK(v: Vec3Tuple, decimals = 2): string {
  const terms: Array<[number, string]> = [
    [v[0], '\\mathbf{i}'],
    [v[1], '\\mathbf{j}'],
    [v[2], '\\mathbf{k}'],
  ];
  let out = '';
  for (const [c, unit] of terms) {
    if (Math.abs(c) < 1e-6) continue;
    const rounded = Math.round(c * 10 ** decimals) / 10 ** decimals;
    out += fmtTerm(rounded, unit, out === '');
  }
  return out === '' ? '\\mathbf{0}' : out;
}

export function fmtNormExactOrDecimal(v: Vec3Tuple): string {
  const sq = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
  const val = Math.sqrt(sq);
  const roundedSq = Math.round(sq);
  if (Math.abs(sq - roundedSq) < 1e-6 && roundedSq > 0) {
    if (Math.abs(val - Math.round(val)) < 1e-6) {
      return fmtNum(val);
    }
    return `\\sqrt{${roundedSq}} \\approx ${fmtNum(val)}`;
  }
  return fmtNum(val);
}

function fmtLinearParam(varName: string, p0: number, d: number): string {
  const hasP0 = Math.abs(p0) > 1e-6;
  const hasD = Math.abs(d) > 1e-6;
  if (!hasP0 && !hasD) return `${varName} = 0`;
  if (!hasD) return `${varName} = ${fmtNum(p0)}`;
  const pPart = hasP0 ? fmtNum(p0) : '';
  const tPart = fmtTerm(d, 't', !hasP0);
  return `${varName} = ${pPart}${tPart}`;
}

export interface LineEquationsLatex {
  vector: string;
  parametric: string;
  symmetric: string;
  isDegenerate: boolean;
}

export function buildLineEquationsLatex(
  p0: Vec3Tuple,
  dir: Vec3Tuple,
  lang: 'th' | 'en' = 'th',
): LineEquationsLatex {
  const isDegenerate = vecNorm(dir) < 1e-6;
  const vector = `\\mathbf{r}(t) = ${fmtVecAngle(p0)} + t${fmtVecAngle(dir)}`;
  const px = fmtLinearParam('x', p0[0], dir[0]);
  const py = fmtLinearParam('y', p0[1], dir[1]);
  const pz = fmtLinearParam('z', p0[2], dir[2]);
  const parametric = `${px},\\quad ${py},\\quad ${pz}`;

  if (isDegenerate) {
    return {
      vector,
      parametric,
      symmetric:
        lang === 'en'
          ? `\\text{Direction vector } \\mathbf{v} = \\mathbf{0} \\;(\\text{point } ${fmtPoint(p0)})`
          : `\\text{เวกเตอร์ทิศทาง } \\mathbf{v} = \\mathbf{0} \\;(\\text{จุด } ${fmtPoint(p0)})`,
      isDegenerate: true,
    };
  }

  const vars: Array<{ name: string; p: number; d: number }> = [
    { name: 'x', p: p0[0], d: dir[0] },
    { name: 'y', p: p0[1], d: dir[1] },
    { name: 'z', p: p0[2], d: dir[2] },
  ];

  const fracParts: string[] = [];
  const fixedParts: string[] = [];

  for (const item of vars) {
    if (Math.abs(item.d) < 1e-6) {
      fixedParts.push(`${item.name} = ${fmtNum(item.p)}`);
    } else {
      const num =
        Math.abs(item.p) < 1e-6
          ? item.name
          : `${item.name} ${item.p > 0 ? '-' : '+'} ${fmtNum(Math.abs(item.p))}`;
      fracParts.push(`\\frac{${num}}{${fmtNum(item.d)}}`);
    }
  }

  let symmetric = fracParts.join(' = ');
  if (fixedParts.length > 0) {
    if (fracParts.length === 1) {
      // e.g., x = 1, y = 2 (z varies freely)
      const freeVar = vars.find((v) => Math.abs(v.d) > 1e-6)?.name ?? 't';
      symmetric = `${fixedParts.join(',\\; ')}\\;\\;(${freeVar} \\in \\mathbb{R})`;
    } else {
      symmetric = `${symmetric},\\quad ${fixedParts.join(',\\; ')}`;
    }
  }

  return { vector, parametric, symmetric, isDegenerate: false };
}

// Presets for Chapter 1
export const SINGLE_POINT_PRESETS: Array<PresetItem<CoordsVecState>> = [
  {
    id: 'pt-oct1',
    label: { th: 'อัฐภาค I (2, 3, 2)', en: 'Octant I (2, 3, 2)' },
    value: { subMode: 'single_point', p2: [2, 3, 2], plotStep: 3 },
  },
  {
    id: 'pt-oct2',
    label: { th: 'อัฐภาค II (-2, 3, 2)', en: 'Octant II (-2, 3, 2)' },
    value: { subMode: 'single_point', p2: [-2, 3, 2], plotStep: 3 },
  },
  {
    id: 'pt-oct7',
    label: { th: 'อัฐภาค VII (-2, -2, -2)', en: 'Octant VII (-2, -2, -2)' },
    value: { subMode: 'single_point', p2: [-2, -2, -2], plotStep: 3 },
  },
  {
    id: 'pt-xy',
    label: { th: 'บนระนาบ xy (2, 3, 0)', en: 'On xy-plane (2, 3, 0)' },
    value: { subMode: 'single_point', p2: [2, 3, 0], plotStep: 3 },
  },
];

export const COORDS_VEC_PRESETS: Array<PresetItem<CoordsVecState>> = [
  {
    id: 'octant1',
    label: { th: 'จุดกำเนิด → (2,3,3)', en: 'Origin to (2,3,3)' },
    value: { p1: [0, 0, 0], p2: [2, 3, 3] },
  },
  {
    id: 'two-pts',
    label: { th: 'เวกเตอร์ P₁P₂', en: 'Vector P₁P₂' },
    value: { p1: [1, -1, 1], p2: [3, 2, 3] },
  },
  {
    id: 'neg-oct',
    label: { th: 'อัฐภาคลบ (-2,-2,3)', en: 'Octant III (-2,-2,3)' },
    value: { p1: [0, 0, 0], p2: [-2, -2, 3] },
  },
  {
    id: 'axis-345',
    label: { th: 'เวกเตอร์ขนาด 5 (0,3,4)', en: '3-4-5 Vector' },
    value: { p1: [0, 0, 0], p2: [0, 3, 4] },
  },
];

export const ARITHMETIC_PRESETS: Array<PresetItem<ArithmeticState>> = [
  {
    id: 'add-demo',
    label: { th: 'บวก u + v', en: 'Add u + v' },
    value: { u: [2, 0.5, 1], v: [0.5, 2.5, 1.5], scalarK: 1.5, operation: 'add', slideProgress: 1 },
  },
  {
    id: 'sub-demo',
    label: { th: 'ลบ u - v', en: 'Subtract u - v' },
    value: { u: [2, 2, 1], v: [1, -1.5, 2], scalarK: 1.5, operation: 'sub', slideProgress: 1 },
  },
  {
    id: 'scale-neg',
    label: { th: 'คูณสเกลาร์ k = -1.5', en: 'Scale k = -1.5' },
    value: { u: [1.5, 1, 1.5], v: [0, 2, 1], scalarK: -1.5, operation: 'scalar', slideProgress: 1 },
  },
];

export const DOT_PROJ_PRESETS: Array<PresetItem<DotProjState>> = [
  {
    id: 'acute',
    label: { th: 'มุมแหลม (u·v > 0)', en: 'Acute Angle' },
    value: { subMode: 'dot_proj', u: [2, 3, 2], v: [3, 1, 0] },
  },
  {
    id: 'ortho',
    label: { th: 'ตั้งฉาก (u·v = 0)', en: 'Orthogonal' },
    value: { subMode: 'dot_proj', u: [2, -1, 2], v: [1, 2, 0] },
  },
  {
    id: 'obtuse',
    label: { th: 'มุมป้าน (u·v < 0)', en: 'Obtuse Angle' },
    value: { subMode: 'dot_proj', u: [-1.5, 2, 2], v: [3, 1, 0] },
  },
  {
    id: 'dir-ang',
    label: { th: 'มุมบอกทิศทาง α,β,γ', en: 'Direction Angles' },
    value: { subMode: 'dir_angles', u: [2, 2, 2], v: [1, 0, 0] },
  },
];

export const CROSS_TRIPLE_PRESETS: Array<PresetItem<CrossTripleState>> = [
  {
    id: 'cross-ij',
    label: { th: 'i × j = k (แนวแกน)', en: 'Axes Cross Product' },
    value: { subMode: 'cross', u: [2, 0, 0], v: [0, 2, 0], reverseOrder: false },
  },
  {
    id: 'cross-gen',
    label: { th: 'ตั้งฉากระนาบทั่วไป', en: 'General Cross' },
    value: { subMode: 'cross', u: [2, 1, 0], v: [0, 2, 1.5], reverseOrder: false },
  },
  {
    id: 'triple-box',
    label: { th: 'ปริมาตรกล่อง 3 เวกเตอร์', en: 'Parallelepiped Vol' },
    value: { subMode: 'triple', u: [2, 0, 0.5], v: [0.5, 2, 0], w: [0.5, 0.5, 2.5] },
  },
  {
    id: 'coplanar',
    label: { th: 'ระนาบเดียวกัน (V = 0)', en: 'Coplanar (V = 0)' },
    value: { subMode: 'triple', u: [2, 0, 0], v: [0, 2, 0], w: [1.5, 1.5, 0] },
  },
];

export const LINES3D_PRESETS: Array<PresetItem<Lines3DState>> = [
  {
    id: 'line-gen',
    label: { th: 'เส้นตรงผ่าน (1,-1,2)', en: 'Line via (1,-1,2)' },
    value: { inputMode: 'point_dir', p0: [1, -1, 2], dir: [1, 2, -1], t: 1 },
  },
  {
    id: 'line-2pt',
    label: { th: 'ผ่านจุด 2 จุด', en: 'Through 2 Points' },
    value: { inputMode: 'two_points', p0: [-1, 1, 0], p2: [2, 2, 3], t: 1 },
  },
  {
    id: 'line-par-z',
    label: { th: 'ขนานแกน z (x=2, y=1)', en: 'Parallel to z-axis' },
    value: { inputMode: 'point_dir', p0: [2, 1, 0], dir: [0, 0, 2], t: 1 },
  },
  {
    id: 'line-xy',
    label: { th: 'อยู่บนระนาบ z = 2', en: 'In plane z = 2' },
    value: { inputMode: 'point_dir', p0: [0, 1, 2], dir: [2, -1, 0], t: 1 },
  },
];
