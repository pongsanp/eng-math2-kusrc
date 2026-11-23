import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ArrowLeftRight, RotateCcw } from 'lucide-react';
import type { SlideEmbed3DKind, SlideExampleScene3D } from '../../slides/ch1SlidesData';
import type { SlideLang } from '../../slides/inkUtils';
import type { Vec3Tuple } from '../../types';
import { mathVecToThree } from '../../math/coords';
import { fmtNum } from '../../math/latex';
import {
  addAngleSector,
  addAxesSet,
  addLabeledSphere,
  addParallelepiped,
  addPolyline,
  addRightAngleMarker,
  addSolidVectorArrow,
  addThickCurve,
  disposeObject3D,
  makeTextSprite,
} from '../sceneHelpers';
import { renderChapter1Scene } from '../sceneCh1';

interface MiniScene3DProps {
  embed?: SlideEmbed3DKind;
  customScene?: SlideExampleScene3D;
  hintTh?: string;
  compact?: boolean;
  aboveInk?: boolean;
  lang?: SlideLang;
}

const DEFAULT_ISO: Vec3Tuple = [8.2, 8.2, 6.2];
const COMPACT_ISO: Vec3Tuple = [9.8, 9.8, 7.4];

export function MiniScene3D({
  embed,
  customScene,
  hintTh,
  compact = false,
  aboveInk = false,
  lang = 'th',
}: MiniScene3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);

  // Interactive mini-controls tailored per embed
  const [plotStep, setPlotStep] = useState<1 | 2 | 3>(3);
  const [plotOctNeg, setPlotOctNeg] = useState(false);
  const [slideProgress, setSlideProgress] = useState(1);
  const [arithOp, setArithOp] = useState<'add' | 'sub'>('add');
  const [projObtuse, setProjObtuse] = useState(false);
  const [crossFlip, setCrossFlip] = useState(false);
  const [coplanar, setCoplanar] = useState(false);
  const [lineT, setLineT] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const w = container.clientWidth || 400;
    const h = container.clientHeight || 300;
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 150);
    camera.position.copy(mathVecToThree(DEFAULT_ISO));
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(10, 14, 10);
    scene.add(dir);

    const grid = new THREE.GridHelper(8, 8, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -0.002;
    scene.add(grid);

    const axesGroup = new THREE.Group();
    addAxesSet(axesGroup, [0, 0, 0], 4.5, 3.8, false, false);
    scene.add(axesGroup);

    const contentGroup = new THREE.Group();
    scene.add(contentGroup);
    contentGroupRef.current = contentGroup;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nw = Math.max(80, entry.contentRect.width);
        const nh = Math.max(80, entry.contentRect.height);
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.copy(mathVecToThree(compact ? COMPACT_ISO : DEFAULT_ISO));
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [compact]);

  useEffect(() => {
    const group = contentGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) {
      const ch = group.children[0];
      group.remove(ch);
      disposeObject3D(ch);
    }

    if (customScene) {
      let maxAbs = 0;
      const vecs = customScene.vectors ?? [];
      const pts = customScene.points ?? [];
      const lines = customScene.lines ?? [];
      const tri = customScene.triangle;

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

      const scale = maxAbs > 4.0 ? 3.8 / maxAbs : 1;
      const sv = (t: [number, number, number]): Vec3Tuple => [t[0] * scale, t[1] * scale, t[2] * scale];

      const scaledVecs: Vec3Tuple[] = vecs.map((item) => {
        const o: Vec3Tuple = item.origin ? sv(item.origin) : [0, 0, 0];
        const v: Vec3Tuple = sv(item.vec);
        addSolidVectorArrow(group, o, v, item.color, item.label, false, {
          opacity: item.opacity ?? 1,
          shaftRadius: compact ? 0.056 : 0.048,
          labelScale: compact ? 0.52 : 0.46,
          labelMidpoint: true,
        });
        return v;
      });

      for (const p of pts) {
        addLabeledSphere(group, sv(p.pos), p.color, p.label, false, 0.12, compact ? 0.42 : 0.36);
      }

      for (const l of lines) {
        const p0 = sv(l.point);
        const len = Math.hypot(l.dir[0], l.dir[1], l.dir[2]) || 1;
        const u: Vec3Tuple = [l.dir[0] / len, l.dir[1] / len, l.dir[2] / len];
        const span = 4.0;
        const a: Vec3Tuple = [p0[0] - span * u[0], p0[1] - span * u[1], p0[2] - span * u[2]];
        const b: Vec3Tuple = [p0[0] + span * u[0], p0[1] + span * u[1], p0[2] + span * u[2]];
        addThickCurve(group, [a, b], l.color, 0.032);
        addLabeledSphere(group, p0, l.color, undefined, false, 0.09);
        const lineLabel = lang === 'en' ? (l.labelEn ?? l.label) : l.label;
        if (lineLabel) {
          const sp = makeTextSprite(lineLabel, l.color, 'halo', compact ? 0.48 : 0.42);
          const lp = mathVecToThree([p0[0] + 2.2 * u[0], p0[1] + 2.2 * u[1], p0[2] + 2.2 * u[2]]);
          sp.position.copy(lp).add(new THREE.Vector3(0.24, 0.28, 0));
          group.add(sp);
        }
      }

      if (tri) {
        const [ta, tb, tc] = tri.map((v) => mathVecToThree(sv(v)));
        const geom = new THREE.BufferGeometry().setFromPoints([ta, tb, tc]);
        geom.computeVertexNormals();
        const mat = new THREE.MeshBasicMaterial({
          color: '#10b981',
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        group.add(new THREE.Mesh(geom, mat));
        const sTri = tri.map(sv);
        addPolyline(group, [sTri[0], sTri[1], sTri[2], sTri[0]], '#059669', 0.9);
      }

      if (customScene.showParallelepiped && scaledVecs.length >= 3) {
        addParallelepiped(group, scaledVecs[0], scaledVecs[1], scaledVecs[2], '#0ea5e9');
      }
      if (customScene.showAngle && scaledVecs.length >= 2) {
        addAngleSector(
          group,
          [0, 0, 0],
          scaledVecs[0],
          scaledVecs[1],
          1.35,
          '#f59e0b',
          customScene.angleLabel ?? 'θ',
          false,
        );
      }
      if (customScene.showRightAngle && scaledVecs.length >= 2) {
        addRightAngleMarker(group, [0, 0, 0], scaledVecs[0], scaledVecs[1], 0.85, '#e11d48');
      }
      return;
    }

    if (!embed) return;

    const baseInputs = {
      coordsVec: {
        subMode: 'single_point' as const,
        plotStep,
        showPlaneProjections: true,
        p1: [0, 0, 0] as Vec3Tuple,
        p2: (plotOctNeg ? [-2, 3, 2] : [2, 3, 2]) as Vec3Tuple,
        showCoordBox: true,
        showPositionVec: false,
        showUnitVec: false,
      },
      arithmetic: {
        u: [2, 0.5, 1] as Vec3Tuple,
        v: [0.5, 2.5, 1.5] as Vec3Tuple,
        scalarK: 1.5,
        operation: arithOp,
        slideProgress,
        showParallelogram: true,
      },
      dotProj: {
        subMode: (embed === 'dir_angles' ? 'dir_angles' : 'dot_proj') as 'dot_proj' | 'dir_angles',
        u: (projObtuse ? [-1.5, 2, 2] : [2, 3, 2]) as Vec3Tuple,
        v: [3, 1, 0] as Vec3Tuple,
        showProjection: true,
        showAngleArc: true,
      },
      crossTriple: {
        subMode: (embed === 'triple' ? 'triple' : 'cross') as 'cross' | 'triple',
        u: (embed === 'triple' ? [2, 0, 0] : [2, 1, 0]) as Vec3Tuple,
        v: (embed === 'triple' ? [0, 2, 0] : [0, 2, 1.5]) as Vec3Tuple,
        w: (coplanar ? [1.5, 1.5, 0] : [0.5, 0.5, 2.5]) as Vec3Tuple,
        reverseOrder: crossFlip,
        showAreaOrVolume: true,
      },
      lines3d: {
        inputMode: 'point_dir' as const,
        p0: [1, -1, 1] as Vec3Tuple,
        dir: [1, 2, 0.5] as Vec3Tuple,
        p2: [2, 2, 2] as Vec3Tuple,
        t: lineT,
        isAnimatingT: false,
        showPositionVectors: true,
      },
      darkMode: false,
    };

    const tabMap: Record<SlideEmbed3DKind, 'coords_vec' | 'arithmetic' | 'dot_proj' | 'cross_triple' | 'lines3d'> = {
      plot_point: 'coords_vec',
      arithmetic: 'arithmetic',
      dir_angles: 'dot_proj',
      projection: 'dot_proj',
      cross: 'cross_triple',
      triple: 'cross_triple',
      line3d: 'lines3d',
    };

    renderChapter1Scene(group, {
      ch1Tab: tabMap[embed],
      ...baseInputs,
    });
  }, [embed, customScene, compact, lang, plotStep, plotOctNeg, slideProgress, arithOp, projObtuse, crossFlip, coplanar, lineT]);

  const isEn = lang === 'en';
  const resetCam = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.copy(mathVecToThree(compact ? COMPACT_ISO : DEFAULT_ISO));
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div
      data-scene-3d="true"
      className={`relative h-full flex flex-col rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-inner ${
        aboveInk ? 'z-[25]' : 'z-10'
      }`}
    >
      {/* 3D Canvas */}
      <div className={`relative flex-1 ${compact ? 'min-h-[64px]' : 'min-h-[210px]'}`}>
        <div
          ref={containerRef}
          className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        />
        <button
          type="button"
          onClick={resetCam}
          title={isEn ? 'Reset 3D camera view' : 'รีเซ็ตมุมกล้อง 3 มิติ'}
          className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/90 border border-slate-200 font-semibold text-slate-700 hover:bg-sky-50 shadow-sm ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs sm:text-sm'
          }`}
        >
          <RotateCcw className="w-3 h-3" /> {isEn ? 'Reset' : 'รีเซ็ตมุม'}
        </button>
        <div
          className={`pointer-events-none absolute top-2 left-2 flex items-center gap-2 rounded-lg bg-white/90 border border-slate-200/80 font-bold ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs sm:text-sm'
          }`}
        >
          <span className="text-rose-600">+x</span>
          <span className="text-emerald-600">+y</span>
          <span className="text-sky-600">+z</span>
        </div>
        {compact && customScene && (
          <div className="pointer-events-none absolute bottom-1.5 left-1.5 right-1.5 flex justify-start">
            <span className="px-2 py-0.5 rounded-md bg-white/85 border border-slate-200/80 text-[10px] text-slate-600 leading-tight truncate max-w-full">
              {hintTh ?? (isEn ? customScene.hintEn : customScene.hintTh) ?? (isEn ? 'Drag to orbit 3D view' : 'ลากหมุนดูรูป 3 มิติ')}
            </span>
          </div>
        )}
      </div>

      {/* Compact Interactive Controls Strip (omitted in compact example mode to save vertical space) */}
      {!compact && (
        <div className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
        {embed === 'plot_point' && (
          <div className="flex flex-wrap items-center gap-1.5 w-full justify-between">
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPlotStep(s)}
                  className={`px-2.5 py-1 rounded-lg font-semibold border ${
                    plotStep === s
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {isEn ? `Step ${s}` : `ขั้น ${s}`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPlotOctNeg((v) => !v)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:border-sky-400"
            >
              {isEn
                ? plotOctNeg
                  ? '(-2,3,2) Octant II'
                  : '(2,3,2) Octant I'
                : plotOctNeg
                  ? '(-2,3,2) อัฐภาค II'
                  : '(2,3,2) อัฐภาค I'}
            </button>
          </div>
        )}

        {embed === 'arithmetic' && (
          <div className="flex items-center gap-2 w-full">
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setArithOp('add')}
                className={`px-2.5 py-1 rounded-lg font-semibold border ${
                  arithOp === 'add' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                u + v
              </button>
              <button
                type="button"
                onClick={() => setArithOp('sub')}
                className={`px-2.5 py-1 rounded-lg font-semibold border ${
                  arithOp === 'sub' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 border-slate-200'
                }`}
              >
                u - v
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={slideProgress}
              onChange={(e) => setSlideProgress(parseFloat(e.target.value))}
              className="flex-1 h-1.5"
            />
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-600 shrink-0">
              {isEn ? 'Head-to-Tail' : 'ต่อหาง'} {Math.round(slideProgress * 100)}%
            </span>
          </div>
        )}

        {embed === 'projection' && (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs sm:text-sm text-slate-500">
              {isEn ? 'Test Angle:' : 'ทดลองมุมฉาย:'}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setProjObtuse(false)}
                className={`px-2.5 py-1 rounded-lg font-semibold border ${
                  !projObtuse ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {isEn ? 'Acute (u·v > 0)' : 'มุมแหลม (u·v > 0)'}
              </button>
              <button
                type="button"
                onClick={() => setProjObtuse(true)}
                className={`px-2.5 py-1 rounded-lg font-semibold border ${
                  projObtuse ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {isEn ? 'Obtuse (u·v < 0)' : 'มุมป้าน (u·v < 0)'}
              </button>
            </div>
          </div>
        )}

        {embed === 'cross' && (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs sm:text-sm font-semibold text-rose-700">
              {isEn ? 'Showing:' : 'แสดง:'} {crossFlip ? 'v × u' : 'u × v'}
            </span>
            <button
              type="button"
              onClick={() => setCrossFlip((f) => !f)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {isEn ? 'Swap' : 'สลับ'} {crossFlip ? 'v × u → u × v' : 'u × v → v × u'}
            </button>
          </div>
        )}

        {embed === 'triple' && (
          <div className="flex items-center justify-between w-full gap-2">
            <span className="text-xs sm:text-sm text-slate-600 font-semibold">
              {isEn
                ? coplanar
                  ? 'Coplanar (V = 0)'
                  : 'Parallelepiped (V = 10)'
                : coplanar
                  ? 'ระนาบเดียวกัน (V = 0)'
                  : 'กล่อง 3 มิติ (V = 10)'}
            </span>
            <button
              type="button"
              onClick={() => setCoplanar((c) => !c)}
              className="px-2.5 py-1 rounded-lg border border-violet-300 bg-violet-50 text-violet-800 font-semibold hover:bg-violet-100"
            >
              {isEn
                ? coplanar
                  ? 'Restore Box V ≠ 0'
                  : 'Test V = 0 (Coplanar)'
                : coplanar
                  ? 'กลับเป็นกล่อง V ≠ 0'
                  : 'ทดสอบ V = 0 (Coplanar)'}
            </button>
          </div>
        )}

        {embed === 'line3d' && (
          <div className="flex items-center gap-2 w-full">
            <span className="font-semibold text-amber-700 shrink-0">t = {fmtNum(lineT)}</span>
            <input
              type="range"
              min={-2}
              max={2}
              step={0.1}
              value={lineT}
              onChange={(e) => setLineT(parseFloat(e.target.value))}
              className="flex-1 h-1.5"
            />
            <button
              type="button"
              onClick={() => setLineT(0)}
              className="px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-xs sm:text-sm"
            >
              t=0 (P₀)
            </button>
          </div>
        )}

        {embed === 'dir_angles' && hintTh && (
          <div className="text-xs sm:text-sm text-slate-600">{hintTh}</div>
        )}
        </div>
      )}
    </div>
  );
}
