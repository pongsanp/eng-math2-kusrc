import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  ArithmeticState,
  AxisName,
  CameraPreset,
  Ch1ModuleTab,
  Ch3ExtremaState,
  Ch3GradientState,
  Ch3LevelCurvesState,
  Ch3LimitsState,
  Ch3ModuleTab,
  Ch3PartialsState,
  ChapterId,
  CoordsVecState,
  CrossTripleState,
  CylindersState,
  DotProjState,
  Lines3DState,
  ModuleTab,
  PlanesState,
  QuadricsState,
  TraceResult,
  TranslationState,
  ViewerSettings,
} from '../types';
import { BOX_LIMIT, mathVecToThree, type Vec3 } from '../math/coords';
import {
  buildCylinderGeometry,
  buildPlaneGeometry,
  buildQuadricGeometry,
  buildTranslationGeometry,
  type SurfaceBuildResult,
} from '../math/surfaceBuilders';
import { fmtNum } from '../math/latex';
import {
  addAxesSet,
  addPolyline,
  addThickCurve,
  disposeObject3D,
  makeTextSprite,
} from './sceneHelpers';
import { renderChapter1Scene } from './sceneCh1';
import { renderChapter3Scene } from './sceneCh3';

interface Scene3DProps {
  activeChapter: ChapterId;
  ch1Tab: Ch1ModuleTab;
  coordsVec: CoordsVecState;
  arithmetic: ArithmeticState;
  dotProj: DotProjState;
  crossTriple: CrossTripleState;
  lines3d: Lines3DState;
  ch3Tab: Ch3ModuleTab;
  ch3LevelCurves: Ch3LevelCurvesState;
  ch3Limits: Ch3LimitsState;
  ch3Partials: Ch3PartialsState;
  ch3Gradient: Ch3GradientState;
  ch3Extrema: Ch3ExtremaState;
  activeTab: ModuleTab;
  planes: PlanesState;
  cylinders: CylindersState;
  quadrics: QuadricsState;
  translation: TranslationState;
  traceResult: TraceResult | null;
  settings: ViewerSettings;
  cameraCommand: { preset: CameraPreset; seq: number } | null;
  onWarningChange?: (warning: { th: string; en: string } | null) => void;
}

function getCameraPositionForPreset(preset: CameraPreset): Vec3 {
  switch (preset) {
    case 'top':
      return [0, -0.01, 13.8];
    case 'front':
      return [13.8, 0, 0];
    case 'side':
      return [0, -13.8, 0];
    case 'isometric':
    default:
      return [9.5, 9.5, 7.2];
  }
}

