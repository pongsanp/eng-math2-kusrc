import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Box,
  Compass,
  Crosshair,
  Eye,
  GitCommitHorizontal,
  Grid3X3,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  Move3D,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  PlusSquare,
  Presentation,
  RotateCw,
  Shapes,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
} from 'lucide-react';
import type {
  ArithmeticState,
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
  TranslationState,
  ViewerSettings,
} from './types';
import {
  buildCylinderEquationLatex,
  buildPlaneEquationLatex,
  buildQuadricEquationLatex,
  buildTranslationEquationsLatex,
  fmtNum,
} from './math/latex';
import {
  CYLINDER_INFO,
  QUADRIC_INFO,
  TRANSLATION_SURFACE_NAMES,
} from './math/presets';
import { computeQuadricTrace } from './math/traces';
import {
  buildLineEquationsLatex,
  fmtPoint,
  fmtVecAngle,
  scalarTriple,
  vecAdd,
  vecAngleDeg,
  vecCross,
  vecDot,
  vecProj,
  vecScale,
  vecSub,
} from './math/vectors';
import {
  EXTREMA_PRESETS,
  LIMIT_FUNCS,
  MULTIVAR_FUNCS,
  classifySecondDeriv,
} from './math/multivar';
import { KaTeX } from './components/KaTeX';
import { Scene3D } from './components/Scene3D';
import { Trace2DCard } from './components/Trace2DCard';
import { Contour2DCard } from './components/Contour2DCard';
import { PlanesPanel } from './components/panels/PlanesPanel';
import { CylindersPanel } from './components/panels/CylindersPanel';
import { QuadricsPanel } from './components/panels/QuadricsPanel';
import { TranslationPanel } from './components/panels/TranslationPanel';
import { CoordsVecPanel } from './components/panels/ch1/CoordsVecPanel';
import { ArithmeticPanel } from './components/panels/ch1/ArithmeticPanel';
import { DotProjPanel } from './components/panels/ch1/DotProjPanel';
import { CrossTriplePanel } from './components/panels/ch1/CrossTriplePanel';
import { Lines3DPanel } from './components/panels/ch1/Lines3DPanel';
import { LevelCurvesPanel } from './components/panels/ch3/LevelCurvesPanel';
import { LimitsPanel } from './components/panels/ch3/LimitsPanel';
import { PartialsTangentPanel } from './components/panels/ch3/PartialsTangentPanel';
import { GradientDirPanel } from './components/panels/ch3/GradientDirPanel';
import { ExtremaPanel } from './components/panels/ch3/ExtremaPanel';
import { SlidesDeck } from './components/slides/SlidesDeck';

const CH1_TABS: Array<{
  id: Ch1ModuleTab;
  th: string;
  en: string;
  icon: typeof Box;
}> = [
  { id: 'coords_vec', th: '1. พิกัด & เวกเตอร์', en: 'Vectors', icon: ArrowUpRight },
  { id: 'arithmetic', th: '2. บวก-ลบ-สเกลาร์', en: 'Arithmetic', icon: PlusSquare },
  { id: 'dot_proj', th: '3. Dot & การฉาย', en: 'Dot / Proj', icon: Crosshair },
  { id: 'cross_triple', th: '4. Cross & 3 เวกเตอร์', en: 'Cross / Vol', icon: Sparkles },
  { id: 'lines3d', th: '5. เส้นตรง 3 มิติ', en: '3D Lines', icon: GitCommitHorizontal },
];

const CH2_TABS: Array<{
  id: ModuleTab;
  th: string;
  en: string;
  icon: typeof Box;
}> = [
  { id: 'planes', th: '1. ระนาบ 3 มิติ', en: 'Planes', icon: Layers },
  { id: 'cylinders', th: '2. ทรงกระบอก', en: 'Cylinders', icon: Box },
  { id: 'quadrics', th: '3. พื้นผิวกำลังสอง', en: 'Quadrics', icon: Shapes },
  { id: 'translation', th: '4. การย้ายแกน', en: 'Translation', icon: Move3D },
];

