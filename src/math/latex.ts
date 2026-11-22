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
  // Each denom is a^2 where a is typically a multiple of 0.5, so 4 * denom is an integer.
  const scaledInts = denoms.map((d) => Math.round(d * 4));
  const isExactQuarter = denoms.every((d, i) => Math.abs(d * 4 - scaledInts[i]) < 1e-6);
  if (!isExactQuarter) return 1;

  // For fractions 4 / scaledInts[i], reduce each fraction first
  const reducedDenoms = scaledInts.map((n) => n / gcd(4, n));
  let m = 1;
  for (const rd of reducedDenoms) {
    m = lcm(m, rd);
    if (m > 400) return 1;
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
  const { x0, y0, z0, a, b, c, surfaceType } = s;
  const a2 = a * a;
  const b2 = b * b;
  const c2 = c * c;

  let standard = '';
  let shifted = '';
  let denoms: number[] = [];
  let cx = 0;
  let cy = 0;
  let cz = 0;
  let lx = 0;
  let ly = 0;
  let lz = 0;
  let rhs = 0;

  if (surfaceType === 'ellipsoid') {
    denoms = [a2, b2, c2];
    const m = findCleanScale(denoms);
    cx = m / a2;
    cy = m / b2;
    cz = m / c2;
    lx = -2 * cx * x0;
    ly = -2 * cy * y0;
    lz = -2 * cz * z0;
    rhs = m - cx * x0 * x0 - cy * y0 * y0 - cz * z0 * z0;

    standard = `${fmtFracSq('x', a2, x0)} + ${fmtFracSq('y', b2, y0)} + ${fmtFracSq('z', c2, z0)} = 1`;
    shifted = `${fmtFracSq("x'", a2)} + ${fmtFracSq("y'", b2)} + ${fmtFracSq("z'", c2)} = 1`;
  } else if (surfaceType === 'hyperboloid_1') {
    denoms = [a2, b2, c2];
    const m = findCleanScale(denoms);
    cx = m / a2;
    cy = m / b2;
    cz = -m / c2;
    lx = -2 * cx * x0;
    ly = -2 * cy * y0;
    lz = -2 * cz * z0;
    rhs = m - cx * x0 * x0 - cy * y0 * y0 - cz * z0 * z0;

    standard = `${fmtFracSq('x', a2, x0)} + ${fmtFracSq('y', b2, y0)} - ${fmtFracSq('z', c2, z0)} = 1`;
    shifted = `${fmtFracSq("x'", a2)} + ${fmtFracSq("y'", b2)} - ${fmtFracSq("z'", c2)} = 1`;
  } else if (surfaceType === 'cone') {
    denoms = [a2, b2, c2];
    const m = findCleanScale(denoms);
    cx = m / a2;
    cy = m / b2;
    cz = -m / c2;
    lx = -2 * cx * x0;
    ly = -2 * cy * y0;
    lz = -2 * cz * z0;
    rhs = -(cx * x0 * x0 + cy * y0 * y0 + cz * z0 * z0);

    standard = `${fmtFracSq('x', a2, x0)} + ${fmtFracSq('y', b2, y0)} - ${fmtFracSq('z', c2, z0)} = 0`;
    shifted = `${fmtFracSq("x'", a2)} + ${fmtFracSq("y'", b2)} - ${fmtFracSq("z'", c2)} = 0`;
  } else if (surfaceType === 'elliptic_cylinder') {
    denoms = [a2, b2];
    const m = findCleanScale(denoms);
    cx = m / a2;
    cy = m / b2;
    cz = 0;
    lx = -2 * cx * x0;
    ly = -2 * cy * y0;
    lz = 0;
    rhs = m - cx * x0 * x0 - cy * y0 * y0;

    standard = `${fmtFracSq('x', a2, x0)} + ${fmtFracSq('y', b2, y0)} = 1`;
    shifted = `${fmtFracSq("x'", a2)} + ${fmtFracSq("y'", b2)} = 1`;
  } else {
    // elliptic_paraboloid: sgn * (z - z0) = (x - x0)^2 / a^2 + (y - y0)^2 / b^2
    const sgn = s.paraboloidSign;
    denoms = [a2, b2];
    const m = findCleanScale(denoms);
    cx = m / a2;
    cy = m / b2;
    cz = 0;
    lx = -2 * cx * x0;
    ly = -2 * cy * y0;
    lz = -sgn * m;
    rhs = -sgn * m * z0 - cx * x0 * x0 - cy * y0 * y0;

    const zSide = fmtShiftedVar('z', z0);
    const lhsSign = sgn < 0 ? '-' : '';
    standard = `${lhsSign}${zSide} = ${fmtFracSq('x', a2, x0)} + ${fmtFracSq('y', b2, y0)}`;
    shifted = `${lhsSign}z' = ${fmtFracSq("x'", a2)} + ${fmtFracSq("y'", b2)}`;
  }

  const expandedLhs = buildLinearExpr([
    [cx, 'x^2'],
    [cy, 'y^2'],
    [cz, 'z^2'],
    [lx, 'x'],
    [ly, 'y'],
    [lz, 'z'],
  ]);

  const expanded = `${expandedLhs} = ${fmtNum(rhs)}`;

  const sx = `x' = ${fmtShiftedVar('x', x0)}`;
  const sy = `y' = ${fmtShiftedVar('y', y0)}`;
  const sz = surfaceType === 'elliptic_cylinder' ? '' : `,\\; z' = ${fmtShiftedVar('z', z0)}`;
  const axisShiftSummary = `${sx},\\; ${sy}${sz}`;

  return { expanded, standard, shifted, axisShiftSummary };
}

export function getSlicePlaneLatex(plane: AxisName, k: number): string {
  return `${plane} = ${fmtNum(k)}`;
}
