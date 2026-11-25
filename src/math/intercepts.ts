import type { AxisName, BilingualLabel, CylindersState, PlanesState, QuadricsState } from '../types';
import { axisVarNames } from './coords';
import { fmtNum } from './latex';

export interface AxisInterceptRow {
  axis: AxisName;
  intersects: boolean;
  text: BilingualLabel;
}

export function getPlaneInterceptRows(s: PlanesState): AxisInterceptRow[] {
  const mk = (axis: AxisName, coeff: number): AxisInterceptRow => {
    if (Math.abs(coeff) < 1e-6) {
      return {
        axis,
        intersects: false,
        text: { th: `ไม่ตัดแกน ${axis}`, en: `No ${axis}-intercept` },
      };
    }
    const v = fmtNum(s.d / coeff);
    const coord =
      axis === 'x' ? `(${v}, 0, 0)` : axis === 'y' ? `(0, ${v}, 0)` : `(0, 0, ${v})`;
    return {
      axis,
      intersects: true,
      text: { th: coord, en: coord },
    };
  };
  return [mk('x', s.a), mk('y', s.b), mk('z', s.c)];
}

function fmtSymmetricPair(axis: AxisName, radius: number): string {
  const v = fmtNum(radius);
  if (axis === 'x') return `(${v}, 0, 0), (-${v}, 0, 0)`;
  if (axis === 'y') return `(0, ${v}, 0), (0, -${v}, 0)`;
  return `(0, 0, ${v}), (0, 0, -${v})`;
}

export function getQuadricInterceptRows(s: QuadricsState): AxisInterceptRow[] {
  const { mode, symmetryAxis, a, b, c, morphD } = s;

  if (mode === 'ellipsoid') {
    return [
      {
        axis: 'x',
        intersects: true,
        text: { th: fmtSymmetricPair('x', a), en: fmtSymmetricPair('x', a) },
      },
      {
        axis: 'y',
        intersects: true,
        text: { th: fmtSymmetricPair('y', b), en: fmtSymmetricPair('y', b) },
      },
      {
        axis: 'z',
        intersects: true,
        text: { th: fmtSymmetricPair('z', c), en: fmtSymmetricPair('z', c) },
      },
    ];
  }

  let effectiveMode = mode;
  let scaleFactor = 1;
  if (mode === 'morph') {
    if (Math.abs(morphD) < 0.04) {
      effectiveMode = 'cone';
    } else if (morphD > 0) {
      effectiveMode = 'hyperboloid_1';
      scaleFactor = Math.sqrt(morphD);
    } else {
      effectiveMode = 'hyperboloid_2';
      scaleFactor = Math.sqrt(-morphD);
    }
  }

  if (
    effectiveMode === 'cone' ||
    effectiveMode === 'elliptic_paraboloid' ||
    effectiveMode === 'hyperbolic_paraboloid'
  ) {
    return (['x', 'y', 'z'] as AxisName[]).map((axis) => ({
      axis,
      intersects: true,
      text: { th: '(0, 0, 0)', en: '(0, 0, 0)' },
    }));
  }

  const { u, v, w } = axisVarNames(symmetryAxis);
  const mapAxes = (entries: Record<AxisName, AxisInterceptRow>): AxisInterceptRow[] => [
    entries.x,
    entries.y,
    entries.z,
  ];

  if (effectiveMode === 'hyperboloid_1') {
    return mapAxes({
      [u]: {
        axis: u,
        intersects: true,
        text: {
          th: fmtSymmetricPair(u, a * scaleFactor),
          en: fmtSymmetricPair(u, a * scaleFactor),
        },
      },
      [v]: {
        axis: v,
        intersects: true,
        text: {
          th: fmtSymmetricPair(v, b * scaleFactor),
          en: fmtSymmetricPair(v, b * scaleFactor),
        },
      },
      [w]: {
        axis: w,
        intersects: false,
        text: { th: `ไม่ตัดแกน ${w}`, en: `No ${w}-intercept` },
      },
    } as Record<AxisName, AxisInterceptRow>);
  }

  // hyperboloid_2
  return mapAxes({
    [u]: {
      axis: u,
      intersects: false,
      text: { th: `ไม่ตัดแกน ${u}`, en: `No ${u}-intercept` },
    },
    [v]: {
      axis: v,
      intersects: false,
      text: { th: `ไม่ตัดแกน ${v}`, en: `No ${v}-intercept` },
    },
    [w]: {
      axis: w,
      intersects: true,
      text: {
        th: fmtSymmetricPair(w, c * scaleFactor),
        en: fmtSymmetricPair(w, c * scaleFactor),
      },
    },
  } as Record<AxisName, AxisInterceptRow>);
}

