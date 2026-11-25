import type {
  AxisName,
  CylindersState,
  PlanesState,
  QuadricsState,
  TranslationState,
} from '../types';
import { axisVarNames } from './coords';

/**
 * Formats a number cleanly: removes -0, trims trailing zeros up to `decimals`.
 */
export function fmtNum(n: number, decimals = 2): string {
  const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals;
  const clean = Math.abs(rounded) < 1e-9 ? 0 : rounded;
  return Number.isInteger(clean) ? String(clean) : String(clean);
}

/**
 * Formats a linear/quadratic term such as "2x", "-x", "+ 3y^2".
 */
export function fmtTerm(coeff: number, varLatex: string, isFirst: boolean): string {
  if (Math.abs(coeff) < 1e-9) return '';
  const absVal = Math.abs(coeff);
  const sign = coeff < 0 ? (isFirst ? '-' : ' - ') : isFirst ? '' : ' + ';
  const coeffStr =
    varLatex !== '' && Math.abs(absVal - 1) < 1e-9 ? '' : fmtNum(absVal);
  return `${sign}${coeffStr}${varLatex}`;
}

export function fmtShiftedVar(varName: string, shift: number): string {
  if (Math.abs(shift) < 1e-9) return varName;
  const op = shift > 0 ? '-' : '+';
  return `(${varName} ${op} ${fmtNum(Math.abs(shift))})`;
}

export function fmtShiftedSq(varName: string, shift: number): string {
  if (Math.abs(shift) < 1e-9) return `${varName}^2`;
  const op = shift > 0 ? '-' : '+';
  return `(${varName} ${op} ${fmtNum(Math.abs(shift))})^2`;
}

export function fmtFracSq(varName: string, denomSq: number, shift = 0): string {
  const sq = fmtShiftedSq(varName, shift);
  if (Math.abs(denomSq - 1) < 1e-9) return sq;
  return `\\frac{${sq}}{${fmtNum(denomSq)}}`;
}

function buildLinearExpr(terms: Array<[number, string]>): string {
  let out = '';
  for (const [coeff, v] of terms) {
    if (Math.abs(coeff) < 1e-9) continue;
    out += fmtTerm(coeff, v, out === '');
  }
  return out === '' ? '0' : out;
}

export function buildPlaneEquationLatex(s: PlanesState): string {
  const lhs = buildLinearExpr([
    [s.a, 'x'],
    [s.b, 'y'],
    [s.c, 'z'],
  ]);
  return `${lhs} = ${fmtNum(s.d)}`;
}

export function buildCylinderEquationLatex(s: CylindersState): string {
  const { u, v } = axisVarNames(s.missingAxis);
  const a2 = s.a * s.a;
  const b2 = s.b * s.b;

  if (s.type === 'elliptic') {
    return `${fmtFracSq(u, a2)} + ${fmtFracSq(v, b2)} = 1`;
  }
  if (s.type === 'parabolic') {
    const aTerm = fmtTerm(s.a, `${u}^2`, true);
    const cTerm = Math.abs(s.c) < 1e-9 ? '' : fmtTerm(s.c, '', false);
    return `${v} = ${aTerm}${cTerm}`;
  }
  if (s.type === 'hyperbolic') {
    return s.hyperbolicSign === 1
      ? `${fmtFracSq(u, a2)} - ${fmtFracSq(v, b2)} = 1`
      : `${fmtFracSq(v, b2)} - ${fmtFracSq(u, a2)} = 1`;
  }
  // sine wave
  const amp = Math.abs(s.a - 1) < 1e-9 ? '' : Math.abs(s.a + 1) < 1e-9 ? '-' : fmtNum(s.a);
  const freq = Math.abs(s.b - 1) < 1e-9 ? '' : fmtNum(s.b);
  return `${v} = ${amp}\\sin(${freq}${u})`;
}

