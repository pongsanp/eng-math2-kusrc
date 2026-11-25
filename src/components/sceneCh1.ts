import * as THREE from 'three';
import type {
  ArithmeticState,
  Ch1ModuleTab,
  CoordsVecState,
  CrossTripleState,
  DotProjState,
  Lines3DState,
  Vec3Tuple,
} from '../types';
import { BOX_LIMIT, clipSegmentToBox, mathVecToThree, type Vec3 } from '../math/coords';
import { fmtNum } from '../math/latex';
import {
  fmtPoint,
  scalarTriple,
  vecAdd,
  vecAngleDeg,
  vecCross,
  vecNorm,
  vecProj,
  vecScale,
  vecSub,
  vecUnit,
} from '../math/vectors';
import {
  addAngleSector,
  addCoordinateBox,
  addLabeledSphere,
  addParallelepiped,
  addParallelogram,
  addPolyline,
  addQuadPatch,
  addRightAngleMarker,
  addSolidVectorArrow,
  addThickCurve,
  addTriangle,
} from './sceneHelpers';

export interface Chapter1SceneInput {
  ch1Tab: Ch1ModuleTab;
  coordsVec: CoordsVecState;
  arithmetic: ArithmeticState;
  dotProj: DotProjState;
  crossTriple: CrossTripleState;
  lines3d: Lines3DState;
  darkMode: boolean;
}

