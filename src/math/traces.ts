import type { AxisName, QuadricsState, TraceResult } from '../types';
import { BOX_LIMIT, axisVarNames, type Vec3 } from './coords';
import { fmtFracSq, fmtNum, fmtTerm } from './latex';

function clip2DSegmentsToBox(
  pts: Array<[number, number]>,
  limit: number,
): Array<Array<[number, number]>> {
  const out: Array<Array<[number, number]>> = [];
  let current: Array<[number, number]> = [];

  const inside = (p: [number, number]) =>
    Math.abs(p[0]) <= limit + 1e-4 && Math.abs(p[1]) <= limit + 1e-4;

  const clipSegment = (
    a: [number, number],
    b: [number, number],
  ): [[number, number], [number, number]] | null => {
    let t0 = 0;
    let t1 = 1;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const checks: Array<[number, number]> = [
      [-dx, a[0] + limit],
      [dx, limit - a[0]],
      [-dy, a[1] + limit],
      [dy, limit - a[1]],
    ];
    for (const [p, q] of checks) {
      if (Math.abs(p) < 1e-12) {
        if (q < 0) return null;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return null;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return null;
          if (r < t1) t1 = r;
        }
      }
    }
    return [
      [a[0] + t0 * dx, a[1] + t0 * dy],
      [a[0] + t1 * dx, a[1] + t1 * dy],
    ];
  };

  for (let i = 0; i < pts.length - 1; i++) {
    const seg = clipSegment(pts[i], pts[i + 1]);
    if (seg) {
      if (current.length === 0) {
        current.push(seg[0], seg[1]);
      } else {
        const last = current[current.length - 1];
        if (Math.hypot(last[0] - seg[0][0], last[1] - seg[0][1]) < 1e-3) {
          current.push(seg[1]);
        } else {
          out.push(current);
          current = [seg[0], seg[1]];
        }
      }
    } else if (current.length > 1) {
      out.push(current);
      current = [];
    } else {
      current = [];
    }
  }

  if (current.length > 1) {
    out.push(current);
  } else if (pts.length === 1 && inside(pts[0])) {
    out.push([pts[0]]);
  }

  return out;
}

function lift2DTo3D(
  pt: [number, number],
  plane: AxisName,
  k: number,
): Vec3 {
  if (plane === 'z') return [pt[0], pt[1], k];
  if (plane === 'y') return [pt[0], k, pt[1]];
  return [k, pt[0], pt[1]];
}