export function buildCylinderGeneralLatex(s: CylindersState): string {
  const { u, v } = axisVarNames(s.missingAxis);
  const a2 = s.a * s.a;
  const b2 = s.b * s.b;

  if (s.type === 'sine') {
    const amp = Math.abs(s.a - 1) < 1e-9 ? '' : Math.abs(s.a + 1) < 1e-9 ? '-' : fmtNum(s.a);
    const freq = Math.abs(s.b - 1) < 1e-9 ? '' : fmtNum(s.b);
    return `${v} - ${amp}\\sin(${freq}${u}) = 0`;
  }

  if (s.type === 'parabolic') {
    const m = findCleanScale([Math.max(1e-3, Math.abs(1 / (s.a || 1)))]);
    const cu = m * s.a;
    const cv = -m;
    const cc = m * s.c;
    const lhs = buildLinearExpr([
      [cu, `${u}^2`],
      [cv, v],
      [cc, ''],
    ]);
    return `${lhs} = 0`;
  }

  const m = findCleanScale([a2, b2]);
  const su = s.type === 'hyperbolic' && s.hyperbolicSign === -1 ? -1 : 1;
  const sv = s.type === 'hyperbolic' && s.hyperbolicSign === 1 ? -1 : 1;
  const cu = su * (m / a2);
  const cv = sv * (m / b2);
  const lhs = buildLinearExpr([
    [cu, `${u}^2`],
    [cv, `${v}^2`],
    [-m, ''],
  ]);
  return `${lhs} = 0`;
}

export function buildQuadricEquationLatex(s: QuadricsState): string {
  const { u, v, w } = axisVarNames(s.symmetryAxis);
  const a2 = s.a * s.a;
  const b2 = s.b * s.b;
  const c2 = s.c * s.c;

  switch (s.mode) {
    case 'ellipsoid':
      return `${fmtFracSq('x', a2)} + ${fmtFracSq('y', b2)} + ${fmtFracSq('z', c2)} = 1`;
    case 'cone':
      return `${fmtFracSq(w, c2)} = ${fmtFracSq(u, a2)} + ${fmtFracSq(v, b2)}`;
    case 'elliptic_paraboloid':
      return `${s.paraboloidSign < 0 ? '-' : ''}${w} = ${fmtFracSq(u, a2)} + ${fmtFracSq(v, b2)}`;
    case 'hyperbolic_paraboloid':
      return `${s.paraboloidSign < 0 ? '-' : ''}${w} = ${fmtFracSq(u, a2)} - ${fmtFracSq(v, b2)}`;
    case 'hyperboloid_1':
      return `${fmtFracSq(u, a2)} + ${fmtFracSq(v, b2)} - ${fmtFracSq(w, c2)} = 1`;
    case 'hyperboloid_2':
      return `${fmtFracSq(w, c2)} - ${fmtFracSq(u, a2)} - ${fmtFracSq(v, b2)} = 1`;
    case 'morph':
      return `${fmtFracSq(u, a2)} + ${fmtFracSq(v, b2)} - ${fmtFracSq(w, c2)} = ${fmtNum(s.morphD)}`;
  }
}