export function getCylinderInterceptRows(s: CylindersState): AxisInterceptRow[] {
  const { u, v, w } = axisVarNames(s.missingAxis);

  const mapAxes = (entries: Record<AxisName, AxisInterceptRow>): AxisInterceptRow[] => [
    entries.x,
    entries.y,
    entries.z,
  ];

  const ptOnAxis = (axis: AxisName, val: number): string =>
    axis === 'x'
      ? `(${fmtNum(val)}, 0, 0)`
      : axis === 'y'
        ? `(0, ${fmtNum(val)}, 0)`
        : `(0, 0, ${fmtNum(val)})`;

  if (s.type === 'elliptic') {
    return mapAxes({
      [u]: {
        axis: u,
        intersects: true,
        text: { th: fmtSymmetricPair(u, s.a), en: fmtSymmetricPair(u, s.a) },
      },
      [v]: {
        axis: v,
        intersects: true,
        text: { th: fmtSymmetricPair(v, s.b), en: fmtSymmetricPair(v, s.b) },
      },
      [w]: {
        axis: w,
        intersects: false,
        text: { th: `ไม่ตัดแกน ${w}`, en: `No ${w}-intercept` },
      },
    } as Record<AxisName, AxisInterceptRow>);
  }

  if (s.type === 'hyperbolic') {
    const posAxis = s.hyperbolicSign === 1 ? u : v;
    const negAxis = s.hyperbolicSign === 1 ? v : u;
    const radius = s.hyperbolicSign === 1 ? s.a : s.b;
    return mapAxes({
      [posAxis]: {
        axis: posAxis,
        intersects: true,
        text: { th: fmtSymmetricPair(posAxis, radius), en: fmtSymmetricPair(posAxis, radius) },
      },
      [negAxis]: {
        axis: negAxis,
        intersects: false,
        text: { th: `ไม่ตัดแกน ${negAxis}`, en: `No ${negAxis}-intercept` },
      },
      [w]: {
        axis: w,
        intersects: false,
        text: { th: `ไม่ตัดแกน ${w}`, en: `No ${w}-intercept` },
      },
    } as Record<AxisName, AxisInterceptRow>);
  }

  if (s.type === 'sine') {
    const periodHalf = Math.abs(s.b) > 1e-6 ? Math.PI / Math.abs(s.b) : 0;
    const stepStr =
      Math.abs(s.b - 1) < 1e-6
        ? 'kπ'
        : `${fmtNum(periodHalf)}k`;
    return mapAxes({
      [u]: {
        axis: u,
        intersects: true,
        text: {
          th: `${ptOnAxis(u, 0)} และ ${u} = ±${stepStr}`,
          en: `${ptOnAxis(u, 0)}, ${u} = ±${stepStr}`,
        },
      },
      [v]: {
        axis: v,
        intersects: true,
        text: { th: '(0, 0, 0)', en: '(0, 0, 0)' },
      },
      [w]: {
        axis: w,
        intersects: true,
        text: { th: `ตลอดทั้งแกน ${w} (ผ่าน (0,0,0))`, en: `Entire ${w}-axis (origin)` },
      },
    } as Record<AxisName, AxisInterceptRow>);
  }

  // parabolic: v = a * u^2 + c
  if (Math.abs(s.c) < 1e-6) {
    return (['x', 'y', 'z'] as AxisName[]).map((axis) => ({
      axis,
      intersects: true,
      text:
        axis === w
          ? { th: `ตลอดทั้งแกน ${w} (ผ่าน (0,0,0))`, en: `Entire ${w}-axis (origin)` }
          : { th: '(0, 0, 0)', en: '(0, 0, 0)' },
    }));
  }

  const rootSq = -s.c / s.a;
  const uRow: AxisInterceptRow =
    rootSq > 1e-6
      ? {
          axis: u,
          intersects: true,
          text: {
            th: fmtSymmetricPair(u, Math.sqrt(rootSq)),
            en: fmtSymmetricPair(u, Math.sqrt(rootSq)),
          },
        }
      : {
          axis: u,
          intersects: false,
          text: { th: `ไม่ตัดแกน ${u}`, en: `No ${u}-intercept` },
        };

  return mapAxes({
    [u]: uRow,
    [v]: {
      axis: v,
      intersects: true,
      text: { th: ptOnAxis(v, s.c), en: ptOnAxis(v, s.c) },
    },
    [w]: {
      axis: w,
      intersects: false,
      text: { th: `ไม่ตัดแกน ${w}`, en: `No ${w}-intercept` },
    },
  } as Record<AxisName, AxisInterceptRow>);
}