const CH3_TABS: Array<{
  id: Ch3ModuleTab;
  th: string;
  en: string;
  icon: typeof Box;
}> = [
  { id: 'level_curves', th: '1. เส้นชั้นระดับ', en: 'Contours', icon: Activity },
  { id: 'limits', th: '2. ลิมิตหลายตัวแปร', en: 'Limits', icon: Target },
  { id: 'partials_tangent', th: '3. อนุพันธ์ย่อย & สัมผัส', en: 'Partials', icon: TrendingUp },
  { id: 'gradient_dir', th: '4. เกรเดียนต์ ∇f', en: 'Gradient', icon: Navigation },
  { id: 'extrema', th: '5. ค่าสุดขีด & อานม้า', en: 'Extrema', icon: Shapes },
];

export default function App() {
  const [appView, setAppView] = useState<'dashboard' | 'slides'>('dashboard');
  const [activeChapter, setActiveChapter] = useState<ChapterId>('ch1');
  const [ch1Tab, setCh1Tab] = useState<Ch1ModuleTab>('coords_vec');
  const [activeTab, setActiveTab] = useState<ModuleTab>('quadrics');
  const [ch3Tab, setCh3Tab] = useState<Ch3ModuleTab>('level_curves');

  // Chapter 1 state
  const [coordsVec, setCoordsVec] = useState<CoordsVecState>({
    subMode: 'single_point',
    plotStep: 3,
    showPlaneProjections: true,
    p1: [1, -1, 1],
    p2: [2, 3, 2],
    showCoordBox: true,
    showPositionVec: true,
    showUnitVec: false,
  });

  const [arithmetic, setArithmetic] = useState<ArithmeticState>({
    u: [2, 0.5, 1],
    v: [0.5, 2.5, 1.5],
    scalarK: 1.5,
    operation: 'add',
    slideProgress: 1,
    showParallelogram: true,
  });

  const [dotProj, setDotProj] = useState<DotProjState>({
    subMode: 'dot_proj',
    u: [2, 3, 2],
    v: [3, 1, 0],
    showProjection: true,
    showAngleArc: true,
  });

  const [crossTriple, setCrossTriple] = useState<CrossTripleState>({
    subMode: 'cross',
    u: [2, 1, 0],
    v: [0, 2, 1.5],
    w: [0.5, 0.5, 2.5],
    reverseOrder: false,
    showAreaOrVolume: true,
  });

  const [lines3d, setLines3d] = useState<Lines3DState>({
    inputMode: 'point_dir',
    p0: [1, -1, 2],
    dir: [1, 2, -1],
    p2: [2, 2, 3],
    t: 1,
    isAnimatingT: false,
    showPositionVectors: true,
  });

  // Chapter 3 state
  const [ch3LevelCurves, setCh3LevelCurves] = useState<Ch3LevelCurvesState>({
    funcId: 'gaussian',
    scaleA: 1,
    sliceK: 1.2,
    showSlicePlane: true,
    showContoursOnFloor: true,
  });

  const [ch3Limits, setCh3Limits] = useState<Ch3LimitsState>({
    funcId: 'xy_over_r2',
    pathType: 'line',
    pathParam: 1,
    approachT: 1.2,
    isAnimatingApproach: false,
  });

  const [ch3Partials, setCh3Partials] = useState<Ch3PartialsState>({
    funcId: 'paraboloid_down',
    x0: 1,
    y0: 1,
    showSliceX: true,
    showSliceY: true,
    showTangentPlane: true,
    dx: 0.25,
    dy: 0.25,
  });

  const [ch3Gradient, setCh3Gradient] = useState<Ch3GradientState>({
    funcId: 'gaussian',
    x0: 1,
    y0: 0.5,
    thetaDeg: 35,
    showGradient: true,
    showDirectionalTangent: true,
    showLevelCurve: true,
  });

  const [ch3Extrema, setCh3Extrema] = useState<Ch3ExtremaState>({
    subMode: 'quadratic_test',
    quadA: 0.6,
    quadB: 0,
    quadC: -0.6,
    presetFunc: 'cubic_saddle_min',
  });

  // Chapter 2 state

  const [planes, setPlanes] = useState<PlanesState>({
    a: 2,
    b: 3,
    c: 2,
    d: 6,
    showNormal: true,
    showIntercepts: true,
    showCoordTraces: true,
  });

  const [cylinders, setCylinders] = useState<CylindersState>({
    type: 'parabolic',
    missingAxis: 'y',
    hyperbolicSign: 1,
    a: 0.5,
    b: 1.5,
    c: -1,
    extrusionLength: 7,
    isAnimatingExtrusion: false,
    showGeneratingCurve: true,
    showRulings: true,
  });

  const [quadrics, setQuadrics] = useState<QuadricsState>({
    mode: 'hyperboloid_1',
    symmetryAxis: 'z',
    paraboloidSign: 1,
    a: 1.5,
    b: 1.5,
    c: 2,
    morphD: 1,
    slicingEnabled: true,
    slicePlane: 'z',
    sliceK: 1.5,
  });

  const [translation, setTranslation] = useState<TranslationState>({
    surfaceType: 'ellipsoid',
    paraboloidSign: 1,
    x0: 2,
    y0: -1,
    z0: 1,
    a: 2,
    b: 1.5,
    c: 1,
    showGhost: true,
    showShiftedAxes: true,
    quizMode: false,
    quizRevealed: false,
  });

  const [settings, setSettings] = useState<ViewerSettings>({
    darkMode: false,
    presentationMode: false,
    wireframe: false,
    transparent: false,
    showGrid: true,
    autoRotate: false,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cameraCommand, setCameraCommand] = useState<{
    preset: CameraPreset;
    seq: number;
  } | null>(null);
  const [sceneWarning, setSceneWarning] = useState<{ th: string; en: string } | null>(null);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [settings.darkMode]);

  // Extrusion length animation in Chapter 2 Tab 2
  useEffect(() => {
    if (
      activeChapter !== 'ch2' ||
      !cylinders.isAnimatingExtrusion ||
      activeTab !== 'cylinders'
    ) {
      return;
    }
    let dir: number | null = null;
    const timer = window.setInterval(() => {
      setCylinders((prev) => {
        if (!prev.isAnimatingExtrusion) return prev;
        if (dir === null) dir = prev.extrusionLength >= 8.8 ? -1 : 1;
        let nextLen = prev.extrusionLength + dir * 0.25;
        if (nextLen >= 9) {
          nextLen = 9;
          dir = -1;
        } else if (nextLen <= 0) {
          nextLen = 0;
          dir = 1;
        }
        return { ...prev, extrusionLength: Math.round(nextLen * 100) / 100 };
      });
    }, 55);
    return () => window.clearInterval(timer);
  }, [activeChapter, cylinders.isAnimatingExtrusion, activeTab]);

  // Parameter t animation in Chapter 1 Tab 5
  useEffect(() => {
    if (
      activeChapter !== 'ch1' ||
      !lines3d.isAnimatingT ||
      ch1Tab !== 'lines3d'
    ) {
      return;
    }
    let dir: number | null = null;
    const timer = window.setInterval(() => {
      setLines3d((prev) => {
        if (!prev.isAnimatingT) return prev;
        if (dir === null) dir = prev.t >= 1.9 ? -1 : 1;
        let nextT = prev.t + dir * 0.08;
        if (nextT >= 2) {
          nextT = 2;
          dir = -1;
        } else if (nextT <= -2) {
          nextT = -2;
          dir = 1;
        }
        return { ...prev, t: Math.round(nextT * 100) / 100 };
      });
    }, 55);
    return () => window.clearInterval(timer);
  }, [activeChapter, lines3d.isAnimatingT, ch1Tab]);

  // Approach animation in Chapter 3 Tab 2
  useEffect(() => {
    if (
      activeChapter !== 'ch3' ||
      !ch3Limits.isAnimatingApproach ||
      ch3Tab !== 'limits'
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setCh3Limits((prev) => {
        if (!prev.isAnimatingApproach) return prev;
        let next = prev.approachT * 0.9;
        if (Math.abs(next) < 0.04) {
          next = prev.approachT >= 0 ? 2 : -2;
        }
        return { ...prev, approachT: Math.round(next * 100) / 100 };
      });
    }, 85);
    return () => window.clearInterval(timer);
  }, [activeChapter, ch3Limits.isAnimatingApproach, ch3Tab]);

  const traceResult = useMemo(() => {
    if (activeChapter !== 'ch2' || activeTab !== 'quadrics' || !quadrics.slicingEnabled) {
      return null;
    }
    return computeQuadricTrace(quadrics);
  }, [activeChapter, activeTab, quadrics]);

  const bannerContent = useMemo(() => {
    if (activeChapter === 'ch1') {
      if (ch1Tab === 'coords_vec') {
        if (coordsVec.subMode === 'single_point') {
          return {
            titleTh: 'พิกัดในปริภูมิ 3 มิติ (พล็อตจุดทีละขั้น)',
            titleEn: 'Point in 3D Space',
            latex: `P = ${fmtPoint(coordsVec.p2)}`,
          };
        }
        const v = vecSub(coordsVec.p2, coordsVec.p1);
        return {
          titleTh: 'พิกัด 3 มิติ & เวกเตอร์ระหว่างจุด',
          titleEn: '3D Coordinates & Vector',
          latex: `\\overrightarrow{P_1P_2} = ${fmtVecAngle(v)}`,
        };
      }
      if (ch1Tab === 'arithmetic') {
        const res =
          arithmetic.operation === 'add'
            ? vecAdd(arithmetic.u, arithmetic.v)
            : arithmetic.operation === 'sub'
              ? vecSub(arithmetic.u, arithmetic.v)
              : vecScale(arithmetic.u, arithmetic.scalarK);
        const expr =
          arithmetic.operation === 'add'
            ? '\\mathbf{u} + \\mathbf{v}'
            : arithmetic.operation === 'sub'
              ? '\\mathbf{u} - \\mathbf{v}'
              : `${fmtNum(arithmetic.scalarK)}\\mathbf{u}`;
        return {
          titleTh: 'พีชคณิตของเวกเตอร์',
          titleEn: 'Vector Arithmetic',
          latex: `${expr} = ${fmtVecAngle(res)}`,
        };
      }
      if (ch1Tab === 'dot_proj') {
        if (dotProj.subMode === 'dir_angles') {
          const a = vecAngleDeg(dotProj.u, [1, 0, 0]);
          const b = vecAngleDeg(dotProj.u, [0, 1, 0]);
          const g = vecAngleDeg(dotProj.u, [0, 0, 1]);
          return {
            titleTh: 'มุมบอกทิศทางของเวกเตอร์',
            titleEn: 'Direction Angles',
            latex:
              a !== null && b !== null && g !== null
                ? `\\alpha = ${fmtNum(a, 1)}^\\circ,\\; \\beta = ${fmtNum(b, 1)}^\\circ,\\; \\gamma = ${fmtNum(g, 1)}^\\circ`
                : '\\mathbf{u} = \\mathbf{0}',
          };
        }
        const dot = vecDot(dotProj.u, dotProj.v);
        const proj = vecProj(dotProj.u, dotProj.v);
        return {
          titleTh: 'ผลคูณจุด & การฉายเชิงตั้งฉาก',
          titleEn: 'Dot Product & Projection',
          latex: proj
            ? `\\mathbf{u}\\cdot\\mathbf{v} = ${fmtNum(dot)},\\quad \\operatorname{proj}_{\\mathbf{v}}\\mathbf{u} = ${fmtVecAngle(proj)}`
            : `\\mathbf{u}\\cdot\\mathbf{v} = ${fmtNum(dot)}`,
        };
      }
      if (ch1Tab === 'cross_triple') {
        if (crossTriple.subMode === 'cross') {
          const a = crossTriple.reverseOrder ? crossTriple.v : crossTriple.u;
          const b = crossTriple.reverseOrder ? crossTriple.u : crossTriple.v;
          const cross = vecCross(a, b);
          const lhs = crossTriple.reverseOrder
            ? '\\mathbf{v}\\times\\mathbf{u}'
            : '\\mathbf{u}\\times\\mathbf{v}';
          return {
            titleTh: 'ผลคูณไขว้ & พื้นที่สี่เหลี่ยมด้านขนาน',
            titleEn: 'Cross Product & Area',
            latex: `${lhs} = ${fmtVecAngle(cross)}`,
          };
        }
        const triple = scalarTriple(crossTriple.u, crossTriple.v, crossTriple.w);
        return {
          titleTh: 'ผลคูณเชิงสเกลาร์ของ 3 เวกเตอร์',
          titleEn: 'Scalar Triple Product',
          latex: `\\mathbf{u}\\cdot(\\mathbf{v}\\times\\mathbf{w}) = ${fmtNum(triple)},\\quad V = ${fmtNum(Math.abs(triple))}`,
        };
      }
      const effDir =
        lines3d.inputMode === 'two_points'
          ? vecSub(lines3d.p2, lines3d.p0)
          : lines3d.dir;
      const eqs = buildLineEquationsLatex(lines3d.p0, effDir);
      return {
        titleTh: 'สมการเส้นตรงในปริภูมิ 3 มิติ',
        titleEn: 'Line in 3D Space',
        latex: eqs.vector,
      };
    }

    if (activeChapter === 'ch3') {
      if (ch3Tab === 'level_curves') {
        const spec = MULTIVAR_FUNCS[ch3LevelCurves.funcId];
        return {
          titleTh: `เส้นชั้นระดับ: ${spec.name.th}`,
          titleEn: spec.name.en,
          latex: spec.latex(ch3LevelCurves.scaleA),
        };
      }
      if (ch3Tab === 'limits') {
        const spec = LIMIT_FUNCS[ch3Limits.funcId];
        return {
          titleTh: 'ลิมิตของฟังก์ชันสองตัวแปรเข้าใกล้ (0,0)',
          titleEn: 'Limits Along Paths',
          latex: spec.latex,
        };
      }
      if (ch3Tab === 'partials_tangent') {
        const spec = MULTIVAR_FUNCS[ch3Partials.funcId];
        const fx0 = spec.fx(ch3Partials.x0, ch3Partials.y0, 1);
        const fy0 = spec.fy(ch3Partials.x0, ch3Partials.y0, 1);
        return {
          titleTh: 'อนุพันธ์ย่อย & ระนาบสัมผัส',
          titleEn: 'Partial Derivatives & Tangent Plane',
          latex: `${spec.latex(1)},\\quad f_x = ${fmtNum(fx0)},\\; f_y = ${fmtNum(fy0)}`,
        };
      }
      if (ch3Tab === 'gradient_dir') {
        const spec = MULTIVAR_FUNCS[ch3Gradient.funcId];
        const gx = spec.fx(ch3Gradient.x0, ch3Gradient.y0, 1);
        const gy = spec.fy(ch3Gradient.x0, ch3Gradient.y0, 1);
        const rad = (ch3Gradient.thetaDeg * Math.PI) / 180;
        const duf = gx * Math.cos(rad) + gy * Math.sin(rad);
        return {
          titleTh: 'อนุพันธ์ระบุทิศ & เวกเตอร์เกรเดียนต์',
          titleEn: 'Gradient & Directional Derivative',
          latex: `\\nabla f = \\langle ${fmtNum(gx)},\\, ${fmtNum(gy)} \\rangle,\\quad D_{\\mathbf{u}}f = ${fmtNum(duf)}`,
        };
      }
      if (ch3Extrema.subMode === 'quadratic_test') {
        const cp = classifySecondDeriv(
          0,
          0,
          0,
          2 * ch3Extrema.quadA,
          2 * ch3Extrema.quadC,
          ch3Extrema.quadB,
        );
        return {
          titleTh: 'ค่าสุดขีด & การทดสอบอนุพันธ์อันดับสอง',
          titleEn: 'Second Derivative Test',
          latex: `z = ${fmtNum(ch3Extrema.quadA)}x^2 + (${fmtNum(ch3Extrema.quadB)})xy + (${fmtNum(ch3Extrema.quadC)})y^2,\\quad D = ${fmtNum(cp.dVal)}`,
        };
      }
      const exPreset = EXTREMA_PRESETS[ch3Extrema.presetFunc];
      return {
        titleTh: `จุดวิกฤต: ${exPreset.name.th}`,
        titleEn: exPreset.name.en,
        latex: exPreset.latex,
      };
    }

    if (activeTab === 'planes') {
      return {
        titleTh: 'ระนาบในปริภูมิ 3 มิติ',
        titleEn: 'Plane in 3D Space',
        latex: buildPlaneEquationLatex(planes),
      };
    }
    if (activeTab === 'cylinders') {
      const info = CYLINDER_INFO[cylinders.type];
      return {
        titleTh: info.name.th,
        titleEn: info.name.en,
        latex: buildCylinderEquationLatex(cylinders),
      };
    }
    if (activeTab === 'quadrics') {
      const info = QUADRIC_INFO[quadrics.mode];
      return {
        titleTh: info.name.th,
        titleEn: info.name.en,
        latex: buildQuadricEquationLatex(quadrics),
      };
    }
    const eqs = buildTranslationEquationsLatex(translation);
    const hideSol = translation.quizMode && !translation.quizRevealed;
    return {
      titleTh: `การย้ายแกน: ${TRANSLATION_SURFACE_NAMES[translation.surfaceType].th}`,
      titleEn: `Translation: ${TRANSLATION_SURFACE_NAMES[translation.surfaceType].en}`,
      latex: hideSol ? eqs.expanded : eqs.standard,
    };
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
  ]);

  const triggerCamera = useCallback((preset: CameraPreset) => {
    setCameraCommand((prev) => ({ preset, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const toggleSetting = (key: keyof ViewerSettings) => {
    setSettings((prev) => {
      const nextVal = !prev[key];
      if (key === 'presentationMode') {
        setSidebarOpen(!nextVal);
      }
      return { ...prev, [key]: nextVal };
    });
  };

  if (appView === 'slides') {
    return <SlidesDeck onBackToDashboard={() => setAppView('dashboard')} />;
  }

  return (
    <div className="h-dvh w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none">
      {/* Top Navbar */}
      <header className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'ซ่อนแถบควบคุม' : 'แสดงแถบควบคุม'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-600 text-white tracking-wide shrink-0">
                01417168
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                คณิตศาสตร์วิศวกรรม II (Engineering Mathematics II)
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:block">
              {activeChapter === 'ch1'
                ? 'บทที่ 1: เวกเตอร์และเส้นตรงในปริภูมิ 3 มิติ — คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์'
                : activeChapter === 'ch2'
                  ? 'บทที่ 2: การเขียนกราฟและพื้นผิวในปริภูมิ 3 มิติ — คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์'
                  : 'บทที่ 3: ลิมิตและอนุพันธ์ของฟังก์ชันหลายตัวแปร — คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์'}
            </p>
          </div>
        </div>

        {/* Chapter Switcher + Module Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 p-1 rounded-2xl shrink-0">
            {(
              [
                { id: 'ch1', label: 'บท 1: เวกเตอร์' },
                { id: 'ch2', label: 'บท 2: พื้นผิว' },
                { id: 'ch3', label: 'บท 3: อนุพันธ์หลายตัวแปร' },
              ] as const
            ).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChapter(ch.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeChapter === ch.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl overflow-x-auto max-w-full">
            {activeChapter === 'ch1'
              ? CH1_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = ch1Tab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCh1Tab(tab.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                        active
                          ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.th}</span>
                    </button>
                  );
                })
              : activeChapter === 'ch2'
                ? CH2_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                          active
                            ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tab.th}</span>
                      </button>
                    );
                  })
                : CH3_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = ch3Tab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCh3Tab(tab.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                          active
                            ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tab.th}</span>
                      </button>
                    );
                  })}
          </nav>
        </div>

        {/* Global Display Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAppView('slides')}
            title="เปิดสไลด์การสอนบทที่ 1 (พร้อม 3D, เขียนบน iPad และ Export PDF)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>สไลด์บท 1</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSetting('darkMode')}
            title={settings.darkMode ? 'โหมดสว่าง (เหมาะกับโปรเจกเตอร์)' : 'โหมดมืด (Dark Mode)'}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
          >
            {settings.darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="hidden md:inline">{settings.darkMode ? 'สว่าง' : 'มืด'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSetting('presentationMode')}
            title="โหมดสอนหน้าห้อง (Presentation Mode)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
              settings.presentationMode
                ? 'border-sky-500 bg-sky-600 text-white'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {settings.presentationMode ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden md:inline">โหมดสอน</span>
          </button>
        </div>
      </header>

      {/* Main Split Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Control Sidebar */}
        {sidebarOpen && (
          <aside className="w-full lg:w-[370px] xl:w-[400px] shrink-0 max-h-[42dvh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto overscroll-contain custom-scrollbar p-4 select-text">
            {activeChapter === 'ch1' ? (
              <>
                {ch1Tab === 'coords_vec' && (
                  <CoordsVecPanel state={coordsVec} onChange={setCoordsVec} />
                )}
                {ch1Tab === 'arithmetic' && (
                  <ArithmeticPanel state={arithmetic} onChange={setArithmetic} />
                )}
                {ch1Tab === 'dot_proj' && (
                  <DotProjPanel state={dotProj} onChange={setDotProj} />
                )}
                {ch1Tab === 'cross_triple' && (
                  <CrossTriplePanel state={crossTriple} onChange={setCrossTriple} />
                )}
                {ch1Tab === 'lines3d' && (
                  <Lines3DPanel state={lines3d} onChange={setLines3d} />
                )}
              </>
            ) : activeChapter === 'ch2' ? (
              <>
                {activeTab === 'planes' && (
                  <PlanesPanel state={planes} onChange={setPlanes} />
                )}
                {activeTab === 'cylinders' && (
                  <CylindersPanel state={cylinders} onChange={setCylinders} />
                )}
                {activeTab === 'quadrics' && (
                  <QuadricsPanel state={quadrics} onChange={setQuadrics} />
                )}
                {activeTab === 'translation' && (
                  <TranslationPanel state={translation} onChange={setTranslation} />
                )}
              </>
            ) : (
              <>
                {ch3Tab === 'level_curves' && (
                  <LevelCurvesPanel state={ch3LevelCurves} onChange={setCh3LevelCurves} />
                )}
                {ch3Tab === 'limits' && (
                  <LimitsPanel state={ch3Limits} onChange={setCh3Limits} />
                )}
                {ch3Tab === 'partials_tangent' && (
                  <PartialsTangentPanel state={ch3Partials} onChange={setCh3Partials} />
                )}
                {ch3Tab === 'gradient_dir' && (
                  <GradientDirPanel state={ch3Gradient} onChange={setCh3Gradient} />
                )}
                {ch3Tab === 'extrema' && (
                  <ExtremaPanel state={ch3Extrema} onChange={setCh3Extrema} />
                )}
              </>
            )}
          </aside>
        )}

        {/* Right 3D Interactive Canvas */}
        <main className="relative flex-1 min-h-0 overflow-hidden">
          <Scene3D
            activeChapter={activeChapter}
            ch1Tab={ch1Tab}
            coordsVec={coordsVec}
            arithmetic={arithmetic}
            dotProj={dotProj}
            crossTriple={crossTriple}
            lines3d={lines3d}
            ch3Tab={ch3Tab}
            ch3LevelCurves={ch3LevelCurves}
            ch3Limits={ch3Limits}
            ch3Partials={ch3Partials}
            ch3Gradient={ch3Gradient}
            ch3Extrema={ch3Extrema}
            activeTab={activeTab}
            planes={planes}
            cylinders={cylinders}
            quadrics={quadrics}
            translation={translation}
            traceResult={traceResult}
            settings={settings}
            cameraCommand={cameraCommand}
            onWarningChange={setSceneWarning}
          />

          {/* Floating Live KaTeX Equation Banner (Top-Left) */}
          <div
            className={`pointer-events-none absolute top-3 left-3 right-3 sm:right-auto max-w-xl transition-all ${
              settings.presentationMode ? 'sm:max-w-2xl' : ''
            }`}
          >
            <div className="pointer-events-auto inline-block max-w-full rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className="text-sky-700 dark:text-sky-300">{bannerContent.titleTh}</span>
                <span className="hidden sm:inline opacity-75">• {bannerContent.titleEn}</span>
              </div>
              <div
                className={`mt-1 overflow-x-auto overflow-y-hidden leading-normal text-slate-900 dark:text-white ${
                  settings.presentationMode ? 'text-lg sm:text-2xl py-2' : 'text-sm sm:text-base py-1'
                }`}
              >
                <KaTeX math={bannerContent.latex} />
              </div>
            </div>

            {sceneWarning && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/95 dark:bg-amber-950/90 px-3 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-200 shadow-md">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>{sceneWarning.th}</span>
              </div>
            )}
          </div>

          {/* Axis Color Legend (Top-Right) */}
          <div className="hidden sm:flex items-center gap-2.5 absolute top-3 right-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-3 py-1.5 text-[11px] font-semibold shadow-sm">
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> +x
            </span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> +y
            </span>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-500" /> +z
            </span>
          </div>

          {/* 2D Trace Card (Bottom-Right when slicing active in Chapter 2) */}
          {activeChapter === 'ch2' && activeTab === 'quadrics' && quadrics.slicingEnabled && traceResult && (
            <div className="absolute bottom-20 md:bottom-3 right-3 z-10">
              <Trace2DCard
                slicePlane={quadrics.slicePlane}
                sliceK={quadrics.sliceK}
                trace={traceResult}
              />
            </div>
          )}

          {/* 2D Contour Map Card (Bottom-Right in Chapter 3 Tab 1) */}
          {activeChapter === 'ch3' && ch3Tab === 'level_curves' && (
            <div className="absolute bottom-20 md:bottom-3 right-3 z-10">
              <Contour2DCard state={ch3LevelCurves} />
            </div>
          )}

          {/* Camera & View Toolbar (Bottom-Center or Bottom-Left) */}
          <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/90 dark:border-slate-700/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg p-1.5 text-xs">
            <div className="flex items-center gap-1 pr-1.5 border-r border-slate-200 dark:border-slate-700">
              <Compass className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
              {(
                [
                  { id: 'isometric', label: '3D Iso' },
                  { id: 'top', label: 'บน (xy)' },
                  { id: 'front', label: 'หน้า (yz)' },
                  { id: 'side', label: 'ข้าง (xz)' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => triggerCamera(cam.id)}
                  className="px-2 py-1 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:text-sky-700 dark:hover:text-sky-300 transition"
                >
                  {cam.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => toggleSetting('wireframe')}
                title="โหมดโครงลวด (Wireframe)"
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.wireframe
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">โครงลวด</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('transparent')}
                title="โปร่งแสง (Transparent)"
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.transparent
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">โปร่งแสง</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('showGrid')}
                title="แสดงตารางระนาบ xy (Grid)"
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.showGrid
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>ตาราง xy</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSetting('autoRotate')}
                title="หมุนอัตโนมัติ (Auto-rotate)"
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition ${
                  settings.autoRotate
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${settings.autoRotate ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">หมุน</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
