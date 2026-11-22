import * as THREE from 'three';
import type {
  Ch3ExtremaState,
  Ch3GradientState,
  Ch3LevelCurvesState,
  Ch3LimitsState,
  Ch3ModuleTab,
  Ch3PartialsState,
  ViewerSettings,
} from '../types';
import { BOX_LIMIT, mathVecToThree, type Vec3 } from '../math/coords';
import { fmtNum } from '../math/latex';
import {
  EXTREMA_PRESETS,
  LIMIT_FUNCS,
  MULTIVAR_FUNCS,
  buildCartesianMultivarMesh,
  buildPolarMultivarMesh,
  classifySecondDeriv,
  evaluatePathLimit,
  extractContours2D,
} from '../math/multivar';
import {
  addLabeledSphere,
  addPolyline,
  addSolidVectorArrow,
  addThickCurve,
} from './sceneHelpers';

export interface Chapter3SceneInput {
  ch3Tab: Ch3ModuleTab;
  levelCurves: Ch3LevelCurvesState;
  limits: Ch3LimitsState;
  partials: Ch3PartialsState;
  gradient: Ch3GradientState;
  extrema: Ch3ExtremaState;
  settings: ViewerSettings;
}

function addSurfaceMesh(
  group: THREE.Group,
  geom: THREE.BufferGeometry | null,
  settings: ViewerSettings,
  forceTransparent = false,
) {
  if (!geom) return;
  const isTrans = forceTransparent || settings.transparent;
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.45,
    metalness: 0.08,
    side: THREE.DoubleSide,
    wireframe: settings.wireframe,
    transparent: isTrans,
    opacity: isTrans ? 0.64 : 0.94,
    depthWrite: !isTrans,
  });
  group.add(new THREE.Mesh(geom, mat));
}

function addBatchSegments(
  group: THREE.Group,
  segs: Array<[Vec3, Vec3]>,
  color: string | number,
  opacity = 0.85,
) {
  if (segs.length === 0) return;
  const pos = new Float32Array(segs.length * 6);
  let idx = 0;
  for (const [a, b] of segs) {
    const ta = mathVecToThree(a);
    const tb = mathVecToThree(b);
    pos[idx++] = ta.x;
    pos[idx++] = ta.y;
    pos[idx++] = ta.z;
    pos[idx++] = tb.x;
    pos[idx++] = tb.y;
    pos[idx++] = tb.z;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
  });
  group.add(new THREE.LineSegments(geom, mat));
}

function addHorizontalPlaneQuad(
  group: THREE.Group,
  zVal: number,
  halfSpan: number,
  color: number,
  opacity = 0.14,
) {
  const corners: Vec3[] = [
    [-halfSpan, -halfSpan, zVal],
    [halfSpan, -halfSpan, zVal],
    [halfSpan, halfSpan, zVal],
    [-halfSpan, halfSpan, zVal],
  ];
  const t = corners.map((c) => mathVecToThree(c));
  const geom = new THREE.BufferGeometry().setFromPoints([
    t[0],
    t[1],
    t[2],
    t[0],
    t[2],
    t[3],
  ]);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));
  addPolyline(group, [...corners, corners[0]], color, 0.75);
}

function addVerticalSliceQuad(
  group: THREE.Group,
  axis: 'x' | 'y',
  val: number,
  halfSpan: number,
  zMin: number,
  zMax: number,
  color: number,
) {
  const corners: Vec3[] =
    axis === 'y'
      ? [
          [-halfSpan, val, zMin],
          [halfSpan, val, zMin],
          [halfSpan, val, zMax],
          [-halfSpan, val, zMax],
        ]
      : [
          [val, -halfSpan, zMin],
          [val, halfSpan, zMin],
          [val, halfSpan, zMax],
          [val, -halfSpan, zMax],
        ];
  const t = corners.map((c) => mathVecToThree(c));
  const geom = new THREE.BufferGeometry().setFromPoints([
    t[0],
    t[1],
    t[2],
    t[0],
    t[2],
    t[3],
  ]);
  geom.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geom, mat));
  addPolyline(group, [...corners, corners[0]], color, 0.65);
}