export function computeQuadricTrace(
  s: QuadricsState,
  limit = BOX_LIMIT,
): TraceResult {
  const { mode, symmetryAxis, a, b, c, morphD, slicePlane, sliceK: k } = s;

  const hAxisLabel = slicePlane === 'x' ? 'y' : 'x';
  const vAxisLabel = slicePlane === 'z' ? 'y' : 'z';

  // Coefficients of C_x x^2 + C_y y^2 + C_z z^2 + L_x x + L_y y + L_z z = R
  const C: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  const L: Record<AxisName, number> = { x: 0, y: 0, z: 0 };
  let R = 0;

  if (mode === 'ellipsoid') {
    C.x = 1 / (a * a);
    C.y = 1 / (b * b);
    C.z = 1 / (c * c);
    R = 1;
  } else {
    const { u, v, w } = axisVarNames(symmetryAxis) as {
      u: AxisName;
      v: AxisName;
      w: AxisName;
    };
    if (mode === 'cone') {
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      C[w] = -1 / (c * c);
      R = 0;
    } else if (mode === 'elliptic_paraboloid') {
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      L[w] = -s.paraboloidSign;
      R = 0;
    } else if (mode === 'hyperbolic_paraboloid') {
      C[u] = 1 / (a * a);
      C[v] = -1 / (b * b);
      L[w] = -s.paraboloidSign;
      R = 0;
    } else if (mode === 'hyperboloid_1') {
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      C[w] = -1 / (c * c);
      R = 1;
    } else if (mode === 'hyperboloid_2') {
      C[u] = -1 / (a * a);
      C[v] = -1 / (b * b);
      C[w] = 1 / (c * c);
      R = 1;
    } else {
      // morph
      C[u] = 1 / (a * a);
      C[v] = 1 / (b * b);
      C[w] = -1 / (c * c);
      R = morphD;
    }
  }

  const hName = hAxisLabel as AxisName;
  const vName = vAxisLabel as AxisName;

  let A = C[hName];
  let B = C[vName];
  const Lh = L[hName];
  const Lv = L[vName];
  let K = R - C[slicePlane] * k * k - L[slicePlane] * k;

  const curves2D: Array<Array<[number, number]>> = [];
  const points2D: Array<[number, number]> = [];
  let classification = { th: 'ไม่มีรอยตัด', en: 'No Intersection' };
  let equationLatex = '\\emptyset';

  if (Math.abs(Lh) < 1e-9 && Math.abs(Lv) < 1e-9) {
    // A*h^2 + B*v^2 = K
    if (A < 0 && B < 0) {
      A = -A;
      B = -B;
      K = -K;
    }

    if (A > 0 && B > 0) {
      if (K > 1e-4) {
        const rh2 = K / A;
        const rv2 = K / B;
        const rh = Math.sqrt(rh2);
        const rv = Math.sqrt(rv2);
        const isCircle = Math.abs(rh - rv) < 1e-4;
        classification = isCircle
          ? { th: 'วงกลม', en: 'Circle' }
          : { th: 'วงรี', en: 'Ellipse' };
        equationLatex = isCircle
          ? `${hName}^2 + ${vName}^2 = ${fmtNum(rh2)}`
          : `${fmtFracSq(hName, rh2)} + ${fmtFracSq(vName, rv2)} = 1`;

        const pts: Array<[number, number]> = [];
        const n = 96;
        for (let i = 0; i <= n; i++) {
          const t = (2 * Math.PI * i) / n;
          pts.push([rh * Math.cos(t), rv * Math.sin(t)]);
        }
        curves2D.push(...clip2DSegmentsToBox(pts, limit));
      } else if (Math.abs(K) <= 1e-4) {
        classification = { th: 'จุดเดี่ยว', en: 'Single Point' };
        equationLatex = `(${hName}, ${vName}) = (0, 0)`;
        points2D.push([0, 0]);
      } else {
        classification = { th: 'ไม่มีรอยตัด', en: 'No Intersection' };
        equationLatex = `${fmtFracSq(hName, 1 / A)} + ${fmtFracSq(vName, 1 / B)} = ${fmtNum(K)} < 0 \\;(\\emptyset)`;
      }
    } else {
      // Opposite signs: A*h^2 + B*v^2 = K
      if (Math.abs(K) <= 1e-4) {
        classification = { th: 'เส้นตรงตัดกัน 2 เส้น', en: 'Intersecting Lines' };
        const slope = Math.sqrt(Math.abs(A / B));
        equationLatex = `${vName} = \\pm ${fmtNum(slope)}${hName}`;
        const diag = limit * 1.4;
        curves2D.push(...clip2DSegmentsToBox([[-diag, -slope * diag], [diag, slope * diag]], limit));
        curves2D.push(...clip2DSegmentsToBox([[-diag, slope * diag], [diag, -slope * diag]], limit));
      } else {
        classification = { th: 'ไฮเพอร์โบลา', en: 'Hyperbola' };
        const rh2 = Math.abs(K / A);
        const rv2 = Math.abs(K / B);
        const rh = Math.sqrt(rh2);
        const rv = Math.sqrt(rv2);
        const opensAlongH = (A > 0 && K > 0) || (A < 0 && K < 0);

        equationLatex = opensAlongH
          ? `${fmtFracSq(hName, rh2)} - ${fmtFracSq(vName, rv2)} = 1`
          : `${fmtFracSq(vName, rv2)} - ${fmtFracSq(hName, rh2)} = 1`;

        const tMax = 3.2;
        const n = 72;
        for (const sign of [1, -1]) {
          const pts: Array<[number, number]> = [];
          for (let i = 0; i <= n; i++) {
            const t = -tMax + (2 * tMax * i) / n;
            if (opensAlongH) {
              pts.push([sign * rh * Math.cosh(t), rv * Math.sinh(t)]);
            } else {
              pts.push([rh * Math.sinh(t), sign * rv * Math.cosh(t)]);
            }
          }
          curves2D.push(...clip2DSegmentsToBox(pts, limit));
        }
      }
    }
  } else if (Math.abs(Lv) > 1e-9) {
    // A*h^2 + Lv*v = K  =>  v = (-A/Lv)*h^2 + K/Lv
    classification = { th: 'พาราโบลา', en: 'Parabola' };
    const quadCoeff = -A / Lv;
    const shift = K / Lv;
    const hTerm = fmtTerm(quadCoeff, `${hName}^2`, true);
    const cTerm = Math.abs(shift) < 1e-9 ? '' : fmtTerm(shift, '', false);
    equationLatex = `${vName} = ${hTerm}${cTerm}`;

    const pts: Array<[number, number]> = [];
    const n = 96;
    const span = limit + 0.5;
    for (let i = 0; i <= n; i++) {
      const h = -span + (2 * span * i) / n;
      pts.push([h, quadCoeff * h * h + shift]);
    }
    curves2D.push(...clip2DSegmentsToBox(pts, limit));
  } else {
    // B*v^2 + Lh*h = K  =>  h = (-B/Lh)*v^2 + K/Lh
    classification = { th: 'พาราโบลา', en: 'Parabola' };
    const quadCoeff = -B / Lh;
    const shift = K / Lh;
    const vTerm = fmtTerm(quadCoeff, `${vName}^2`, true);
    const cTerm = Math.abs(shift) < 1e-9 ? '' : fmtTerm(shift, '', false);
    equationLatex = `${hName} = ${vTerm}${cTerm}`;

    const pts: Array<[number, number]> = [];
    const n = 96;
    const span = limit + 0.5;
    for (let i = 0; i <= n; i++) {
      const v = -span + (2 * span * i) / n;
      pts.push([quadCoeff * v * v + shift, v]);
    }
    curves2D.push(...clip2DSegmentsToBox(pts, limit));
  }

  const curves3D = curves2D.map((poly) =>
    poly.map((pt) => lift2DTo3D(pt, slicePlane, k)),
  );
  const points3D = points2D.map((pt) => lift2DTo3D(pt, slicePlane, k));

  return {
    classification,
    equationLatex,
    hAxisLabel,
    vAxisLabel,
    curves2D,
    points2D,
    curves3D,
    points3D,
  };
}
