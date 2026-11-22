import * as THREE from 'three';
import type {
  AxisName,
  CylindersState,
  PlanesState,
  QuadricMode,
  QuadricsState,
  TranslationState,
} from '../types';
import {
  BOX_LIMIT,
  axisPermute,
  buildBufferGeometryFromTriangles,
  clipSegmentToBox,
  clipTriangleToBounds,
  type MathVertex,
  type Vec3,
} from './coords';

export interface PlaneBuildResult {
  geometry: THREE.BufferGeometry | null;
  boundaryPoints: Vec3[];
  normalAnchor: Vec3 | null;
  normalDir: Vec3 | null;
  intercepts: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  coordTraces: Array<{ label: string; color: string; segments: Array<[Vec3, Vec3]> }>;
  warning?: { th: string; en: string };
}

export interface SurfaceBuildResult {
  geometries: THREE.BufferGeometry[];
  gridLines: Vec3[][];
  generatingCurve?: Vec3[][];
  rulingLines?: Array<[Vec3, Vec3]>;
  warning?: { th: string; en: string };
}

function addOffset(v: MathVertex, offset: Vec3): MathVertex {
  return {
    p: [v.p[0] + offset[0], v.p[1] + offset[1], v.p[2] + offset[2]],
    n: v.n,
  };
}

function makeBoundsAround(center: Vec3, halfSize: number): [number, number, number, number, number, number] {
  return [
    center[0] - halfSize,
    center[0] + halfSize,
    center[1] - halfSize,
    center[1] + halfSize,
    center[2] - halfSize,
    center[2] + halfSize,
  ];
}

/**
 * Builds an exact polygon geometry for Ax + By + Cz = D intersected with [-limit, limit]^3.
 */