export function Scene3D({
  activeChapter,
  ch1Tab,
  coordsVec,
  arithmetic,
  dotProj,
  crossTriple,
  lines3d,
  ch3Tab,
  ch3LevelCurves,
  ch3Limits,
  ch3Partials,
  ch3Gradient,
  ch3Extrema,
  activeTab,
  planes,
  cylinders,
  quadrics,
  translation,
  traceResult,
  settings,
  cameraCommand,
  onWarningChange,
}: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);
  const contentGroupRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);
    const iso = getCameraPositionForPreset('isometric');
    camera.position.copy(mathVecToThree(iso));
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 4;
    controls.maxDistance = 35;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Studio lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x334155, 0.65);
    scene.add(hemi);

    const dir1 = new THREE.DirectionalLight(0xffffff, 0.95);
    dir1.position.set(10, 16, 12);
    scene.add(dir1);

    const dir2 = new THREE.DirectionalLight(0xbae6fd, 0.45);
    dir2.position.set(-12, -8, -10);
    scene.add(dir2);

    const axesGroup = new THREE.Group();
    scene.add(axesGroup);
    axesGroupRef.current = axesGroup;

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

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(100, entry.contentRect.width);
        const h = Math.max(100, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeObject3D(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync background, grid, axes, and auto-rotate settings
  useEffect(() => {
    const scene = sceneRef.current;
    const axesGroup = axesGroupRef.current;
    const controls = controlsRef.current;
    if (!scene || !axesGroup || !controls) return;

    scene.background = new THREE.Color(settings.darkMode ? 0x0b1120 : 0xf8fafc);
    controls.autoRotate = settings.autoRotate;
    controls.autoRotateSpeed = 1.4;

    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
      gridHelperRef.current.geometry.dispose();
      const mat = gridHelperRef.current.material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
      gridHelperRef.current = null;
    }

    if (settings.showGrid) {
      const grid = new THREE.GridHelper(
        10,
        10,
        settings.darkMode ? 0x334155 : 0xcbd5e1,
        settings.darkMode ? 0x1e293b : 0xe2e8f0,
      );
      grid.position.y = -0.002;
      scene.add(grid);
      gridHelperRef.current = grid;
    }

    // Rebuild base axes
    while (axesGroup.children.length > 0) {
      const child = axesGroup.children[0];
      axesGroup.remove(child);
      disposeObject3D(child);
    }
    const isTranslation = activeChapter === 'ch2' && activeTab === 'translation';
    const axisSpan = isTranslation ? 5.8 : 5.3;
    const negSpan = isTranslation ? 4.8 : 4.6;
    addAxesSet(axesGroup, [0, 0, 0], axisSpan, negSpan, false, settings.darkMode);
  }, [settings.darkMode, settings.showGrid, settings.autoRotate, activeChapter, activeTab]);

  // Camera preset commands
  useEffect(() => {
    if (!cameraCommand || !cameraRef.current || !controlsRef.current) return;
    const pos = getCameraPositionForPreset(cameraCommand.preset);
    cameraRef.current.position.copy(mathVecToThree(pos));
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  }, [cameraCommand]);

  // Rebuild math surface & overlays whenever parameters change
  useEffect(() => {
    const contentGroup = contentGroupRef.current;
    if (!contentGroup) return;

    while (contentGroup.children.length > 0) {
      const child = contentGroup.children[0];
      contentGroup.remove(child);
      disposeObject3D(child);
    }

    const renderSurfaceResult = (
      res: SurfaceBuildResult,
      options: { isGhost?: boolean } = {},
    ) => {
      const { isGhost = false } = options;
      const mat = isGhost
        ? new THREE.MeshPhongMaterial({
            color: settings.darkMode ? 0x818cf8 : 0x6366f1,
            transparent: true,
            opacity: 0.16,
            wireframe: false,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
        : new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.45,
            metalness: 0.08,
            side: THREE.DoubleSide,
            wireframe: settings.wireframe,
            transparent: settings.transparent,
            opacity: settings.transparent ? 0.58 : 0.94,
            depthWrite: !settings.transparent,
          });

      for (const geom of res.geometries) {
        const mesh = new THREE.Mesh(geom, mat.clone());
        contentGroup.add(mesh);
      }
      mat.dispose();

      if (!settings.wireframe) {
        const gridColor = isGhost
          ? settings.darkMode
            ? 0xa5b4fc
            : 0x6366f1
          : settings.darkMode
            ? 0xe2e8f0
            : 0x0f172a;
        const gridOp = isGhost ? 0.3 : 0.16;
        for (const linePts of res.gridLines) {
          addPolyline(contentGroup, linePts, gridColor, gridOp, isGhost);
        }
      }
    };

    let nextWarning: { th: string; en: string } | null = null;

    if (activeChapter === 'ch1') {
      nextWarning = renderChapter1Scene(contentGroup, {
        ch1Tab,
        coordsVec,
        arithmetic,
        dotProj,
        crossTriple,
        lines3d,
        darkMode: settings.darkMode,
      });
    } else if (activeChapter === 'ch3') {
      nextWarning = renderChapter3Scene(contentGroup, {
        ch3Tab,
        levelCurves: ch3LevelCurves,
        limits: ch3Limits,
        partials: ch3Partials,
        gradient: ch3Gradient,
        extrema: ch3Extrema,
        settings,
      });
    } else if (activeTab === 'planes') {
      const planeRes = buildPlaneGeometry(planes, BOX_LIMIT);
      if (planeRes.warning) nextWarning = planeRes.warning;

      if (planeRes.geometry) {
        const mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.45,
          metalness: 0.05,
          side: THREE.DoubleSide,
          wireframe: settings.wireframe,
          transparent: true,
          opacity: settings.transparent ? 0.55 : 0.82,
          depthWrite: !settings.transparent,
        });
        contentGroup.add(new THREE.Mesh(planeRes.geometry, mat));
        addPolyline(
          contentGroup,
          planeRes.boundaryPoints,
          settings.darkMode ? 0x93c5fd : 0x1d4ed8,
          0.9,
        );
      }

      // Normal vector
      if (planes.showNormal && planeRes.normalAnchor && planeRes.normalDir) {
        const anchor = mathVecToThree(planeRes.normalAnchor);
        const dir = mathVecToThree(planeRes.normalDir).normalize();
        const arrowLen = 2.0;
        const arrow = new THREE.ArrowHelper(dir, anchor, arrowLen, 0xf43f5e, 0.35, 0.17);
        contentGroup.add(arrow);
        const tip = anchor.clone().addScaledVector(dir, arrowLen + 0.32);
        const lbl = makeTextSprite(
          `n = (${fmtNum(planes.a)}, ${fmtNum(planes.b)}, ${fmtNum(planes.c)})`,
          '#f43f5e',
          settings.darkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)',
          0.55,
        );
        lbl.position.copy(tip);
        contentGroup.add(lbl);
      }

      // Axis intercepts
      if (planes.showIntercepts) {
        const { x, y, z } = planeRes.intercepts;
        const items: Array<{ pt: Vec3; label: string; color: string }> = [];
        if (x !== null && Math.abs(x) <= BOX_LIMIT + 1.5) {
          items.push({ pt: [x, 0, 0], label: `(${fmtNum(x)}, 0, 0)`, color: '#ef4444' });
        }
        if (y !== null && Math.abs(y) <= BOX_LIMIT + 1.5) {
          items.push({ pt: [0, y, 0], label: `(0, ${fmtNum(y)}, 0)`, color: '#10b981' });
        }
        if (z !== null && Math.abs(z) <= BOX_LIMIT + 1.5) {
          items.push({ pt: [0, 0, z], label: `(0, 0, ${fmtNum(z)})`, color: '#3b82f6' });
        }
        for (const item of items) {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 18, 18),
            new THREE.MeshBasicMaterial({ color: item.color }),
          );
          sphere.position.copy(mathVecToThree(item.pt));
          contentGroup.add(sphere);

          const sp = makeTextSprite(
            item.label,
            item.color,
            settings.darkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.92)',
            0.48,
          );
          sp.position.copy(mathVecToThree(item.pt)).add(new THREE.Vector3(0, 0.38, 0));
          contentGroup.add(sp);
        }
      }

      // Coordinate-plane traces
      if (planes.showCoordTraces) {
        for (const tr of planeRes.coordTraces) {
          for (const seg of tr.segments) {
            addThickCurve(contentGroup, seg, tr.color, 0.04);
          }
        }
      }
    } else if (activeTab === 'cylinders') {
      const cylRes = buildCylinderGeometry(cylinders, BOX_LIMIT);
      if (cylRes.warning) nextWarning = cylRes.warning;
      renderSurfaceResult(cylRes);

      if (cylinders.showGeneratingCurve && cylRes.generatingCurve) {
        for (const branchPts of cylRes.generatingCurve) {
          addThickCurve(contentGroup, branchPts, '#f59e0b', 0.065);
        }
      }

      if (cylinders.showRulings && cylRes.rulingLines) {
        for (const seg of cylRes.rulingLines) {
          addPolyline(
            contentGroup,
            seg,
            settings.darkMode ? 0xfda4af : 0xe11d48,
            0.85,
            true,
          );
        }
      }
    } else if (activeTab === 'quadrics') {
      const quadRes = buildQuadricGeometry(quadrics, { limit: BOX_LIMIT });
      if (quadRes.warning) nextWarning = quadRes.warning;
      renderSurfaceResult(quadRes);

      if (quadrics.slicingEnabled) {
        const k = quadrics.sliceK;
        const pAxis: AxisName = quadrics.slicePlane;
        const L = BOX_LIMIT;

        // Slicing plane quad
        const cornersMath: Vec3[] =
          pAxis === 'z'
            ? [
                [-L, -L, k],
                [L, -L, k],
                [L, L, k],
                [-L, L, k],
              ]
            : pAxis === 'y'
              ? [
                  [-L, k, -L],
                  [L, k, -L],
                  [L, k, L],
                  [-L, k, L],
                ]
              : [
                  [k, -L, -L],
                  [k, L, -L],
                  [k, L, L],
                  [k, -L, L],
                ];

        const cThree = cornersMath.map((c) => mathVecToThree(c));
        const planeGeom = new THREE.BufferGeometry().setFromPoints([
          cThree[0],
          cThree[1],
          cThree[2],
          cThree[0],
          cThree[2],
          cThree[3],
        ]);
        planeGeom.computeVertexNormals();
        const planeMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        contentGroup.add(new THREE.Mesh(planeGeom, planeMat));
        addPolyline(
          contentGroup,
          [cornersMath[0], cornersMath[1], cornersMath[2], cornersMath[3], cornersMath[0]],
          '#f59e0b',
          0.75,
        );

        // Glowing 3D trace curves & points
        if (traceResult) {
          for (const c3 of traceResult.curves3D) {
            addThickCurve(contentGroup, c3, '#fbbf24', 0.068);
          }
          for (const pt3 of traceResult.points3D) {
            const dot = new THREE.Mesh(
              new THREE.SphereGeometry(0.16, 20, 20),
              new THREE.MeshBasicMaterial({ color: '#fbbf24' }),
            );
            dot.position.copy(mathVecToThree(pt3));
            contentGroup.add(dot);
          }
        }
      }
    } else {
      // Tab 4: Translation of Axes
      const { shifted, ghost } = buildTranslationGeometry(translation);
      if (shifted.warning) nextWarning = shifted.warning;
      if (ghost) renderSurfaceResult(ghost, { isGhost: true });
      renderSurfaceResult(shifted);

      const oPrime: Vec3 = [translation.x0, translation.y0, translation.z0];
      if (translation.showShiftedAxes) {
        addAxesSet(contentGroup, oPrime, 3.4, 2.2, true, settings.darkMode);
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 20, 20),
          new THREE.MeshBasicMaterial({ color: '#f97316' }),
        );
        sphere.position.copy(mathVecToThree(oPrime));
        contentGroup.add(sphere);

        const lbl = makeTextSprite(
          `O'(${fmtNum(translation.x0)}, ${fmtNum(translation.y0)}, ${fmtNum(translation.z0)})`,
          '#f97316',
          settings.darkMode ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)',
          0.52,
        );
        lbl.position.copy(mathVecToThree(oPrime)).add(new THREE.Vector3(0.45, 0.45, 0));
        contentGroup.add(lbl);

        // Dashed displacement vector from (0,0,0) to (x0,y0,z0)
        if (Math.hypot(oPrime[0], oPrime[1], oPrime[2]) > 0.1) {
          addPolyline(contentGroup, [[0, 0, 0], oPrime], '#f97316', 0.8, true);
        }
      }
    }

    onWarningChange?.(nextWarning);
  }, [
    activeChapter,
    ch1Tab,
    coordsVec,
    arithmetic,
    dotProj,
    crossTriple,
    lines3d,
    ch3Tab,
    ch3LevelCurves,
    ch3Limits,
    ch3Partials,
    ch3Gradient,
    ch3Extrema,
    activeTab,
    planes,
    cylinders,
    quadrics,
    translation,
    traceResult,
    settings,
    onWarningChange,
  ]);

  return <div ref={containerRef} className="w-full h-full touch-none cursor-grab active:cursor-grabbing" />;
}