export function buildQuadricGeneralLatex(s: QuadricsState): string {
  const { u, v, w } = axisVarNames(s.symmetryAxis);
  const a2 = s.a * s.a;
  const b2 = s.b * s.b;
  const c2 = s.c * s.c;

  const mapByAxis = (valU: number, valV: number, valW: number): Record<AxisName, number> =>
    ({ [u]: valU, [v]: valV, [w]: valW }) as Record<AxisName, number>;

  if (s.mode === 'elliptic_paraboloid' || s.mode === 'hyperbolic_paraboloid') {
    const signV = s.mode === 'hyperbolic_paraboloid' ? -1 : 1;
    const m = findCleanScale([a2, b2]);
    const coeffMap = mapByAxis(m / a2, (signV * m) / b2, 0);
    const linMap = mapByAxis(0, 0, -s.paraboloidSign * m);
    const lhs = buildLinearExpr([
      [coeffMap.x, 'x^2'],
      [coeffMap.y, 'y^2'],
      [coeffMap.z, 'z^2'],
      [linMap.x, 'x'],
      [linMap.y, 'y'],
      [linMap.z, 'z'],
    ]);
    return `${lhs} = 0`;
  }

  const m = findCleanScale([a2, b2, c2]);
  let coeffMap: Record<AxisName, number>;
  let constTerm = 0;

  if (s.mode === 'ellipsoid') {
    coeffMap = { x: m / a2, y: m / b2, z: m / c2 };
    constTerm = -m;
  } else if (s.mode === 'cone') {
    coeffMap = mapByAxis(m / a2, m / b2, -m / c2);
    constTerm = 0;
  } else if (s.mode === 'hyperboloid_1') {
    coeffMap = mapByAxis(m / a2, m / b2, -m / c2);
    constTerm = -m;
  } else if (s.mode === 'hyperboloid_2') {
    coeffMap = mapByAxis(-m / a2, -m / b2, m / c2);
    constTerm = -m;
  } else {
    // morph: u^2/a^2 + v^2/b^2 - w^2/c^2 - morphD = 0
    coeffMap = mapByAxis(m / a2, m / b2, -m / c2);
    constTerm = -m * s.morphD;
  }

  const lhs = buildLinearExpr([
    [coeffMap.x, 'x^2'],
    [coeffMap.y, 'y^2'],
    [coeffMap.z, 'z^2'],
    [constTerm, ''],
  ]);
  return `${lhs} = 0`;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

/**
 * Finds a clean positive multiplier M such that M * coeffs[i] are integers
 * when possible (within cap), keeping expanded equations textbook-friendly.
 */
function findCleanScale(denoms: number[]): number {
  const factor = 144;
  const scaledInts = denoms.map((d) => Math.round(d * factor));
  const isClean = denoms.every((d, i) => d > 1e-6 && Math.abs(d * factor - scaledInts[i]) < 1e-3);
  if (!isClean) return 1;

  const reducedDenoms = scaledInts.map((n) => n / gcd(factor, n));
  let m = 1;
  for (const rd of reducedDenoms) {
    m = lcm(m, rd);
    if (m > 2500) return 1;
  }
  return m;
}

export interface TranslationEquationsLatex {
  expanded: string;
  standard: string;
  shifted: string;
  axisShiftSummary: string;
}

export function buildTranslationEquationsLatex(s: TranslationState): TranslationEquationsLatex {
  const { x0, y0, z0, a, b, c, surfaceType, symmetryAxis } = s;
  const a2 = a * a;
  const b2 = b * b;
  const c2 = c * c;

  const { u, v, w } = axisVarNames(symmetryAxis);
  const shiftMap: Record<AxisName, number> = { x: x0, y: y0, z: z0 };

  let standard = '';
  let shifted = '';
  const quadCoeff: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  const linCoeff: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  let constTerm = 0;

  if (surfaceType === 'ellipsoid') {
    const m = findCleanScale([a2, b2, c2]);
    quadCoeff.x = m / a2;
    quadCoeff.y = m / b2;
    quadCoeff.z = m / c2;
    linCoeff.x = -2 * quadCoeff.x * x0;
    linCoeff.y = -2 * quadCoeff.y * y0;
    linCoeff.z = -2 * quadCoeff.z * z0;
    constTerm = quadCoeff.x * x0 * x0 + quadCoeff.y * y0 * y0 + quadCoeff.z * z0 * z0 - m;

    standard = `${fmtFracSq('x', a2, x0)} + ${fmtFracSq('y', b2, y0)} + ${fmtFracSq('z', c2, z0)} = 1`;
    shifted = `${fmtFracSq("x'", a2)} + ${fmtFracSq("y'", b2)} + ${fmtFracSq("z'", c2)} = 1`;
  } else if (surfaceType === 'hyperboloid_1') {
    const m = findCleanScale([a2, b2, c2]);
    quadCoeff[u] = m / a2;
    quadCoeff[v] = m / b2;
    quadCoeff[w] = -m / c2;
    linCoeff.x = -2 * quadCoeff.x * x0;
    linCoeff.y = -2 * quadCoeff.y * y0;
    linCoeff.z = -2 * quadCoeff.z * z0;
    constTerm = quadCoeff.x * x0 * x0 + quadCoeff.y * y0 * y0 + quadCoeff.z * z0 * z0 - m;

    standard = `${fmtFracSq(u, a2, shiftMap[u])} + ${fmtFracSq(v, b2, shiftMap[v])} - ${fmtFracSq(w, c2, shiftMap[w])} = 1`;
    shifted = `${fmtFracSq(`${u}'`, a2)} + ${fmtFracSq(`${v}'`, b2)} - ${fmtFracSq(`${w}'`, c2)} = 1`;
  } else if (surfaceType === 'hyperboloid_2') {
    const m = findCleanScale([a2, b2, c2]);
    quadCoeff[u] = -m / a2;
    quadCoeff[v] = -m / b2;
    quadCoeff[w] = m / c2;
    linCoeff.x = -2 * quadCoeff.x * x0;
    linCoeff.y = -2 * quadCoeff.y * y0;
    linCoeff.z = -2 * quadCoeff.z * z0;
    constTerm = quadCoeff.x * x0 * x0 + quadCoeff.y * y0 * y0 + quadCoeff.z * z0 * z0 - m;

    standard = `${fmtFracSq(w, c2, shiftMap[w])} - ${fmtFracSq(u, a2, shiftMap[u])} - ${fmtFracSq(v, b2, shiftMap[v])} = 1`;
    shifted = `${fmtFracSq(`${w}'`, c2)} - ${fmtFracSq(`${u}'`, a2)} - ${fmtFracSq(`${v}'`, b2)} = 1`;
  } else if (surfaceType === 'cone') {
    const m = findCleanScale([a2, b2, c2]);
    quadCoeff[u] = m / a2;
    quadCoeff[v] = m / b2;
    quadCoeff[w] = -m / c2;
    linCoeff.x = -2 * quadCoeff.x * x0;
    linCoeff.y = -2 * quadCoeff.y * y0;
    linCoeff.z = -2 * quadCoeff.z * z0;
    constTerm = quadCoeff.x * x0 * x0 + quadCoeff.y * y0 * y0 + quadCoeff.z * z0 * z0;

    standard = `${fmtFracSq(u, a2, shiftMap[u])} + ${fmtFracSq(v, b2, shiftMap[v])} = ${fmtFracSq(w, c2, shiftMap[w])}`;
    shifted = `${fmtFracSq(`${u}'`, a2)} + ${fmtFracSq(`${v}'`, b2)} = ${fmtFracSq(`${w}'`, c2)}`;
  } else if (surfaceType === 'elliptic_cylinder') {
    const m = findCleanScale([a2, b2]);
    quadCoeff[u] = m / a2;
    quadCoeff[v] = m / b2;
    linCoeff[u] = -2 * quadCoeff[u] * shiftMap[u];
    linCoeff[v] = -2 * quadCoeff[v] * shiftMap[v];
    constTerm =
      quadCoeff[u] * shiftMap[u] * shiftMap[u] +
      quadCoeff[v] * shiftMap[v] * shiftMap[v] -
      m;

    standard = `${fmtFracSq(u, a2, shiftMap[u])} + ${fmtFracSq(v, b2, shiftMap[v])} = 1`;
    shifted = `${fmtFracSq(`${u}'`, a2)} + ${fmtFracSq(`${v}'`, b2)} = 1`;
  } else {
    // elliptic_paraboloid: sgn * (w - w0) = (u - u0)^2 / a^2 + (v - v0)^2 / b^2
    const sgn = s.paraboloidSign;
    const m = findCleanScale([a2, b2]);
    quadCoeff[u] = m / a2;
    quadCoeff[v] = m / b2;
    linCoeff[u] = -2 * quadCoeff[u] * shiftMap[u];
    linCoeff[v] = -2 * quadCoeff[v] * shiftMap[v];
    linCoeff[w] = -sgn * m;
    constTerm =
      quadCoeff[u] * shiftMap[u] * shiftMap[u] +
      quadCoeff[v] * shiftMap[v] * shiftMap[v] +
      sgn * m * shiftMap[w];

    const wSide = fmtShiftedVar(w, shiftMap[w]);
    const lhsSign = sgn < 0 ? '-' : '';
    standard = `${lhsSign}${wSide} = ${fmtFracSq(u, a2, shiftMap[u])} + ${fmtFracSq(v, b2, shiftMap[v])}`;
    shifted = `${lhsSign}${w}' = ${fmtFracSq(`${u}'`, a2)} + ${fmtFracSq(`${v}'`, b2)}`;
  }

  const expandedLhs = buildLinearExpr([
    [quadCoeff.x, 'x^2'],
    [quadCoeff.y, 'y^2'],
    [quadCoeff.z, 'z^2'],
    [linCoeff.x, 'x'],
    [linCoeff.y, 'y'],
    [linCoeff.z, 'z'],
    [constTerm, ''],
  ]);

  const expanded = `${expandedLhs} = 0`;

  const sx = `x' = ${fmtShiftedVar('x', x0)}`;
  const sy = `y' = ${fmtShiftedVar('y', y0)}`;
  const sz = `,\\; z' = ${fmtShiftedVar('z', z0)}`;
  const axisShiftSummary =
    surfaceType === 'elliptic_cylinder'
      ? `${u}' = ${fmtShiftedVar(u, shiftMap[u])},\\; ${v}' = ${fmtShiftedVar(v, shiftMap[v])}`
      : `${sx},\\; ${sy}${sz}`;

  return { expanded, standard, shifted, axisShiftSummary };
}

export function getSlicePlaneLatex(plane: AxisName, k: number): string {
  return `${plane} = ${fmtNum(k)}`;
}