export function buildPlaneGeometry(s: PlanesState, limit = BOX_LIMIT): PlaneBuildResult {
  const { a, b, c, d } = s;
  const normLen = Math.hypot(a, b, c);

  if (normLen < 1e-8) {
    return {
      geometry: null,
      boundaryPoints: [],
      normalAnchor: null,
      normalDir: null,
      intercepts: { x: null, y: null, z: null },
      coordTraces: [],
      warning: {
        th: 'เมื่อ A = B = C = 0 สมการไม่ใช่ระนาบใน 3 มิติ',
        en: 'When A = B = C = 0, the equation does not define a plane in 3D',
      },
    };
  }

  const intercepts = {
    x: Math.abs(a) > 1e-6 ? d / a : null,
    y: Math.abs(b) > 1e-6 ? d / b : null,
    z: Math.abs(c) > 1e-6 ? d / c : null,
  };

  // Intersect Ax + By + Cz = D with the 12 edges of [-limit, limit]^3
  const pts: Vec3[] = [];
  const L = limit;
  const coeffs = [a, b, c];

  for (let freeAxis = 0; freeAxis < 3; freeAxis++) {
    const fixed1 = (freeAxis + 1) % 3;
    const fixed2 = (freeAxis + 2) % 3;
    if (Math.abs(coeffs[freeAxis]) < 1e-9) continue;

    for (const s1 of [-L, L]) {
      for (const s2 of [-L, L]) {
        const val = (d - coeffs[fixed1] * s1 - coeffs[fixed2] * s2) / coeffs[freeAxis];
        if (val >= -L - 1e-6 && val <= L + 1e-6) {
          const p: Vec3 = [0, 0, 0];
          p[freeAxis] = Math.max(-L, Math.min(L, val));
          p[fixed1] = s1;
          p[fixed2] = s2;
          if (!pts.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]) < 1e-4)) {
            pts.push(p);
          }
        }
      }
    }
  }

  if (pts.length < 3) {
    return {
      geometry: null,
      boundaryPoints: [],
      normalAnchor: null,
      normalDir: [a / normLen, b / normLen, c / normLen],
      intercepts,
      coordTraces: [],
      warning: {
        th: `ระนาบนี้อยู่นอกกรอบแสดงผล [-${L}, ${L}]³`,
        en: `This plane lies outside the [-${L}, ${L}]³ viewing box`,
      },
    };
  }

  // Compute centroid & sort CCW around unit normal
  const centroid: Vec3 = [
    pts.reduce((acc, p) => acc + p[0], 0) / pts.length,
    pts.reduce((acc, p) => acc + p[1], 0) / pts.length,
    pts.reduce((acc, p) => acc + p[2], 0) / pts.length,
  ];

  const nUnit: Vec3 = [a / normLen, b / normLen, c / normLen];
  // Construct orthonormal tangent basis (e1, e2) in the plane
  const ref: Vec3 = Math.abs(nUnit[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const e1Raw: Vec3 = [
    ref[1] * nUnit[2] - ref[2] * nUnit[1],
    ref[2] * nUnit[0] - ref[0] * nUnit[2],
    ref[0] * nUnit[1] - ref[1] * nUnit[0],
  ];
  const e1Len = Math.hypot(e1Raw[0], e1Raw[1], e1Raw[2]) || 1;
  const e1: Vec3 = [e1Raw[0] / e1Len, e1Raw[1] / e1Len, e1Raw[2] / e1Len];
  const e2: Vec3 = [
    nUnit[1] * e1[2] - nUnit[2] * e1[1],
    nUnit[2] * e1[0] - nUnit[0] * e1[2],
    nUnit[0] * e1[1] - nUnit[1] * e1[0],
  ];

  pts.sort((p, q) => {
    const dp: Vec3 = [p[0] - centroid[0], p[1] - centroid[1], p[2] - centroid[2]];
    const dq: Vec3 = [q[0] - centroid[0], q[1] - centroid[1], q[2] - centroid[2]];
    const angP = Math.atan2(
      dp[0] * e2[0] + dp[1] * e2[1] + dp[2] * e2[2],
      dp[0] * e1[0] + dp[1] * e1[1] + dp[2] * e1[2],
    );
    const angQ = Math.atan2(
      dq[0] * e2[0] + dq[1] * e2[1] + dq[2] * e2[2],
      dq[0] * e1[0] + dq[1] * e1[1] + dq[2] * e1[2],
    );
    return angP - angQ;
  });

  const tris: Array<[MathVertex, MathVertex, MathVertex]> = [];
  for (let i = 1; i < pts.length - 1; i++) {
    tris.push([
      { p: pts[0], n: nUnit },
      { p: pts[i], n: nUnit },
      { p: pts[i + 1], n: nUnit },
    ]);
  }

  // Coordinate-plane traces (z=0, y=0, x=0)
  const coordTraces: PlaneBuildResult['coordTraces'] = [];
  const traceSpecs: Array<{ axis: 0 | 1 | 2; label: string; color: string }> = [
    { axis: 2, label: 'xy-trace (z=0)', color: '#f59e0b' },
    { axis: 1, label: 'xz-trace (y=0)', color: '#ec4899' },
    { axis: 0, label: 'yz-trace (x=0)', color: '#10b981' },
  ];

  for (const spec of traceSpecs) {
    const i1 = (spec.axis + 1) % 3;
    const i2 = (spec.axis + 2) % 3;
    const c1 = coeffs[i1];
    const c2 = coeffs[i2];
    const len2d = Math.hypot(c1, c2);
    if (len2d < 1e-8) continue;

    // Line c1 * x1 + c2 * x2 = d in the plane coord[axis] = 0
    // Parametric point p0 + t * dir
    const scale = d / (c1 * c1 + c2 * c2);
    const p0: Vec3 = [0, 0, 0];
    p0[i1] = c1 * scale;
    p0[i2] = c2 * scale;
    const dir: Vec3 = [0, 0, 0];
    dir[i1] = -c2 / len2d;
    dir[i2] = c1 / len2d;

    const segA: Vec3 = [p0[0] - 20 * dir[0], p0[1] - 20 * dir[1], p0[2] - 20 * dir[2]];
    const segB: Vec3 = [p0[0] + 20 * dir[0], p0[1] + 20 * dir[1], p0[2] + 20 * dir[2]];
    const clipped = clipSegmentToBox(segA, segB, L);
    if (clipped) {
      coordTraces.push({ label: spec.label, color: spec.color, segments: [clipped] });
    }
  }

  return {
    geometry: buildBufferGeometryFromTriangles(tris, 'indigo', L),
    boundaryPoints: [...pts, pts[0]],
    normalAnchor: centroid,
    normalDir: nUnit,
    intercepts,
    coordTraces,
  };
}

/**
 * Helper to extrude one or more 2D generating curve branches along `missingAxis`.
 */
function extrudeCurveBranches(
  branches: Array<Array<{ u: number; v: number; nu: number; nv: number }>>,
  missingAxis: AxisName,
  halfLen: number,
  bounds: [number, number, number, number, number, number],
  offset: Vec3 = [0, 0, 0],
  colorScheme: 'teal' | 'indigo' | 'amber' = 'teal',
): SurfaceBuildResult {
  const geometries: THREE.BufferGeometry[] = [];
  const gridLines: Vec3[][] = [];
  const generatingCurve: Vec3[][] = [];
  const rulingLines: Array<[Vec3, Vec3]> = [];

  const nW = Math.max(2, Math.round(halfLen * 3));
  const showSurface = halfLen > 0.04;

  for (const branch of branches) {
    // Generating curve at w = 0
    const genPts: Vec3[] = [];
    for (const pt of branch) {
      const mp = axisPermute(pt.u, pt.v, 0, missingAxis);
      const shifted: Vec3 = [mp[0] + offset[0], mp[1] + offset[1], mp[2] + offset[2]];
      if (
        shifted[0] >= bounds[0] - 0.01 &&
        shifted[0] <= bounds[1] + 0.01 &&
        shifted[1] >= bounds[2] - 0.01 &&
        shifted[1] <= bounds[3] + 0.01 &&
        shifted[2] >= bounds[4] - 0.01 &&
        shifted[2] <= bounds[5] + 0.01
      ) {
        genPts.push(shifted);
      } else if (genPts.length > 0) {
        generatingCurve.push([...genPts]);
        genPts.length = 0;
      }
    }
    if (genPts.length > 1) generatingCurve.push(genPts);

    // Ruling lines at evenly spaced samples along the branch
    if (showSurface) {
      const rulingStep = Math.max(1, Math.floor(branch.length / 8));
      for (let i = 0; i < branch.length; i += rulingStep) {
        const pt = branch[i];
        const pStart = axisPermute(pt.u, pt.v, -halfLen, missingAxis);
        const pEnd = axisPermute(pt.u, pt.v, halfLen, missingAxis);
        const s0: Vec3 = [pStart[0] + offset[0], pStart[1] + offset[1], pStart[2] + offset[2]];
        const s1: Vec3 = [pEnd[0] + offset[0], pEnd[1] + offset[1], pEnd[2] + offset[2]];
        const clipped = clipSegmentToBox(s0, s1, Math.max(Math.abs(bounds[0]), Math.abs(bounds[1]), 6));
        if (clipped) rulingLines.push(clipped);
      }
    }

    if (!showSurface) continue;

    // Build grid vertices (i along branch, j along w)
    const rows: MathVertex[][] = [];
    for (let j = 0; j <= nW; j++) {
      const w = -halfLen + (2 * halfLen * j) / nW;
      const row: MathVertex[] = [];
      for (let i = 0; i < branch.length; i++) {
        const pt = branch[i];
        const p = axisPermute(pt.u, pt.v, w, missingAxis);
        const n = axisPermute(pt.nu, pt.nv, 0, missingAxis);
        row.push(addOffset({ p, n }, offset));
      }
      rows.push(row);
    }

    const tris: Array<[MathVertex, MathVertex, MathVertex]> = [];
    for (let j = 0; j < nW; j++) {
      for (let i = 0; i < branch.length - 1; i++) {
        const v00 = rows[j][i];
        const v10 = rows[j][i + 1];
        const v01 = rows[j + 1][i];
        const v11 = rows[j + 1][i + 1];
        tris.push(...clipTriangleToBounds(v00, v10, v11, bounds));
        tris.push(...clipTriangleToBounds(v00, v11, v01, bounds));
      }
    }

    if (tris.length > 0) {
      geometries.push(buildBufferGeometryFromTriangles(tris, colorScheme, BOX_LIMIT));
    }

    // Subtle wireframe rings at ends & middle
    for (const jIdx of [0, Math.floor(nW / 2), nW]) {
      const ring: Vec3[] = [];
      for (const mv of rows[jIdx]) {
        if (
          mv.p[0] >= bounds[0] &&
          mv.p[0] <= bounds[1] &&
          mv.p[1] >= bounds[2] &&
          mv.p[1] <= bounds[3] &&
          mv.p[2] >= bounds[4] &&
          mv.p[2] <= bounds[5]
        ) {
          ring.push(mv.p);
        }
      }
      if (ring.length > 1) gridLines.push(ring);
    }
  }

  return { geometries, gridLines, generatingCurve, rulingLines };
}

export function buildCylinderGeometry(
  s: CylindersState,
  limit = BOX_LIMIT,
  offset: Vec3 = [0, 0, 0],
  colorScheme: 'teal' | 'indigo' | 'amber' = 'teal',
): SurfaceBuildResult {
  const { type, missingAxis, a, b, c, extrusionLength } = s;
  const halfLen = Math.max(0, extrusionLength / 2);
  const bounds = makeBoundsAround(offset, limit);

  const branches: Array<Array<{ u: number; v: number; nu: number; nv: number }>> = [];

  if (type === 'elliptic') {
    const pts: Array<{ u: number; v: number; nu: number; nv: number }> = [];
    const nSeg = 72;
    for (let i = 0; i <= nSeg; i++) {
      const t = (2 * Math.PI * i) / nSeg;
      const u = a * Math.cos(t);
      const v = b * Math.sin(t);
      const nx = Math.cos(t) / a;
      const ny = Math.sin(t) / b;
      const len = Math.hypot(nx, ny) || 1;
      pts.push({ u, v, nu: nx / len, nv: ny / len });
    }
    branches.push(pts);
  } else if (type === 'parabolic') {
    const pts: Array<{ u: number; v: number; nu: number; nv: number }> = [];
    const nSeg = 72;
    const uMax = limit + 0.3;
    for (let i = 0; i <= nSeg; i++) {
      const u = -uMax + (2 * uMax * i) / nSeg;
      const v = a * u * u + c;
      // Curve F(u,v) = a*u^2 + c - v = 0 -> normal (2*a*u, -1)
      const nx = 2 * a * u;
      const ny = -1;
      const len = Math.hypot(nx, ny) || 1;
      pts.push({ u, v, nu: nx / len, nv: ny / len });
    }
    branches.push(pts);
  } else if (type === 'hyperbolic') {
    const nSeg = 60;
    const tMax = Math.min(3.2, Math.acosh(Math.max(2, (limit + 1.2) / Math.min(a, b))));
    for (const sign of [1, -1]) {
      const pts: Array<{ u: number; v: number; nu: number; nv: number }> = [];
      for (let i = 0; i <= nSeg; i++) {
        const t = -tMax + (2 * tMax * i) / nSeg;
        const u = s.hyperbolicSign === 1 ? sign * a * Math.cosh(t) : a * Math.sinh(t);
        const v = s.hyperbolicSign === 1 ? b * Math.sinh(t) : sign * b * Math.cosh(t);
        const nx = s.hyperbolicSign === 1 ? u / (a * a) : -u / (a * a);
        const ny = s.hyperbolicSign === 1 ? -v / (b * b) : v / (b * b);
        const len = Math.hypot(nx, ny) || 1;
        pts.push({ u, v, nu: nx / len, nv: ny / len });
      }
      branches.push(pts);
    }
  } else {
    // sine: v = a * sin(b * u)
    const pts: Array<{ u: number; v: number; nu: number; nv: number }> = [];
    const nSeg = 120;
    const uMax = limit;
    for (let i = 0; i <= nSeg; i++) {
      const u = -uMax + (2 * uMax * i) / nSeg;
      const v = a * Math.sin(b * u);
      const dvdu = a * b * Math.cos(b * u);
      const nx = -dvdu;
      const ny = 1;
      const len = Math.hypot(nx, ny) || 1;
      pts.push({ u, v, nu: nx / len, nv: ny / len });
    }
    branches.push(pts);
  }

  return extrudeCurveBranches(branches, missingAxis, halfLen, bounds, offset, colorScheme);
}

/**
 * Generates mesh triangles from a smooth 2D parametric grid (nI x nJ) with optional box clipping.
 */
function buildMeshFromParametricGrid(
  grid: MathVertex[][],
  bounds: [number, number, number, number, number, number] | null,
  colorScheme: 'teal' | 'indigo' | 'amber',
  colorLimit: number,
): { geometry: THREE.BufferGeometry | null; gridLines: Vec3[][] } {
  const nI = grid.length - 1;
  const nJ = grid[0].length - 1;
  const tris: Array<[MathVertex, MathVertex, MathVertex]> = [];

  for (let i = 0; i < nI; i++) {
    for (let j = 0; j < nJ; j++) {
      const v00 = grid[i][j];
      const v10 = grid[i + 1][j];
      const v01 = grid[i][j + 1];
      const v11 = grid[i + 1][j + 1];
      if (bounds) {
        tris.push(...clipTriangleToBounds(v00, v10, v11, bounds));
        tris.push(...clipTriangleToBounds(v00, v11, v01, bounds));
      } else {
        tris.push([v00, v10, v11]);
        tris.push([v00, v11, v01]);
      }
    }
  }

  if (tris.length === 0) {
    return { geometry: null, gridLines: [] };
  }

  // Extract sparse u/v contour lines for clear curvature depth perception
  const gridLines: Vec3[][] = [];
  const stepI = Math.max(1, Math.floor(nI / 8));
  const stepJ = Math.max(1, Math.floor(nJ / 8));

  const insideBounds = (p: Vec3) => {
    if (!bounds) return true;
    return (
      p[0] >= bounds[0] - 1e-3 &&
      p[0] <= bounds[1] + 1e-3 &&
      p[1] >= bounds[2] - 1e-3 &&
      p[1] <= bounds[3] + 1e-3 &&
      p[2] >= bounds[4] - 1e-3 &&
      p[2] <= bounds[5] + 1e-3
    );
  };

  for (let i = 0; i <= nI; i += stepI) {
    let line: Vec3[] = [];
    for (let j = 0; j <= nJ; j++) {
      const p = grid[i][j].p;
      if (insideBounds(p)) {
        line.push(p);
      } else if (line.length > 1) {
        gridLines.push(line);
        line = [];
      } else {
        line = [];
      }
    }
    if (line.length > 1) gridLines.push(line);
  }

  for (let j = 0; j <= nJ; j += stepJ) {
    let line: Vec3[] = [];
    for (let i = 0; i <= nI; i++) {
      const p = grid[i][j].p;
      if (insideBounds(p)) {
        line.push(p);
      } else if (line.length > 1) {
        gridLines.push(line);
        line = [];
      } else {
        line = [];
      }
    }
    if (line.length > 1) gridLines.push(line);
  }

  return {
    geometry: buildBufferGeometryFromTriangles(tris, colorScheme, colorLimit),
    gridLines,
  };
}

export interface QuadricBuildOptions {
  limit?: number;
  offset?: Vec3;
  colorScheme?: 'teal' | 'indigo' | 'amber';
  clipBounds?: boolean;
}

export function buildQuadricGeometry(
  s: Pick<QuadricsState, 'mode' | 'symmetryAxis' | 'a' | 'b' | 'c' | 'morphD'> & {
    paraboloidSign?: 1 | -1;
  },
  opts: QuadricBuildOptions = {},
): SurfaceBuildResult {
  const limit = opts.limit ?? BOX_LIMIT;
  const offset: Vec3 = opts.offset ?? [0, 0, 0];
  const colorScheme = opts.colorScheme ?? 'teal';
  const clipBounds = opts.clipBounds ?? true;
  const bounds = clipBounds ? makeBoundsAround(offset, limit) : null;

  const { mode, symmetryAxis, a, b, c, morphD } = s;
  const pSign = s.paraboloidSign ?? 1;

  // Determine effective mode when in morph
  let effectiveMode: Exclude<QuadricMode, 'morph'> = mode === 'morph' ? 'hyperboloid_1' : mode;
  let dScale = 1;
  if (mode === 'morph') {
    if (Math.abs(morphD) < 0.04) {
      effectiveMode = 'cone';
    } else if (morphD > 0) {
      effectiveMode = 'hyperboloid_1';
      dScale = Math.sqrt(morphD);
    } else {
      effectiveMode = 'hyperboloid_2';
      dScale = Math.sqrt(-morphD);
    }
  }

  const geometries: THREE.BufferGeometry[] = [];
  const allGridLines: Vec3[][] = [];

  if (effectiveMode === 'ellipsoid') {
    const nPhi = 36;
    const nTheta = 64;
    const grid: MathVertex[][] = [];
    for (let i = 0; i <= nPhi; i++) {
      const phi = (Math.PI * i) / nPhi;
      const sinP = Math.sin(phi);
      const cosP = Math.cos(phi);
      const row: MathVertex[] = [];
      for (let j = 0; j <= nTheta; j++) {
        const theta = (2 * Math.PI * j) / nTheta;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const x = a * sinP * cosT;
        const y = b * sinP * sinT;
        const z = c * cosP;
        const nx = (sinP * cosT) / a;
        const ny = (sinP * sinT) / b;
        const nz = cosP / c;
        const nLen = Math.hypot(nx, ny, nz) || 1;
        row.push(addOffset({ p: [x, y, z], n: [nx / nLen, ny / nLen, nz / nLen] }, offset));
      }
      grid.push(row);
    }
    const res = buildMeshFromParametricGrid(grid, bounds, colorScheme, limit);
    if (res.geometry) geometries.push(res.geometry);
    allGridLines.push(...res.gridLines);
  } else if (effectiveMode === 'cone') {
    const nR = 28;
    const nTheta = 64;
    const rMax = (limit + 0.5) / Math.min(a, b, c) * 1.45;
    for (const sign of [1, -1]) {
      const grid: MathVertex[][] = [];
      for (let i = 0; i <= nR; i++) {
        const r = (rMax * i) / nR;
        const row: MathVertex[] = [];
        for (let j = 0; j <= nTheta; j++) {
          const theta = (2 * Math.PI * j) / nTheta;
          const cosT = Math.cos(theta);
          const sinT = Math.sin(theta);
          const u = a * r * cosT;
          const v = b * r * sinT;
          const w = sign * c * r;
          const nu = cosT / a;
          const nv = sinT / b;
          const nw = -sign / c;
          const nLen = Math.hypot(nu, nv, nw) || 1;
          const p = axisPermute(u, v, w, symmetryAxis);
          const n = axisPermute(nu / nLen, nv / nLen, nw / nLen, symmetryAxis);
          row.push(addOffset({ p, n }, offset));
        }
        grid.push(row);
      }
      const res = buildMeshFromParametricGrid(grid, bounds, colorScheme, limit);
      if (res.geometry) geometries.push(res.geometry);
      allGridLines.push(...res.gridLines);
    }
  } else if (effectiveMode === 'elliptic_paraboloid') {
    const nR = 36;
    const nTheta = 64;
    const wMax = limit + 0.6;
    const rMax = Math.sqrt(wMax);
    const grid: MathVertex[][] = [];
    for (let i = 0; i <= nR; i++) {
      const r = (rMax * i) / nR;
      const row: MathVertex[] = [];
      for (let j = 0; j <= nTheta; j++) {
        const theta = (2 * Math.PI * j) / nTheta;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const u = a * r * cosT;
        const v = b * r * sinT;
        const w = pSign * r * r;
        const nu = (2 * u) / (a * a);
        const nv = (2 * v) / (b * b);
        const nw = -pSign;
        const nLen = Math.hypot(nu, nv, nw) || 1;
        const p = axisPermute(u, v, w, symmetryAxis);
        const n = axisPermute(nu / nLen, nv / nLen, nw / nLen, symmetryAxis);
        row.push(addOffset({ p, n }, offset));
      }
      grid.push(row);
    }
    const res = buildMeshFromParametricGrid(grid, bounds, colorScheme, limit);
    if (res.geometry) geometries.push(res.geometry);
    allGridLines.push(...res.gridLines);
  } else if (effectiveMode === 'hyperbolic_paraboloid') {
    const nU = 48;
    const nV = 48;
    const uMax = limit + 0.15;
    const vMax = limit + 0.15;
    const grid: MathVertex[][] = [];
    for (let i = 0; i <= nU; i++) {
      const u = -uMax + (2 * uMax * i) / nU;
      const row: MathVertex[] = [];
      for (let j = 0; j <= nV; j++) {
        const v = -vMax + (2 * vMax * j) / nV;
        const w = pSign * ((u * u) / (a * a) - (v * v) / (b * b));
        const nu = (2 * u) / (a * a);
        const nv = (-2 * v) / (b * b);
        const nw = -pSign;
        const nLen = Math.hypot(nu, nv, nw) || 1;
        const p = axisPermute(u, v, w, symmetryAxis);
        const n = axisPermute(nu / nLen, nv / nLen, nw / nLen, symmetryAxis);
        row.push(addOffset({ p, n }, offset));
      }
      grid.push(row);
    }
    const res = buildMeshFromParametricGrid(grid, bounds, colorScheme, limit);
    if (res.geometry) geometries.push(res.geometry);
    allGridLines.push(...res.gridLines);
  } else if (effectiveMode === 'hyperboloid_1') {
    const nT = 36;
    const nTheta = 64;
    const tMax = Math.min(3.2, Math.asinh((limit + 0.8) / (c * dScale)) + 0.2);
    const grid: MathVertex[][] = [];
    for (let i = 0; i <= nT; i++) {
      const t = -tMax + (2 * tMax * i) / nT;
      const ch = Math.cosh(t);
      const sh = Math.sinh(t);
      const row: MathVertex[] = [];
      for (let j = 0; j <= nTheta; j++) {
        const theta = (2 * Math.PI * j) / nTheta;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);
        const u = a * dScale * ch * cosT;
        const v = b * dScale * ch * sinT;
        const w = c * dScale * sh;
        const nu = u / (a * a);
        const nv = v / (b * b);
        const nw = -w / (c * c);
        const nLen = Math.hypot(nu, nv, nw) || 1;
        const p = axisPermute(u, v, w, symmetryAxis);
        const n = axisPermute(nu / nLen, nv / nLen, nw / nLen, symmetryAxis);
        row.push(addOffset({ p, n }, offset));
      }
      grid.push(row);
    }
    const res = buildMeshFromParametricGrid(grid, bounds, colorScheme, limit);
    if (res.geometry) geometries.push(res.geometry);
    allGridLines.push(...res.gridLines);
  } else {
    // hyperboloid_2: two sheets
    const vertexW = c * dScale;
    const nT = 32;
    const nTheta = 64;
    const ratio = Math.max(1.05, (limit + 0.8) / vertexW);
    const tMax = Math.min(3.0, Math.acosh(ratio) + 0.25);

    for (const sign of [1, -1]) {
      const grid: MathVertex[][] = [];
      for (let i = 0; i <= nT; i++) {
        const t = (tMax * i) / nT;
        const ch = Math.cosh(t);
        const sh = Math.sinh(t);
        const row: MathVertex[] = [];
        for (let j = 0; j <= nTheta; j++) {
          const theta = (2 * Math.PI * j) / nTheta;
          const cosT = Math.cos(theta);
          const sinT = Math.sin(theta);
          const u = a * dScale * sh * cosT;
          const v = b * dScale * sh * sinT;
          const w = sign * c * dScale * ch;
          const nu = -u / (a * a);
          const nv = -v / (b * b);
          const nw = w / (c * c);
          const nLen = Math.hypot(nu, nv, nw) || 1;
          const p = axisPermute(u, v, w, symmetryAxis);
          const n = axisPermute(nu / nLen, nv / nLen, nw / nLen, symmetryAxis);
          row.push(addOffset({ p, n }, offset));
        }
        grid.push(row);
      }
      const res = buildMeshFromParametricGrid(grid, bounds, colorScheme, limit);
      if (res.geometry) geometries.push(res.geometry);
      allGridLines.push(...res.gridLines);
    }
  }

  if (geometries.length === 0) {
    return {
      geometries: [],
      gridLines: [],
      warning: {
        th: `พื้นผิวอยู่นอกกรอบแสดงผล [-${limit}, ${limit}]³ (ลองลดค่า c หรือลด |d|)`,
        en: `Surface lies outside the [-${limit}, ${limit}]³ viewing box (try smaller c or |d|)`,
      },
    };
  }

  return { geometries, gridLines: allGridLines };
}