export function renderChapter3Scene(
  group: THREE.Group,
  input: Chapter3SceneInput,
): { th: string; en: string } | null {
  const { ch3Tab, levelCurves, limits, partials, gradient, extrema, settings } = input;

  if (ch3Tab === 'level_curves') {
    const spec = MULTIVAR_FUNCS[levelCurves.funcId];
    const a = levelCurves.scaleA;
    const evalFn = (x: number, y: number) => spec.eval(x, y, a);

    let geom: THREE.BufferGeometry | null = null;
    if (levelCurves.funcId === 'dome') {
      const r = Math.min(3.6, Math.max(1.4, 2.4 * a));
      geom = buildPolarMultivarMesh(evalFn, 0, r, BOX_LIMIT);
    } else {
      geom = buildCartesianMultivarMesh(
        evalFn,
        (x, y) => spec.fx(x, y, a),
        (x, y) => spec.fy(x, y, a),
        spec.domainR,
        BOX_LIMIT,
      );
    }
    addSurfaceMesh(group, geom, settings, levelCurves.showSlicePlane);

    // Highlight active level z = sliceK
    const k = levelCurves.sliceK;
    if (levelCurves.showSlicePlane) {
      addHorizontalPlaneQuad(group, k, spec.domainR, 0xf59e0b, 0.15);
    }

    const activeSegs2D = extractContours2D(evalFn, spec.domainR, k, 56);
    if (activeSegs2D.length > 0) {
      const segs3D: Array<[Vec3, Vec3]> = activeSegs2D.map(([p, q]) => [
        [p[0], p[1], k],
        [q[0], q[1], k],
      ]);
      addBatchSegments(group, segs3D, '#fbbf24', 1);
      // Slight elevated duplicate for thickness legibility
      addBatchSegments(
        group,
        segs3D.map(([p, q]) => [
          [p[0], p[1], k + 0.02],
          [q[0], q[1], k + 0.02],
        ]),
        '#f59e0b',
        1,
      );
    }

    if (levelCurves.showContoursOnFloor) {
      const floorZ = -2.8;
      const levels = [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0, 2.8];
      for (const lv of levels) {
        const lvSegs = extractContours2D(evalFn, spec.domainR, lv, 44);
        const col = Math.abs(lv - k) < 0.2 ? '#f59e0b' : '#64748b';
        addBatchSegments(
          group,
          lvSegs.map(([p, q]) => [
            [p[0], p[1], floorZ],
            [q[0], q[1], floorZ],
          ]),
          col,
          Math.abs(lv - k) < 0.2 ? 0.95 : 0.45,
        );
      }
      if (activeSegs2D.length > 0) {
        addBatchSegments(
          group,
          activeSegs2D.map(([p, q]) => [
            [p[0], p[1], floorZ + 0.015],
            [q[0], q[1], floorZ + 0.015],
          ]),
          '#f59e0b',
          1,
        );
      }
    }

    if (activeSegs2D.length === 0) {
      return {
        th: `ไม่มีเส้นชั้นระดับที่ความสูง z = ${fmtNum(k)}`,
        en: `No level curve at z = ${fmtNum(k)}`,
      };
    }
    return null;
  }

  if (ch3Tab === 'limits') {
    const spec = LIMIT_FUNCS[limits.funcId];
    const rMax = 3.0;
    const geom = buildPolarMultivarMesh(spec.eval, 0.03, rMax, BOX_LIMIT);
    addSurfaceMesh(group, geom, settings, true);

    // Build path curve on xy-plane and lifted curve on surface
    const path2D: Vec3[] = [];
    const path3D: Vec3[] = [];
    const nPts = 70;
    const xEnd = 2.4;
    const kParam = limits.pathParam;
    const evalY = (x: number) =>
      limits.pathType === 'line' ? kParam * x : kParam * x * x;

    // Positive & negative sides through origin (gap around 0 to avoid artifact)
    for (const sign of [-1, 1]) {
      const seg2D: Vec3[] = [];
      const seg3D: Vec3[] = [];
      for (let i = 0; i <= nPts; i++) {
        const s = 0.03 + ((xEnd - 0.03) * i) / nPts;
        const x = sign * s;
        const y = evalY(x);
        if (Math.abs(x) > rMax || Math.abs(y) > rMax) continue;
        const z = spec.eval(x, y);
        seg2D.push([x, y, 0]);
        seg3D.push([x, y, z]);
      }
      if (seg2D.length > 1) addPolyline(group, seg2D, '#94a3b8', 0.85, true);
      if (seg3D.length > 1) addThickCurve(group, seg3D, '#f59e0b', 0.048);
    }

    void path2D;
    void path3D;

    // Current moving approach point
    const xCur = limits.approachT;
    const yCur = evalY(xCur);
    const { limitVal } = evaluatePathLimit(limits.funcId, limits.pathType, kParam);
    const isAtZero = Math.abs(xCur) < 0.025;
    const zCur = isAtZero ? limitVal : spec.eval(xCur, yCur);

    if (!isAtZero) {
      addLabeledSphere(group, [xCur, yCur, 0], '#64748b', undefined, darkMode(settings), 0.09);
      addPolyline(group, [[xCur, yCur, 0], [xCur, yCur, zCur]], '#f59e0b', 0.8, true);
      addLabeledSphere(
        group,
        [xCur, yCur, zCur],
        '#f43f5e',
        `z ≈ ${fmtNum(zCur)}`,
        darkMode(settings),
        0.15,
        0.38,
      );
    }

    // Limit target ring/sphere along z-axis at (0, 0, limitVal)
    addLabeledSphere(
      group,
      [0, 0, limitVal],
      '#10b981',
      `L = ${fmtNum(limitVal)}`,
      darkMode(settings),
      0.13,
      0.34,
    );

    return null;
  }

  if (ch3Tab === 'partials_tangent') {
    const spec = MULTIVAR_FUNCS[partials.funcId];
    const evalFn = (x: number, y: number) => spec.eval(x, y, 1);
    const fxFn = (x: number, y: number) => spec.fx(x, y, 1);
    const fyFn = (x: number, y: number) => spec.fy(x, y, 1);

    const geom = buildCartesianMultivarMesh(evalFn, fxFn, fyFn, spec.domainR, BOX_LIMIT);
    addSurfaceMesh(group, geom, settings, partials.showTangentPlane);

    const x0 = partials.x0;
    const y0 = partials.y0;
    const z0 = evalFn(x0, y0);
    const fx0 = fxFn(x0, y0);
    const fy0 = fyFn(x0, y0);

    addLabeledSphere(
      group,
      [x0, y0, z0],
      '#f59e0b',
      `P₀(${fmtNum(x0)}, ${fmtNum(y0)}, ${fmtNum(z0)})`,
      darkMode(settings),
      0.15,
      0.38,
    );

    // Slice y = y0 -> fx curve & tangent
    if (partials.showSliceX) {
      addVerticalSliceQuad(group, 'y', y0, spec.domainR, -3.5, 3.5, 0xef4444);
      const curveX: Vec3[] = [];
      for (let i = 0; i <= 50; i++) {
        const x = -spec.domainR + (2 * spec.domainR * i) / 50;
        const z = evalFn(x, y0);
        if (Math.abs(z) <= BOX_LIMIT) curveX.push([x, y0, z]);
      }
      if (curveX.length > 1) addThickCurve(group, curveX, '#ef4444', 0.045);

      const tanLen = 1.4 / Math.hypot(1, fx0);
      addSolidVectorArrow(
        group,
        [x0, y0, z0],
        [tanLen, 0, fx0 * tanLen],
        '#ef4444',
        `fx=${fmtNum(fx0)}`,
        darkMode(settings),
        { shaftRadius: 0.045, headRadius: 0.12 },
      );
    }

    // Slice x = x0 -> fy curve & tangent
    if (partials.showSliceY) {
      addVerticalSliceQuad(group, 'x', x0, spec.domainR, -3.5, 3.5, 0x10b981);
      const curveY: Vec3[] = [];
      for (let i = 0; i <= 50; i++) {
        const y = -spec.domainR + (2 * spec.domainR * i) / 50;
        const z = evalFn(x0, y);
        if (Math.abs(z) <= BOX_LIMIT) curveY.push([x0, y, z]);
      }
      if (curveY.length > 1) addThickCurve(group, curveY, '#10b981', 0.045);

      const tanLen = 1.4 / Math.hypot(1, fy0);
      addSolidVectorArrow(
        group,
        [x0, y0, z0],
        [0, tanLen, fy0 * tanLen],
        '#10b981',
        `fy=${fmtNum(fy0)}`,
        darkMode(settings),
        { shaftRadius: 0.045, headRadius: 0.12 },
      );
    }

    // Tangent Plane patch centered at (x0, y0, z0)
    if (partials.showTangentPlane) {
      const span = 1.35;
      const corners2D: Array<[number, number]> = [
        [-span, -span],
        [span, -span],
        [span, span],
        [-span, span],
      ];
      const corners3D: Vec3[] = corners2D.map(([du, dv]) => [
        x0 + du,
        y0 + dv,
        z0 + fx0 * du + fy0 * dv,
      ]);
      const t = corners3D.map((c) => mathVecToThree(c));
      const pGeom = new THREE.BufferGeometry().setFromPoints([
        t[0],
        t[1],
        t[2],
        t[0],
        t[2],
        t[3],
      ]);
      pGeom.computeVertexNormals();
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(pGeom, pMat));
      addPolyline(group, [...corners3D, corners3D[0]], '#f59e0b', 0.9);
    }

    return null;
  }

  if (ch3Tab === 'gradient_dir') {
    const spec = MULTIVAR_FUNCS[gradient.funcId];
    const evalFn = (x: number, y: number) => spec.eval(x, y, 1);
    const fxFn = (x: number, y: number) => spec.fx(x, y, 1);
    const fyFn = (x: number, y: number) => spec.fy(x, y, 1);

    const geom = buildCartesianMultivarMesh(evalFn, fxFn, fyFn, spec.domainR, BOX_LIMIT);
    addSurfaceMesh(group, geom, settings, true);

    const x0 = gradient.x0;
    const y0 = gradient.y0;
    const z0 = evalFn(x0, y0);
    const gx = fxFn(x0, y0);
    const gy = fyFn(x0, y0);
    const rad = (gradient.thetaDeg * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);
    const duf = gx * ux + gy * uy;

    // Base & surface points + vertical stem
    addLabeledSphere(group, [x0, y0, 0], '#64748b', undefined, darkMode(settings), 0.1);
    addLabeledSphere(group, [x0, y0, z0], '#f59e0b', `P₀`, darkMode(settings), 0.14, 0.35);
    addPolyline(group, [[x0, y0, 0], [x0, y0, z0]], '#94a3b8', 0.65, true);

    // Level curve passing through (x0, y0)
    if (gradient.showLevelCurve) {
      const segs = extractContours2D(evalFn, spec.domainR, z0, 52);
      addBatchSegments(
        group,
        segs.map(([p, q]) => [
          [p[0], p[1], 0],
          [q[0], q[1], 0],
        ]),
        '#38bdf8',
        0.75,
      );
      addBatchSegments(
        group,
        segs.map(([p, q]) => [
          [p[0], p[1], z0 + 0.015],
          [q[0], q[1], z0 + 0.015],
        ]),
        '#fbbf24',
        0.95,
      );
    }

    // Gradient vector on xy-plane
    if (gradient.showGradient) {
      const gNorm = Math.hypot(gx, gy);
      const scale = gNorm > 2.2 ? 2.2 / gNorm : 1;
      addSolidVectorArrow(
        group,
        [x0, y0, 0],
        [gx * scale, gy * scale, 0],
        '#f97316',
        `∇f(${fmtNum(gx)},${fmtNum(gy)})`,
        darkMode(settings),
        { shaftRadius: 0.055, headRadius: 0.13 },
      );
    }

    // Unit direction u on xy-plane + 3D directional tangent arrow on surface
    addSolidVectorArrow(
      group,
      [x0, y0, 0],
      [ux, uy, 0],
      '#8b5cf6',
      'u',
      darkMode(settings),
      { shaftRadius: 0.045, headRadius: 0.12 },
    );

    if (gradient.showDirectionalTangent) {
      const tLen = 1.4 / Math.hypot(1, duf);
      addSolidVectorArrow(
        group,
        [x0, y0, z0],
        [ux * tLen, uy * tLen, duf * tLen],
        '#8b5cf6',
        `D_u f=${fmtNum(duf)}`,
        darkMode(settings),
        { shaftRadius: 0.055, headRadius: 0.13 },
      );
    }

    return null;
  }

  // Tab 5: Extrema & Second Derivative Test
  if (extrema.subMode === 'quadratic_test') {
    const { quadA: A, quadB: B, quadC: C } = extrema;
    const evalFn = (x: number, y: number) => A * x * x + B * x * y + C * y * y;
    const fxFn = (x: number, y: number) => 2 * A * x + B * y;
    const fyFn = (x: number, y: number) => B * x + 2 * C * y;

    const geom = buildCartesianMultivarMesh(evalFn, fxFn, fyFn, 2.5, BOX_LIMIT);
    addSurfaceMesh(group, geom, settings, false);

    const cp = classifySecondDeriv(0, 0, 0, 2 * A, 2 * C, B);
    addLabeledSphere(
      group,
      [0, 0, 0],
      cp.color,
      cp.kind === 'saddle'
        ? 'Saddle (0,0,0)'
        : cp.kind === 'min'
          ? 'Local Min (0,0,0)'
          : cp.kind === 'max'
            ? 'Local Max (0,0,0)'
            : 'D = 0 (0,0,0)',
      darkMode(settings),
      0.16,
      0.42,
    );
    addHorizontalPlaneQuad(group, 0, 1.3, 0x94a3b8, 0.14);
    return null;
  }

  const preset = EXTREMA_PRESETS[extrema.presetFunc];
  const geom = buildCartesianMultivarMesh(
    preset.eval,
    preset.fx,
    preset.fy,
    preset.domainR,
    BOX_LIMIT,
  );
  addSurfaceMesh(group, geom, settings, true);

  for (const cp of preset.criticalPoints) {
    const tag =
      cp.kind === 'min' ? 'Min' : cp.kind === 'max' ? 'Max' : 'Saddle';
    addLabeledSphere(
      group,
      [cp.x, cp.y, cp.z],
      cp.color,
      `${tag}(${fmtNum(cp.x)},${fmtNum(cp.y)})`,
      darkMode(settings),
      0.15,
      0.38,
    );
    addPolyline(group, [[cp.x, cp.y, 0], [cp.x, cp.y, cp.z]], cp.color, 0.7, true);
  }

  return null;
}

function darkMode(settings: ViewerSettings): boolean {
  return settings.darkMode;
}