export function getCh1SceneExtent(input: Omit<Chapter1SceneInput, 'darkMode'>): number {
  const { ch1Tab, coordsVec, arithmetic, dotProj, crossTriple, lines3d } = input;
  const maxAbs = (...vecs: Vec3Tuple[]): number => {
    let m = 0;
    for (const v of vecs) {
      m = Math.max(m, Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
    }
    return m;
  };
  let needed = BOX_LIMIT;
  if (ch1Tab === 'coords_vec') {
    needed = Math.max(needed, maxAbs(coordsVec.p1, coordsVec.p2) + 0.8);
  } else if (ch1Tab === 'arithmetic') {
    const res =
      arithmetic.operation === 'add'
        ? vecAdd(arithmetic.u, arithmetic.v)
        : arithmetic.operation === 'sub'
          ? vecSub(arithmetic.u, arithmetic.v)
          : vecScale(arithmetic.u, arithmetic.scalarK);
    needed = Math.max(needed, maxAbs(arithmetic.u, arithmetic.v, res) + 0.8);
  } else if (ch1Tab === 'dot_proj') {
    needed = Math.max(needed, maxAbs(dotProj.u, dotProj.v) + 0.8);
  } else if (ch1Tab === 'cross_triple') {
    const c = vecCross(crossTriple.u, crossTriple.v);
    needed = Math.max(
      needed,
      maxAbs(crossTriple.u, crossTriple.v, crossTriple.w, c) + 0.8,
    );
  } else if (ch1Tab === 'lines3d') {
    const effDir = lines3d.inputMode === 'two_points' ? vecSub(lines3d.p2, lines3d.p0) : lines3d.dir;
    const pt = vecAdd(lines3d.p0, vecScale(effDir, lines3d.t));
    const extras: Vec3Tuple[] = [lines3d.p0, lines3d.p2, pt];
    if (lines3d.showSecondLine && lines3d.p0Second) {
      extras.push(lines3d.p0Second);
      if (lines3d.dirSecond) {
        extras.push(vecAdd(lines3d.p0Second, lines3d.dirSecond));
      }
    }
    needed = Math.max(needed, maxAbs(...extras) + 1.2);
  }
  return Math.max(BOX_LIMIT, Math.ceil(needed));
}

export function renderChapter1Scene(
  group: THREE.Group,
  input: Chapter1SceneInput,
): { th: string; en: string } | null {
  const { ch1Tab, coordsVec, arithmetic, dotProj, crossTriple, lines3d, darkMode } = input;

  if (ch1Tab === 'coords_vec') {
    const {
      subMode,
      plotStep,
      showPlaneProjections,
      showPlaneXY,
      showPlaneXZ,
      showPlaneYZ,
      highlightOctant,
      p1,
      p2,
      showCoordBox,
      showPositionVec,
      showUnitVec,
    } = coordsVec;

    if (subMode === 'single_point') {
      const PL = BOX_LIMIT - 0.5;
      if (showPlaneXY) {
        addQuadPatch(
          group,
          [
            [-PL, -PL, 0],
            [PL, -PL, 0],
            [PL, PL, 0],
            [-PL, PL, 0],
          ],
          '#22c55e',
          0.16,
          0.55,
        );
      }
      if (showPlaneXZ) {
        addQuadPatch(
          group,
          [
            [-PL, 0, -PL],
            [PL, 0, -PL],
            [PL, 0, PL],
            [-PL, 0, PL],
          ],
          '#0ea5e9',
          0.16,
          0.55,
        );
      }
      if (showPlaneYZ) {
        addQuadPatch(
          group,
          [
            [0, -PL, -PL],
            [0, PL, -PL],
            [0, PL, PL],
            [0, -PL, PL],
          ],
          '#f97316',
          0.16,
          0.55,
        );
      }

      const [x, y, z] = p2;
      if (
        highlightOctant &&
        Math.abs(x) > 1e-4 &&
        Math.abs(y) > 1e-4 &&
        Math.abs(z) > 1e-4
      ) {
        const sx = x > 0 ? PL : -PL;
        const sy = y > 0 ? PL : -PL;
        const sz = z > 0 ? PL : -PL;
        const octMesh = new THREE.Mesh(
          new THREE.BoxGeometry(Math.abs(sy), Math.abs(sz), Math.abs(sx)),
          new THREE.MeshBasicMaterial({
            color: '#6366f1',
            transparent: true,
            opacity: 0.08,
            depthWrite: false,
          }),
        );
        octMesh.position.copy(mathVecToThree([sx / 2, sy / 2, sz / 2]));
        group.add(octMesh);
      }

      const pX: Vec3 = [x, 0, 0];
      const pXY: Vec3 = [x, y, 0];

      if (plotStep >= 1) {
        if (Math.abs(x) > 1e-4) {
          addThickCurve(group, [[0, 0, 0], pX], '#ef4444', 0.055);
        }
        addLabeledSphere(
          group,
          pX,
          '#ef4444',
          plotStep === 1 ? `(${fmtNum(x)}, 0, 0)` : undefined,
          darkMode,
          plotStep === 1 ? 0.14 : 0.095,
          0.36,
        );
      }

      if (plotStep >= 2) {
        if (Math.abs(y) > 1e-4) {
          addThickCurve(group, [pX, pXY], '#10b981', 0.055);
        }
        addLabeledSphere(
          group,
          pXY,
          '#10b981',
          plotStep === 2 ? `(${fmtNum(x)}, ${fmtNum(y)}, 0)` : undefined,
          darkMode,
          plotStep === 2 ? 0.14 : 0.095,
          0.36,
        );
      }

      if (plotStep >= 3) {
        if (Math.abs(z) > 1e-4) {
          addThickCurve(group, [pXY, p2], '#3b82f6', 0.055);
        }
        addLabeledSphere(
          group,
          p2,
          '#f59e0b',
          `P${fmtPoint(p2)}`,
          darkMode,
          0.17,
          0.42,
        );

        if (showCoordBox) {
          addCoordinateBox(group, p2, '#64748b', 0.52);
        }

        if (showPlaneProjections) {
          const projXY: Vec3 = [x, y, 0];
          const projXZ: Vec3 = [x, 0, z];
          const projYZ: Vec3 = [0, y, z];
          addLabeledSphere(group, projXY, '#10b981', `xy(${fmtNum(x)},${fmtNum(y)},0)`, darkMode, 0.09, -0.35);
          addLabeledSphere(group, projXZ, '#ec4899', `xz(${fmtNum(x)},0,${fmtNum(z)})`, darkMode, 0.09, 0.32);
          addLabeledSphere(group, projYZ, '#6366f1', `yz(0,${fmtNum(y)},${fmtNum(z)})`, darkMode, 0.09, 0.32);
        }
      }
      return null;
    }

    const v = vecSub(p2, p1);
    const vNorm = vecNorm(v);

    if (showCoordBox) {
      addCoordinateBox(group, p1, '#64748b', 0.48);
      addCoordinateBox(group, p2, '#0284c7', 0.58);
    }

    addLabeledSphere(group, p1, '#6366f1', `P₁${fmtPoint(p1)}`, darkMode, 0.13);
    addLabeledSphere(group, p2, '#0ea5e9', `P₂${fmtPoint(p2)}`, darkMode, 0.14);

    addSolidVectorArrow(group, p1, v, '#0ea5e9', 'P₁P₂', darkMode, {
      labelMidpoint: true,
    });

    if (showPositionVec && vecNorm(p1) > 1e-4) {
      addSolidVectorArrow(group, [0, 0, 0], v, '#10b981', 'v (Position)', darkMode, {
        opacity: 0.72,
      });
      addPolyline(group, [p1, [0, 0, 0]], '#94a3b8', 0.45, true);
      addPolyline(group, [p2, v], '#94a3b8', 0.45, true);
    }

    if (showUnitVec) {
      const uHat = vecUnit(v);
      if (uHat) {
        const unitOrigin: Vec3 = showPositionVec ? [0, 0, 0] : p1;
        addSolidVectorArrow(group, unitOrigin, uHat, '#f59e0b', 'û (Unit)', darkMode, {
          shaftRadius: 0.068,
          headRadius: 0.15,
          headLen: 0.28,
        });
      }
    }

    if (vNorm < 1e-4) {
      return {
        th: 'P₁ และ P₂ เป็นจุดเดียวกัน จึงได้เวกเตอร์ศูนย์ (Zero Vector)',
        en: 'P₁ and P₂ coincide, giving the zero vector',
      };
    }
    return null;
  }

  if (ch1Tab === 'arithmetic') {
    const { u, v, scalarK, operation, slideProgress, showParallelogram } = arithmetic;
    addSolidVectorArrow(group, [0, 0, 0], u, '#0ea5e9', 'u', darkMode);

    if (operation === 'scalar') {
      const res = vecScale(u, scalarK);
      addSolidVectorArrow(
        group,
        [0, 0, 0],
        res,
        '#f59e0b',
        `${fmtNum(scalarK)}u`,
        darkMode,
        { shaftRadius: 0.06, headRadius: 0.15 },
      );
      if (Math.abs(scalarK) < 1e-4) {
        return {
          th: 'เมื่อ k = 0 จะได้เวกเตอร์ศูนย์ 0',
          en: 'When k = 0, result is the zero vector 0',
        };
      }
      return null;
    }

    // Add or Subtract
    addSolidVectorArrow(group, [0, 0, 0], v, '#10b981', 'v', darkMode);

    const activeV = operation === 'add' ? v : vecScale(v, -1);
    const activeLabel = operation === 'add' ? 'v' : '-v';
    if (operation === 'sub') {
      addSolidVectorArrow(group, [0, 0, 0], activeV, '#fb7185', '-v', darkMode, {
        opacity: 0.55,
      });
    }

    // Sliding copy of activeV from origin toward tip of u
    if (slideProgress > 0.02) {
      const slideOrigin = vecScale(u, slideProgress);
      addSolidVectorArrow(group, slideOrigin, activeV, '#34d399', activeLabel, darkMode, {
        opacity: 0.78,
        shaftRadius: 0.04,
      });
    }

    if (showParallelogram && operation === 'add') {
      addParallelogram(group, [0, 0, 0], u, v, '#38bdf8', 0.18);
    }

    const res = operation === 'add' ? vecAdd(u, v) : vecSub(u, v);
    const resLabel = operation === 'add' ? 'u + v' : 'u - v';
    addSolidVectorArrow(group, [0, 0, 0], res, '#f59e0b', resLabel, darkMode, {
      shaftRadius: 0.062,
      headRadius: 0.15,
    });
    return null;
  }

  if (ch1Tab === 'dot_proj') {
    const { subMode, u, v, showProjection, showAngleArc } = dotProj;

    if (subMode === 'dir_angles') {
      addSolidVectorArrow(group, [0, 0, 0], u, '#0ea5e9', 'u', darkMode, {
        shaftRadius: 0.06,
      });
      addCoordinateBox(group, u, '#64748b', 0.45);
      if (vecNorm(u) < 1e-4) {
        return {
          th: 'เวกเตอร์ศูนย์ไม่มีมุมบอกทิศทาง (||u|| = 0)',
          en: 'Zero vector has undefined direction angles',
        };
      }
      const alpha = vecAngleDeg(u, [1, 0, 0]) ?? 0;
      const beta = vecAngleDeg(u, [0, 1, 0]) ?? 0;
      const gamma = vecAngleDeg(u, [0, 0, 1]) ?? 0;
      addAngleSector(group, [0, 0, 0], u, [4, 0, 0], 1.5, '#ef4444', `α=${fmtNum(alpha, 1)}°`, darkMode);
      addAngleSector(group, [0, 0, 0], u, [0, 4, 0], 1.75, '#10b981', `β=${fmtNum(beta, 1)}°`, darkMode);
      addAngleSector(group, [0, 0, 0], u, [0, 0, 4], 2.0, '#3b82f6', `γ=${fmtNum(gamma, 1)}°`, darkMode);
      return null;
    }

    addSolidVectorArrow(group, [0, 0, 0], u, '#0ea5e9', 'u', darkMode);
    addSolidVectorArrow(group, [0, 0, 0], v, '#10b981', 'v', darkMode);

    const deg = vecAngleDeg(u, v);
    if (showAngleArc && deg !== null) {
      addAngleSector(group, [0, 0, 0], u, v, 1.35, '#8b5cf6', `θ=${fmtNum(deg, 1)}°`, darkMode);
    }

    if (showProjection) {
      const p = vecProj(u, v);
      if (p) {
        // Extend faint line along v if projection lands beyond v or behind origin
        const vUnitHat = vecUnit(v);
        if (vUnitHat) {
          addPolyline(
            group,
            [vecScale(vUnitHat, -4.5), vecScale(vUnitHat, 4.5)],
            '#10b981',
            0.28,
            true,
          );
        }

        addSolidVectorArrow(group, [0, 0, 0], p, '#f59e0b', 'proj_v(u)', darkMode, {
          shaftRadius: 0.062,
          headRadius: 0.14,
        });

        const ortho = vecSub(u, p);
        if (vecNorm(ortho) > 1e-4) {
          addPolyline(group, [u, p], '#f43f5e', 0.9, true);
          addRightAngleMarker(group, p, ortho, vecNorm(p) > 1e-4 ? vecScale(p, -1) : v, 0.28, '#f43f5e');
        }
      }
    }

    if (vecNorm(u) < 1e-4 || vecNorm(v) < 1e-4) {
      return {
        th: 'มีเวกเตอร์ศูนย์ จึงไม่สามารถคำนวณมุมหรือการฉายได้',
        en: 'Zero vector present — angle/projection undefined',
      };
    }
    return null;
  }

  if (ch1Tab === 'cross_triple') {
    const { subMode, u, v, w, reverseOrder, showAreaOrVolume, showTriangle } = crossTriple;
    addSolidVectorArrow(group, [0, 0, 0], u, '#0ea5e9', 'u', darkMode);
    addSolidVectorArrow(group, [0, 0, 0], v, '#10b981', 'v', darkMode);

    if (subMode === 'cross') {
      const a = reverseOrder ? v : u;
      const b = reverseOrder ? u : v;
      const c = vecCross(a, b);
      const label = reverseOrder ? 'v × u' : 'u × v';

      if (showAreaOrVolume && vecNorm(u) > 1e-4 && vecNorm(v) > 1e-4) {
        if (showTriangle) {
          addTriangle(group, [0, 0, 0], u, v, '#06b6d4', 0.34);
        } else {
          addParallelogram(group, [0, 0, 0], u, v, '#06b6d4', 0.28);
        }
      }

      if (vecNorm(c) > 1e-4) {
        addSolidVectorArrow(group, [0, 0, 0], c, '#f43f5e', label, darkMode, {
          shaftRadius: 0.062,
          headRadius: 0.15,
        });
        addRightAngleMarker(group, [0, 0, 0], u, c, 0.3, '#f43f5e');
        addRightAngleMarker(group, [0, 0, 0], v, c, 0.3, '#f43f5e');
      } else {
        return {
          th: 'u และ v ขนานกัน (หรือเป็นเวกเตอร์ศูนย์) → ผลคูณไขว้เป็น 0 (พื้นที่ = 0)',
          en: 'u and v are parallel (or zero) → Cross product is 0 (Area = 0)',
        };
      }
      return null;
    }

    // Triple Scalar Product
    addSolidVectorArrow(group, [0, 0, 0], w, '#f59e0b', 'w', darkMode);
    const vCrossW = vecCross(v, w);
    if (vecNorm(vCrossW) > 1e-4) {
      addSolidVectorArrow(group, [0, 0, 0], vCrossW, '#f43f5e', 'v × w', darkMode, {
        opacity: 0.65,
        shaftRadius: 0.04,
      });
    }
    if (showAreaOrVolume) {
      addParallelepiped(group, u, v, w, '#8b5cf6');
    }
    const triple = scalarTriple(u, v, w);
    if (Math.abs(triple) < 1e-4) {
      return {
        th: 'ปริมาตร = 0: เวกเตอร์ทั้งสามอยู่บนระนาบเดียวกัน (Coplanar)',
        en: 'Volume = 0: The three vectors are coplanar',
      };
    }
    return null;
  }

  // Tab 5: Lines in 3D Space
  const lineExtent = getCh1SceneExtent({ ch1Tab, coordsVec, arithmetic, dotProj, crossTriple, lines3d });
  const { inputMode, p0, dir, p2, t, showPositionVectors, showSecondLine, p0Second, dirSecond } = lines3d;
  const effDir = inputMode === 'two_points' ? vecSub(p2, p0) : dir;
  const dNorm = vecNorm(effDir);

  addLabeledSphere(group, p0, '#0ea5e9', `P₀${fmtPoint(p0)}`, darkMode, 0.13);
  if (inputMode === 'two_points') {
    addLabeledSphere(group, p2, '#10b981', `P₂${fmtPoint(p2)}`, darkMode, 0.13);
  }

  if (dNorm < 1e-4) {
    return {
      th: 'เวกเตอร์ทิศทาง v = 0 ไม่สามารถสร้างเส้นตรงได้',
      en: 'Direction vector v = 0 cannot define a line',
    };
  }

  // Clipped infinite line tube
  const dHat = vecScale(effDir, 1 / dNorm);
  const seg = clipSegmentToBox(
    vecSub(p0, vecScale(dHat, 40)),
    vecAdd(p0, vecScale(dHat, 40)),
    lineExtent,
  );
  if (seg) {
    addThickCurve(group, seg, '#3b82f6', 0.045);
  }

  // Direction vector arrow anchored at P0
  addSolidVectorArrow(group, p0, effDir, '#10b981', showSecondLine ? 'v₁' : 'v', darkMode, {
    shaftRadius: 0.052,
    headRadius: 0.14,
  });

  // Optional 2nd line L2 for parallel / angle comparisons
  if (showSecondLine && p0Second && dirSecond) {
    addLabeledSphere(group, p0Second, '#d946ef', `P₂,${fmtPoint(p0Second)}`, darkMode, 0.13);
    const d2Norm = vecNorm(dirSecond);
    if (d2Norm > 1e-4) {
      const d2Hat = vecScale(dirSecond, 1 / d2Norm);
      const seg2 = clipSegmentToBox(
        vecSub(p0Second, vecScale(d2Hat, 40)),
        vecAdd(p0Second, vecScale(d2Hat, 40)),
        lineExtent,
      );
      if (seg2) {
        addThickCurve(group, seg2, '#d946ef', 0.042);
      }
      addSolidVectorArrow(group, p0Second, dirSecond, '#e11d48', 'v₂', darkMode, {
        shaftRadius: 0.048,
        headRadius: 0.13,
      });
    }
  }

  // Moving point P(t) = p0 + t * effDir
  const pt = vecAdd(p0, vecScale(effDir, t));
  addLabeledSphere(
    group,
    pt,
    '#f59e0b',
    `P(${fmtNum(t)}) = ${fmtPoint(pt)}`,
    darkMode,
    0.16,
    0.42,
  );

  if (showPositionVectors) {
    if (vecNorm(p0) > 1e-4) {
      addSolidVectorArrow(group, [0, 0, 0], p0, '#6366f1', 'r₀', darkMode, {
        opacity: 0.72,
        shaftRadius: 0.038,
      });
    }
    if (vecNorm(pt) > 1e-4) {
      addSolidVectorArrow(group, [0, 0, 0], pt, '#f59e0b', 'r(t)', darkMode, {
        opacity: 0.85,
        shaftRadius: 0.042,
      });
    }
    if (Math.abs(t) > 1e-3) {
      addSolidVectorArrow(group, p0, vecScale(effDir, t), '#fb7185', `${fmtNum(t)}v`, darkMode, {
        opacity: 0.8,
        shaftRadius: 0.04,
      });
    }
  }

  // Notice if P(t) travels outside visible cube
  if (
    Math.abs(pt[0]) > lineExtent ||
    Math.abs(pt[1]) > lineExtent ||
    Math.abs(pt[2]) > lineExtent
  ) {
    return {
      th: `จุด P(${fmtNum(t)}) เคลื่อนที่ออกนอกกรอบ [-${lineExtent}, ${lineExtent}]³ เล็กน้อย`,
      en: `Point P(${fmtNum(t)}) is slightly outside the [-${lineExtent}, ${lineExtent}]³ box`,
    };
  }

  return null;
}