/**
 * Builds both the translated surface at (x0, y0, z0) and the ghost reference at (0, 0, 0).
 */
export function buildTranslationGeometry(s: TranslationState): {
  shifted: SurfaceBuildResult;
  ghost: SurfaceBuildResult | null;
} {
  const localLimit = 3.2;
  const offset: Vec3 = [s.x0, s.y0, s.z0];

  const buildForOffset = (
    off: Vec3,
    scheme: 'teal' | 'indigo' | 'amber',
  ): SurfaceBuildResult => {
    if (s.surfaceType === 'elliptic_cylinder') {
      return buildCylinderGeometry(
        {
          type: 'elliptic',
          missingAxis: 'z',
          hyperbolicSign: 1,
          a: s.a,
          b: s.b,
          c: s.c,
          extrusionLength: localLimit * 2,
          isAnimatingExtrusion: false,
          showGeneratingCurve: false,
          showRulings: false,
        },
        localLimit,
        off,
        scheme,
      );
    }
    return buildQuadricGeometry(
      {
        mode: s.surfaceType,
        symmetryAxis: 'z',
        paraboloidSign: s.paraboloidSign,
        a: s.a,
        b: s.b,
        c: s.c,
        morphD: 1,
      },
      {
        limit: localLimit,
        offset: off,
        colorScheme: scheme,
        clipBounds: s.surfaceType !== 'ellipsoid',
      },
    );
  };

  const shifted = buildForOffset(offset, 'teal');
  const ghost = s.showGhost ? buildForOffset([0, 0, 0], 'indigo') : null;
  return { shifted, ghost };
}
