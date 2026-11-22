import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileDown,
  GripVertical,
  Hand,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Palette,
  PenTool,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CH1_VISIBLE_SLIDES,
  type SlideDef,
  type SlideFormulaBlock,
} from '../../slides/ch1SlidesData';
import { clearDeckInk, loadDeckInk, saveSlideInk } from '../../slides/inkStorage';
import { KaTeX } from '../KaTeX';
import { AnnotationCanvas } from './AnnotationCanvas';
import {
  isStylusTouch,
  renderStrokesToDataUrl,
  resolveSwipeDirection,
  type AnnotationTool,
  type EraserMode,
  type InkStroke,
  type LaserStyle,
  type NavDirection,
  type PrintScope,
  type ToolbarDock,
} from '../../slides/inkUtils';
import { MiniScene3D } from './MiniScene3D';
import { RichMathText } from './RichMathText';
import { SlidePrintView } from './SlidePrintView';

interface SlidesDeckProps {
  onBackToDashboard: () => void;
}

type TextScale = 'normal' | 'large' | 'xlarge';

const DECK_ID = 'ch1';
const LEGACY_INK_STORAGE_KEY = 'eng_math_2_ch1_ink_v1';

const PEN_COLORS = [
  { color: '#0f172a', label: 'ดำ' },
  { color: '#dc2626', label: 'แดง' },
  { color: '#2563eb', label: 'น้ำเงิน' },
  { color: '#059669', label: 'เขียว' },
];

const EXTENDED_PEN_COLORS = [
  { color: '#0f172a', label: 'ดำ' },
  { color: '#475569', label: 'เทาเข้ม' },
  { color: '#92400e', label: 'น้ำตาล' },
  { color: '#dc2626', label: 'แดงสด' },
  { color: '#9f1239', label: 'แดงเลือดหมู' },
  { color: '#db2777', label: 'ชมพูบานเย็น' },
  { color: '#c026d3', label: 'ม่วงแดง' },
  { color: '#7c3aed', label: 'ม่วง' },
  { color: '#4f46e5', label: 'คราม' },
  { color: '#2563eb', label: 'น้ำเงิน' },
  { color: '#0284c7', label: 'ฟ้าสด' },
  { color: '#0891b2', label: 'ฟ้าน้ำทะเล' },
  { color: '#0d9488', label: 'เขียวอมฟ้า' },
  { color: '#059669', label: 'เขียวมรกต' },
  { color: '#15803d', label: 'เขียวเข้ม' },
  { color: '#65a30d', label: 'เขียวมะกอก' },
  { color: '#d97706', label: 'ส้มอำพัน' },
  { color: '#ea580c', label: 'ส้มสด' },
];

const FONT_SCALE_MAP: Record<
  TextScale,
  {
    labelTh: string;
    title: string;
    subtitle: string;
    cardHeading: string;
    bullet: string;
    formulaLabel: string;
    formula: string;
    note: string;
    exPrompt: string;
    exLatex: string;
  }
> = {
  normal: {
    labelTh: 'ปกติ',
    title: 'text-[32px] leading-tight',
    subtitle: 'text-[18px]',
    cardHeading: 'text-[23px] leading-snug',
    bullet: 'text-[22px] leading-snug',
    formulaLabel: 'text-[18px]',
    formula: 'text-[21px]',
    note: 'text-[18px]',
    exPrompt: 'text-[23px] leading-snug',
    exLatex: 'text-[21px]',
  },
  large: {
    labelTh: 'ใหญ่ (ฉายจอ)',
    title: 'text-[36px] leading-tight',
    subtitle: 'text-[20px]',
    cardHeading: 'text-[26px] leading-snug',
    bullet: 'text-[25px] leading-snug',
    formulaLabel: 'text-[20px]',
    formula: 'text-[24px]',
    note: 'text-[20px]',
    exPrompt: 'text-[26px] leading-snug',
    exLatex: 'text-[24px]',
  },
  xlarge: {
    labelTh: 'ใหญ่มาก',
    title: 'text-[42px] leading-tight',
    subtitle: 'text-[22px]',
    cardHeading: 'text-[29px] leading-snug',
    bullet: 'text-[28px] leading-snug',
    formulaLabel: 'text-[22px]',
    formula: 'text-[26px]',
    note: 'text-[22px]',
    exPrompt: 'text-[29px] leading-snug',
    exLatex: 'text-[26px]',
  },
};

function toneClasses(tone?: SlideFormulaBlock['tone']): string {
  switch (tone) {
    case 'sky':
      return 'bg-sky-50/90 border-sky-200 text-sky-950';
    case 'emerald':
      return 'bg-emerald-50/90 border-emerald-200 text-emerald-950';
    case 'amber':
      return 'bg-amber-50/90 border-amber-200 text-amber-950';
    case 'rose':
      return 'bg-rose-50/90 border-rose-200 text-rose-950';
    default:
      return 'bg-white border-slate-200 text-slate-900';
  }
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const NAV_DIR_STORAGE_KEY = 'eng_math_2_nav_dir';
const TOOLBAR_POS_STORAGE_KEY = 'eng_math_2_toolbar_pos';

export function SlidesDeck({ onBackToDashboard }: SlidesDeckProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('large');
  const [navDirection, setNavDirection] = useState<NavDirection>(() => {
    try {
      const saved = window.localStorage.getItem(NAV_DIR_STORAGE_KEY);
      return saved === 'vertical' ? 'vertical' : 'horizontal';
    } catch {
      return 'horizontal';
    }
  });
  const [toolbarPos, setToolbarPos] = useState<ToolbarDock>(() => {
    try {
      const saved = window.localStorage.getItem(TOOLBAR_POS_STORAGE_KEY);
      if (saved === 'top' || saved === 'bottom' || saved === 'left' || saved === 'right') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'bottom';
  });
  const [customToolbarPos, setCustomToolbarPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const raw = window.localStorage.getItem('eng_math_2_toolbar_custom_pos');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown };
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return { x: parsed.x, y: parsed.y };
      }
    } catch {
      // ignore storage errors
    }
    return null;
  });
  const [stageScale, setStageScale] = useState(1);
  const stageWrapperRef = useRef<HTMLElement | null>(null);
  const slideBodyRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const stageSwipeRef = useRef<{
    x: number;
    y: number;
    t: number;
    scrollTop: number;
  } | null>(null);
  const wheelCooldownRef = useRef(0);

  // Annotation / Apple Pencil state
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [pencilOnly, setPencilOnly] = useState(true);
  const [penColor, setPenColor] = useState('#2563eb');
  const [penWidth, setPenWidth] = useState(4);
  const [eraserSize, setEraserSize] = useState(6);
  const [eraserMode, setEraserMode] = useState<EraserMode>('partial');
  const [toolMode, setToolMode] = useState<AnnotationTool>('pen');
  const [laserStyle, setLaserStyle] = useState<LaserStyle>('trail');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [strokesBySlide, setStrokesBySlide] = useState<Record<number, InkStroke[]>>({});
  const strokesRef = useRef<Record<number, InkStroke[]>>({});
  const undoHistoryRef = useRef<Record<number, InkStroke[][]>>({});
  const [undoCountBySlide, setUndoCountBySlide] = useState<Record<number, number>>({});

  // PDF Export state
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportScope, setExportScope] = useState<PrintScope>('all');
  const [printIncludeInk, setPrintIncludeInk] = useState(false);
  const [inkImagesBySlide, setInkImagesBySlide] = useState<Record<number, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadDeckInk(DECK_ID, LEGACY_INK_STORAGE_KEY).then((loaded) => {
      if (cancelled) return;
      const preHydration = strokesRef.current;
      const merged: Record<number, InkStroke[]> = { ...loaded };
      for (const [k, preList] of Object.entries(preHydration)) {
        const sId = Number(k);
        if (Number.isFinite(sId) && Array.isArray(preList) && preList.length > 0) {
          merged[sId] = [...(loaded[sId] ?? []), ...preList];
          void saveSlideInk(DECK_ID, sId, merged[sId], LEGACY_INK_STORAGE_KEY);
        }
      }
      strokesRef.current = merged;
      setStrokesBySlide(merged);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSlides = CH1_VISIBLE_SLIDES.length;
  const safeSlideIdx = Math.min(slideIdx, Math.max(0, totalSlides - 1));
  const slide: SlideDef = CH1_VISIBLE_SLIDES[safeSlideIdx];
  const lecture2StartIdx = CH1_VISIBLE_SLIDES.findIndex((s) => s.lecture === 2);
  const lecture1EndPage = lecture2StartIdx > 0 ? lecture2StartIdx : totalSlides;
  const fs = FONT_SCALE_MAP[textScale];

  useEffect(() => {
    try {
      window.localStorage.setItem(NAV_DIR_STORAGE_KEY, navDirection);
    } catch {
      // ignore storage errors
    }
  }, [navDirection]);

  useEffect(() => {
    try {
      window.localStorage.setItem(TOOLBAR_POS_STORAGE_KEY, toolbarPos);
    } catch {
      // ignore storage errors
    }
  }, [toolbarPos]);

  useEffect(() => {
    try {
      if (customToolbarPos) {
        window.localStorage.setItem(
          'eng_math_2_toolbar_custom_pos',
          JSON.stringify(customToolbarPos),
        );
      } else {
        window.localStorage.removeItem('eng_math_2_toolbar_custom_pos');
      }
    } catch {
      // ignore storage errors
    }
  }, [customToolbarPos]);

  useEffect(() => {
    const el = stageWrapperRef.current;
    if (!el) return;
    const updateScale = () => {
      const style = window.getComputedStyle(el);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const availW = Math.max(240, el.clientWidth - padX);
      const availH = Math.max(180, el.clientHeight - padY);
      const next = Math.max(0.2, Math.min(availW / STAGE_WIDTH, availH / STAGE_HEIGHT));
      setStageScale(next);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [overviewOpen]);

  const goPrev = useCallback(() => {
    setExportMenuOpen(false);
    setColorPickerOpen(false);
    setSlideIdx((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setExportMenuOpen(false);
    setColorPickerOpen(false);
    setSlideIdx((i) => Math.min(totalSlides - 1, i + 1));
  }, [totalSlides]);

  useEffect(() => {
    const syncFullscreen = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const rootEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      } else if (rootEl.requestFullscreen) {
        await rootEl.requestFullscreen();
      } else if (rootEl.webkitRequestFullscreen) {
        await rootEl.webkitRequestFullscreen();
      }
    } catch {
      // Ignore if fullscreen is blocked or unsupported
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportMenuOpen(false);
        setColorPickerOpen(false);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        goPrev();
      } else if (navDirection === 'vertical' && (e.key === 'ArrowDown' || e.key === 'PageDown')) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        goNext();
      } else if (navDirection === 'vertical' && (e.key === 'ArrowUp' || e.key === 'PageUp')) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        goPrev();
      } else if (e.key === 'w' || e.key === 'W') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        setDrawEnabled((prevDraw) => {
          if (prevDraw) {
            setColorPickerOpen(false);
            return false;
          }
          setToolMode('pen');
          return true;
        });
      } else if (e.key === 'l' || e.key === 'L') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        setDrawEnabled((prevDraw) => {
          if (prevDraw && toolMode === 'laser') {
            return false;
          }
          setToolMode('laser');
          return true;
        });
      } else if (e.key === 'f' || e.key === 'F') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, navDirection, toggleFullscreen, toolMode]);

  const updateSlideStrokes = useCallback(
    (
      slideId: number,
      updater: (prevList: InkStroke[]) => InkStroke[],
      recordHistory = true,
    ) => {
      const prevList = strokesRef.current[slideId] ?? [];
      const nextList = updater(prevList);
      if (nextList === prevList) return;
      if (recordHistory) {
        const prevHistory = undoHistoryRef.current[slideId] ?? [];
        const nextHistory = [...prevHistory, prevList].slice(-40);
        undoHistoryRef.current[slideId] = nextHistory;
        setUndoCountBySlide((prev) => ({ ...prev, [slideId]: nextHistory.length }));
      }
      const nextMap = { ...strokesRef.current, [slideId]: nextList };
      strokesRef.current = nextMap;
      setStrokesBySlide(nextMap);
      void saveSlideInk(DECK_ID, slideId, nextList, LEGACY_INK_STORAGE_KEY);
    },
    [],
  );

  const handleAddStroke = (stroke: InkStroke) => {
    updateSlideStrokes(slide.id, (prev) => [...prev, stroke]);
  };

  const handleEraseStrokes = (remainingStrokes: InkStroke[]) => {
    updateSlideStrokes(slide.id, () => remainingStrokes);
  };

  const handleUndoStroke = () => {
    const stack = undoHistoryRef.current[slide.id] ?? [];
    if (stack.length > 0) {
      const restored = stack[stack.length - 1];
      const nextStack = stack.slice(0, -1);
      undoHistoryRef.current[slide.id] = nextStack;
      setUndoCountBySlide((prev) => ({ ...prev, [slide.id]: nextStack.length }));
      updateSlideStrokes(slide.id, () => restored, false);
      return;
    }
    updateSlideStrokes(slide.id, (prev) => (prev.length === 0 ? prev : prev.slice(0, -1)), false);
  };

  const handleClearSlideInk = () => {
    updateSlideStrokes(slide.id, () => []);
  };

  const handleClearAllInk = () => {
    if (window.confirm('ต้องการล้างลายมือที่เขียนไว้ทั้งหมดทุกหน้าหรือไม่?')) {
      undoHistoryRef.current = {};
      setUndoCountBySlide({});
      strokesRef.current = {};
      setStrokesBySlide({});
      void clearDeckInk(DECK_ID, LEGACY_INK_STORAGE_KEY);
    }
  };

  const stepTextScaleDown = () => {
    setTextScale((s) => (s === 'xlarge' ? 'large' : s === 'large' ? 'normal' : 'normal'));
  };

  const stepTextScaleUp = () => {
    setTextScale((s) => (s === 'normal' ? 'large' : s === 'large' ? 'xlarge' : 'xlarge'));
  };

  const scopedSlides =
    exportScope === 'lec1'
      ? CH1_VISIBLE_SLIDES.filter((s) => s.lecture === 1)
      : exportScope === 'lec2'
        ? CH1_VISIBLE_SLIDES.filter((s) => s.lecture === 2)
        : CH1_VISIBLE_SLIDES;

  useEffect(() => {
    if (slideBodyRef.current) {
      slideBodyRef.current.scrollTop = 0;
    }
  }, [safeSlideIdx]);

  const handleStageTouchStart = (e: ReactTouchEvent<HTMLElement>) => {
    if (drawEnabled && !pencilOnly) {
      stageSwipeRef.current = null;
      return;
    }
    if (e.touches?.length !== 1) {
      stageSwipeRef.current = null;
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-scene-3d],[data-floating-toolbar],button,input,a,label')) {
      stageSwipeRef.current = null;
      return;
    }
    const touch = e.touches[0] as Touch & { touchType?: string };
    if (isStylusTouch(touch)) {
      stageSwipeRef.current = null;
      return;
    }
    stageSwipeRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      t: performance.now(),
      scrollTop: slideBodyRef.current?.scrollTop ?? 0,
    };
  };

  const handleStageTouchMove = (e: ReactTouchEvent<HTMLElement>) => {
    if (e.touches?.length !== 1) {
      stageSwipeRef.current = null;
    }
  };

  const handleStageTouchEnd = (e: ReactTouchEvent<HTMLElement>) => {
    const start = stageSwipeRef.current;
    stageSwipeRef.current = null;
    if (!start || e.changedTouches?.length !== 1) return;
    if (drawEnabled && !pencilOnly) return;
    const ct = e.changedTouches[0] as Touch & { touchType?: string };
    if (isStylusTouch(ct)) return;
    if (performance.now() - start.t > 900) return;

    const body = slideBodyRef.current;
    const didBodyScroll = body ? Math.abs(body.scrollTop - start.scrollTop) > 4 : false;
    if (navDirection === 'vertical' && didBodyScroll) return;

    const dir = resolveSwipeDirection(ct.clientX - start.x, ct.clientY - start.y, navDirection);
    if (dir === 'next') goNext();
    else if (dir === 'prev') goPrev();
  };

  const handleStageWheel = (e: ReactWheelEvent<HTMLElement>) => {
    if (navDirection !== 'vertical') return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('[data-scene-3d],[data-floating-toolbar]')) return;
    if (Math.abs(e.deltaY) < 24 || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;

    const body = slideBodyRef.current;
    if (body && body.scrollHeight > body.clientHeight + 2) {
      if (e.deltaY > 0 && body.scrollTop + body.clientHeight < body.scrollHeight - 2) return;
      if (e.deltaY < 0 && body.scrollTop > 2) return;
    }

    const now = performance.now();
    if (now - wheelCooldownRef.current < 300) return;
    wheelCooldownRef.current = now;
    if (e.deltaY > 0) goNext();
    else goPrev();
  };

  const exitFullscreenBeforePrint = async () => {
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
      return;
    }
    await new Promise<void>((resolve) => {
      let done = false;
      let timer = 0;
      const finish = () => {
        if (done) return;
        done = true;
        document.removeEventListener('fullscreenchange', onChange);
        document.removeEventListener('webkitfullscreenchange', onChange);
        window.clearTimeout(timer);
        // Let iPadOS / browser exit-fullscreen animation settle before opening Print/Share sheet
        window.setTimeout(resolve, 150);
      };
      const onChange = () => {
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
          finish();
        }
      };
      timer = window.setTimeout(finish, 450);
      document.addEventListener('fullscreenchange', onChange);
      document.addEventListener('webkitfullscreenchange', onChange);
      try {
        const result = doc.exitFullscreen
          ? doc.exitFullscreen()
          : doc.webkitExitFullscreen?.();
        if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>).catch(() => {
            finish();
          });
        }
      } catch {
        finish();
      }
    });
  };

  const triggerExportPdf = async (withInk: boolean) => {
    setExportMenuOpen(false);
    if (withInk) {
      const generated: Record<number, string> = {};
      for (const s of scopedSlides) {
        const list = strokesBySlide[s.id];
        if (list && list.length > 0) {
          const url = renderStrokesToDataUrl(list, 1920, 1080);
          if (url) generated[s.id] = url;
        }
      }
      setInkImagesBySlide(generated);
      setPrintIncludeInk(true);
    } else {
      setPrintIncludeInk(false);
    }
    await exitFullscreenBeforePrint();
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 180);
    });
  };

  const currentStrokes = strokesBySlide[slide.id] ?? [];
  const canUndo = (undoCountBySlide[slide.id] ?? 0) > 0 || currentStrokes.length > 0;
  const annotatedSlideCount = Object.values(strokesBySlide).filter(
    (list) => Array.isArray(list) && list.length > 0,
  ).length;
  const scopedAnnotatedCount = scopedSlides.filter(
    (s) => (strokesBySlide[s.id]?.length ?? 0) > 0,
  ).length;

  return (
    <>
      <div className="print:hidden h-dvh w-screen overflow-hidden flex flex-col bg-slate-100 text-slate-900 select-none">
        {/* Top Control Bar */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-1 z-30">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[15px] font-bold text-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">3D Dashboard</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[14px] font-semibold">
              <button
                type="button"
                onClick={() => setSlideIdx(0)}
                className={`px-2 py-1 rounded-lg transition ${
                  slide.lecture === 1 ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                คาบ 1 (1–{lecture1EndPage})
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx(lecture2StartIdx >= 0 ? lecture2StartIdx : 0)}
                className={`px-2 py-1 rounded-lg transition ${
                  slide.lecture === 2 ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                คาบ 2 ({lecture1EndPage + 1}–{totalSlides})
              </button>
            </div>
          </div>

          {/* Always-Accessible Top Bar Prev / Page / Next Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeSlideIdx === 0}
              aria-label="หน้าก่อนหน้า"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[15px] font-bold text-slate-700 disabled:opacity-40 shadow-xs transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>
            <div className="px-2 text-[15px] font-mono font-bold text-slate-700">
              หน้า {safeSlideIdx + 1} / {totalSlides}
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={safeSlideIdx === totalSlides - 1}
              aria-label="หน้าถัดไป"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[15px] font-bold disabled:opacity-40 shadow-sm transition"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {/* Projector Text Size Control */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[14px] font-bold"
              title="ปรับขนาดตัวอักษรสำหรับฉายขึ้นจอ"
            >
              <button
                type="button"
                onClick={stepTextScaleDown}
                disabled={textScale === 'normal'}
                aria-label="ลดขนาดตัวอักษร"
                className="px-2 py-0.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 transition"
              >
                ก-
              </button>
              <span className="hidden 2xl:inline px-1.5 text-[13px] font-semibold text-slate-500">
                {fs.labelTh}
              </span>
              <button
                type="button"
                onClick={stepTextScaleUp}
                disabled={textScale === 'xlarge'}
                aria-label="เพิ่มขนาดตัวอักษร"
                className="px-2 py-0.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 transition"
              >
                ก+
              </button>
            </div>

            {/* Slide Navigation Direction Toggle (Horizontal / Vertical) */}
            <button
              type="button"
              onClick={() =>
                setNavDirection((d) => (d === 'horizontal' ? 'vertical' : 'horizontal'))
              }
              title={
                navDirection === 'horizontal'
                  ? 'โหมดปัด/เลื่อนแนวนอน (ปัดซ้าย = ถัดไป, ปัดขวา = ก่อนหน้า) — กดเพื่อสลับเป็นแนวตั้ง'
                  : 'โหมดปัด/เลื่อนแนวตั้ง (ปัดขึ้น/หมุนลง = ถัดไป) — กดเพื่อสลับเป็นแนวนอน'
              }
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[14px] font-bold transition ${
                navDirection === 'vertical'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {navDirection === 'horizontal' ? (
                <>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">แนวนอน</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">แนวตั้ง</span>
                </>
              )}
            </button>

            {/* Laser Pointer Toggle (Hotkey: L) */}
            <button
              type="button"
              onClick={() => {
                if (drawEnabled && toolMode === 'laser') {
                  setDrawEnabled(false);
                } else {
                  setDrawEnabled(true);
                  setToolMode('laser');
                }
              }}
              title="ชี้จุดสนใจด้วยเลเซอร์สีแดง (คีย์ลัด L)"
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[15px] font-bold transition ${
                drawEnabled && toolMode === 'laser'
                  ? 'border-red-600 bg-red-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:border-red-200'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  drawEnabled && toolMode === 'laser'
                    ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.95)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.85)]'
                }`}
              />
              <span>{drawEnabled && toolMode === 'laser' ? 'ปิดเลเซอร์' : 'เลเซอร์'}</span>
            </button>

            {/* Apple Pencil / Draw Overlay Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!drawEnabled) {
                  setDrawEnabled(true);
                  setToolMode('pen');
                } else if (toolMode === 'laser') {
                  setToolMode('pen');
                } else {
                  setDrawEnabled(false);
                  setColorPickerOpen(false);
                }
              }}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[15px] font-bold transition ${
                drawEnabled && toolMode !== 'laser'
                  ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>
                {!drawEnabled ? 'เขียน' : toolMode === 'laser' ? 'ปากกา' : 'ปิดปากกา'}
              </span>
            </button>

            {/* Overview Toggle */}
            <button
              type="button"
              onClick={() => setOverviewOpen((o) => !o)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[15px] font-semibold transition ${
                overviewOpen
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">สารบัญ</span>
            </button>

            {/* Export PDF Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setColorPickerOpen(false);
                  setExportMenuOpen((o) => !o);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white text-[15px] font-bold shadow-sm transition"
              >
                <FileDown className="w-4 h-4" />
                <span>Export PDF</span>
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl p-2.5 z-50 text-xs sm:text-sm space-y-2">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 px-1 mb-1">
                      เลือกช่วงสไลด์ที่จะส่งออก:
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setExportScope('all')}
                        className={`px-1.5 py-1.5 rounded-lg transition ${
                          exportScope === 'all'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ทั้งหมด (1–{totalSlides})
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportScope('lec1')}
                        className={`px-1.5 py-1.5 rounded-lg transition ${
                          exportScope === 'lec1'
                            ? 'bg-white text-sky-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        คาบ 1 (1–{lecture1EndPage})
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportScope('lec2')}
                        className={`px-1.5 py-1.5 rounded-lg transition ${
                          exportScope === 'lec2'
                            ? 'bg-white text-sky-700 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        คาบ 2 ({lecture1EndPage + 1}–{totalSlides})
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void triggerExportPdf(true)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-slate-800 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-900">PDF รวมลายมือที่เขียน</span>
                      {scopedAnnotatedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          มีลายมือ {scopedAnnotatedCount} หน้า
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      ส่งออก {scopedSlides.length} หน้าพร้อมสิ่งที่เขียนบนหน้าจอ
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void triggerExportPdf(false)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-800 transition"
                  >
                    <div className="font-bold text-slate-800">PDF สไลด์เปล่า (GoodNotes)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ส่งออก {scopedSlides.length} หน้าเป็นช่องตารางจุด 16:9 ยังไม่มีลายมือ
                    </div>
                  </button>

                  <div className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] leading-snug text-amber-900">
                    ตั้งค่าเริ่มต้นเป็นแนวนอน (A4 Landscape) แล้ว — บน iPad/Safari
                    หากหน้าตัวอย่างขึ้นแนวตั้งสามารถกดสลับเป็นแนวนอนได้
                    (และแม้ไม่สลับ สไลด์จะย่อพอดีกรอบไม่ตกขอบ)
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
              title={isFullscreen ? 'ออกจากเต็มจอ (F)' : 'ขยายเต็มจอ (F)'}
              className={`inline-flex items-center justify-center p-1.5 rounded-xl border transition ${
                isFullscreen
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Main Stage */}
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
          {/* Overview Drawer */}
          {overviewOpen && (
            <aside className="w-76 shrink-0 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-3 space-y-1.5 z-30">
              <div className="text-xs sm:text-sm font-bold text-slate-600 px-1 pb-1">
                สารบัญสไลด์บทที่ 1 ({totalSlides} หน้า)
              </div>
              {CH1_VISIBLE_SLIDES.map((s, idx) => {
                const hasInk = (strokesBySlide[s.id]?.length ?? 0) > 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSlideIdx(idx);
                      setOverviewOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl border text-xs sm:text-sm transition ${
                      idx === safeSlideIdx
                        ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] opacity-75">
                      <span>
                        หน้า {idx + 1} • คาบ {s.lecture}
                      </span>
                      <span className="flex items-center gap-1">
                        {hasInk && (
                          <span
                            title="มีลายมือที่เขียนไว้"
                            className="inline-block w-2 h-2 rounded-full bg-amber-500"
                          />
                        )}
                        <span>
                          {s.kind === 'example'
                            ? 'โจทย์'
                            : s.embed3D
                              ? '3D'
                              : 'เนื้อหา'}
                        </span>
                      </span>
                    </div>
                    <div className="truncate mt-0.5">{s.titleTh}</div>
                  </button>
                );
              })}
            </aside>
          )}

          {/* Slide Canvas Container */}
          <main
            ref={stageWrapperRef}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            onTouchEnd={handleStageTouchEnd}
            onWheel={handleStageWheel}
            className="slide-stage-wrapper flex-1 min-h-0 p-2 sm:p-3 flex items-center justify-center overflow-hidden relative"
          >
            {/* Floating Quick-Toggle when NOT in Write mode (zero layout shift) */}
            {!drawEnabled && (
              <div
                data-floating-toolbar="true"
                className="absolute bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setDrawEnabled(true);
                    setToolMode('pen');
                  }}
                  title="เข้าสู่โหมดเขียน (คีย์ลัด W)"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition active:scale-95"
                >
                  <PenTool className="w-4 h-4" />
                  <span>เขียน</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawEnabled(true);
                    setToolMode('laser');
                  }}
                  title="เปิดเลเซอร์ชี้จุด (คีย์ลัด L)"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold transition active:scale-95"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.85)]" />
                  <span>เลเซอร์</span>
                </button>
              </div>
            )}

            {/* Floating Repositionable Write Toolbar when Write/Laser mode is active (zero layout shift) */}
            {drawEnabled && (() => {
              const isVertBar = toolbarPos === 'left' || toolbarPos === 'right';
              const dockPosClass = customToolbarPos
                ? isVertBar
                  ? 'flex-col items-stretch'
                  : 'max-w-[96%] flex-row flex-wrap items-center'
                : toolbarPos === 'top'
                  ? 'top-2.5 left-1/2 -translate-x-1/2 max-w-[96%] flex-row flex-wrap items-center'
                  : toolbarPos === 'bottom'
                    ? 'bottom-2.5 left-1/2 -translate-x-1/2 max-w-[96%] flex-row flex-wrap items-center'
                    : toolbarPos === 'left'
                      ? 'left-2.5 top-1/2 -translate-y-1/2 flex-col items-stretch'
                      : 'right-2.5 top-1/2 -translate-y-1/2 flex-col items-stretch';
              const palettePopoverPosClass = customToolbarPos
                ? customToolbarPos.y > STAGE_HEIGHT * stageScale * 0.5
                  ? 'bottom-full mb-2 left-0'
                  : 'top-full mt-2 left-0'
                : toolbarPos === 'bottom'
                  ? 'bottom-full mb-2 left-0'
                  : toolbarPos === 'top'
                    ? 'top-full mt-2 left-0'
                    : toolbarPos === 'left'
                      ? 'left-full ml-2 top-0'
                      : 'right-full mr-2 top-0';

              const handleToolbarPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
                const target = e.target as HTMLElement | null;
                if (
                  !target?.closest('[data-toolbar-drag="true"]') &&
                  target?.closest('button,input,label')
                ) {
                  return;
                }
                const parent = stageWrapperRef.current;
                const bar = toolbarRef.current;
                if (!parent || !bar) return;
                e.preventDefault();
                e.stopPropagation();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // ignore capture failure
                }
                const parentRect = parent.getBoundingClientRect();
                const barRect = bar.getBoundingClientRect();
                toolbarDragRef.current = {
                  pointerId: e.pointerId,
                  startX: e.clientX,
                  startY: e.clientY,
                  origX: barRect.left - parentRect.left,
                  origY: barRect.top - parentRect.top,
                };
              };

              const handleToolbarPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
                const drag = toolbarDragRef.current;
                if (!drag || drag.pointerId !== e.pointerId) return;
                const parent = stageWrapperRef.current;
                const bar = toolbarRef.current;
                if (!parent || !bar) return;
                e.preventDefault();
                const parentRect = parent.getBoundingClientRect();
                const barRect = bar.getBoundingClientRect();
                const nextX = Math.max(
                  8,
                  Math.min(parentRect.width - barRect.width - 8, drag.origX + (e.clientX - drag.startX)),
                );
                const nextY = Math.max(
                  8,
                  Math.min(parentRect.height - barRect.height - 8, drag.origY + (e.clientY - drag.startY)),
                );
                setCustomToolbarPos({ x: Math.round(nextX), y: Math.round(nextY) });
              };

              const handleToolbarPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
                if (toolbarDragRef.current?.pointerId !== e.pointerId) return;
                toolbarDragRef.current = null;
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                } catch {
                  // ignore release failure
                }
              };

              return (
                <div
                  ref={toolbarRef}
                  data-floating-toolbar="true"
                  onPointerDown={handleToolbarPointerDown}
                  onPointerMove={handleToolbarPointerMove}
                  onPointerUp={handleToolbarPointerEnd}
                  onPointerCancel={handleToolbarPointerEnd}
                  style={
                    customToolbarPos
                      ? { left: customToolbarPos.x, top: customToolbarPos.y }
                      : undefined
                  }
                  className={`absolute z-40 rounded-xl border border-amber-300 bg-amber-50/95 backdrop-blur-md p-[4px] shadow-xl flex gap-[4px] text-[13px] touch-none ${dockPosClass}`}
                >
                  {/* Drag Handle (Finger / Apple Pencil / Mouse) */}
                  <div
                    data-toolbar-drag="true"
                    title="ลากด้วยนิ้ว ปากกา หรือเมาส์ เพื่อย้ายตำแหน่งแถบเครื่องมือ"
                    className={`inline-flex items-center justify-center rounded-[8px] text-amber-700 hover:bg-amber-100 cursor-grab active:cursor-grabbing touch-none ${
                      isVertBar ? 'py-[3px] border-b border-amber-200/80' : 'px-[3px]'
                    }`}
                  >
                    <GripVertical className={`w-4 h-4 ${isVertBar ? 'rotate-90' : ''}`} />
                  </div>
                  {/* Prominent 1-tap Exit Write Mode button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDrawEnabled(false);
                      setColorPickerOpen(false);
                    }}
                    title="สลับกลับไปโหมดดูอย่างเดียว (คีย์ลัด W)"
                    className="inline-flex items-center justify-center gap-1 px-[8px] py-[3px] rounded-[8px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>เสร็จ</span>
                  </button>

                  {/* Color Swatches + Palette */}
                  <div
                    className={`flex items-center gap-[4px] ${
                      isVertBar
                        ? 'grid grid-cols-2 py-[3px] border-y border-amber-200/80 justify-items-center'
                        : 'pl-[5px] border-l border-amber-200'
                    }`}
                  >
                    {PEN_COLORS.map((c) => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => {
                          setToolMode('pen');
                          setPenColor(c.color);
                          setColorPickerOpen(false);
                        }}
                        title={c.label}
                        className={`w-[22px] h-[22px] rounded-full border-2 transition ${
                          toolMode === 'pen' && penColor === c.color
                            ? 'border-amber-600 scale-110 shadow'
                            : 'border-white'
                        }`}
                        style={{ backgroundColor: c.color }}
                      />
                    ))}

                    <div className={`relative ${isVertBar ? 'col-span-2 w-full' : ''}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setExportMenuOpen(false);
                          setColorPickerOpen((o) => !o);
                        }}
                        title="เลือกสีปากกาเพิ่มเติมหรือกำหนดสีเอง"
                        className={`inline-flex items-center justify-center gap-1 px-[6px] py-[3px] rounded-[8px] font-semibold border transition ${
                          isVertBar ? 'w-full' : ''
                        } ${
                          colorPickerOpen ||
                          (toolMode === 'pen' && !PEN_COLORS.some((c) => c.color === penColor))
                            ? 'border-amber-600 bg-amber-100 text-amber-950 shadow-xs'
                            : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-50'
                        }`}
                      >
                        <Palette className="w-3 h-3" />
                        <span
                          className="w-[10px] h-[10px] rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: penColor }}
                        />
                        <span>สีเพิ่ม</span>
                      </button>

                      {colorPickerOpen && (
                        <div
                          className={`absolute ${palettePopoverPosClass} w-64 rounded-2xl border border-slate-200 bg-white shadow-xl p-3 z-50 space-y-2.5`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>เลือกสีปากกา</span>
                            <span className="font-mono text-[11px] uppercase text-slate-500">
                              {penColor}
                            </span>
                          </div>

                          <div className="grid grid-cols-6 gap-2">
                            {EXTENDED_PEN_COLORS.map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                  setToolMode('pen');
                                  setPenColor(c.color);
                                  setColorPickerOpen(false);
                                }}
                                title={c.label}
                                aria-label={`เลือกสี${c.label}`}
                                className={`w-7 h-7 rounded-full border-2 transition ${
                                  toolMode === 'pen' && penColor === c.color
                                    ? 'border-slate-900 scale-110 shadow'
                                    : 'border-white shadow-xs hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.color }}
                              />
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                            <label
                              htmlFor="custom-pen-color"
                              className="text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              เลือกสีอิสระ:
                            </label>
                            <input
                              id="custom-pen-color"
                              type="color"
                              value={penColor}
                              onChange={(e) => {
                                setToolMode('pen');
                                setPenColor(e.target.value);
                              }}
                              className="h-7 w-14 rounded border border-slate-200 bg-white cursor-pointer"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stroke / Eraser widths */}
                  <div
                    className={`flex items-center gap-[3px] ${
                      isVertBar ? 'justify-center' : 'pl-[5px] border-l border-amber-200'
                    }`}
                    title={toolMode === 'eraser' ? 'ปรับขนาดยางลบ' : 'ปรับขนาดหัวปากกา'}
                  >
                    {(toolMode === 'eraser' ? [3, 6, 11] : [2, 4, 7]).map((w, idx) => {
                      const label =
                        idx === 0 ? 'เล็ก' : idx === 1 ? 'กลาง' : toolMode === 'eraser' ? 'ใหญ่' : 'หนา';
                      const isSelected =
                        toolMode === 'eraser'
                          ? eraserSize === w
                          : toolMode === 'pen' && penWidth === w;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            if (toolMode === 'eraser') {
                              setEraserSize(w);
                            } else {
                              setToolMode('pen');
                              setPenWidth(w);
                            }
                          }}
                          className={`px-[6px] py-[3px] rounded-[7px] font-semibold border transition ${
                            isSelected
                              ? toolMode === 'eraser'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-amber-600 text-white border-amber-600'
                              : 'bg-white text-slate-700 border-amber-200'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Eraser + Laser */}
                  <div className={`flex items-center gap-[3px] ${isVertBar ? 'flex-col items-stretch' : ''}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setColorPickerOpen(false);
                        setToolMode((m) => (m === 'eraser' ? 'pen' : 'eraser'));
                      }}
                      className={`inline-flex items-center justify-center gap-1 px-[7px] py-[3px] rounded-[7px] font-semibold border ${
                        toolMode === 'eraser'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-white text-slate-700 border-amber-200'
                      }`}
                    >
                      <Eraser className="w-3 h-3" /> ยางลบ
                    </button>
                    {toolMode === 'eraser' && (
                      <div className="inline-flex items-center justify-center rounded-[7px] border border-rose-200 bg-white p-[2px] text-[12px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setEraserMode('partial')}
                          title="ลบเฉพาะบริเวณที่หัวยางลบลากผ่าน"
                          className={`px-[6px] py-[2px] rounded-[5px] transition ${
                            eraserMode === 'partial'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          บางส่วน
                        </button>
                        <button
                          type="button"
                          onClick={() => setEraserMode('stroke')}
                          title="แตะหรือลากผ่านเส้นไหน จะลบออกทั้งเส้น"
                          className={`px-[6px] py-[2px] rounded-[5px] transition ${
                            eraserMode === 'stroke'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          ทั้งเส้น
                        </button>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setColorPickerOpen(false);
                        setToolMode((m) => (m === 'laser' ? 'pen' : 'laser'));
                      }}
                      className={`inline-flex items-center justify-center gap-1 px-[7px] py-[3px] rounded-[7px] font-semibold border transition ${
                        toolMode === 'laser'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          toolMode === 'laser' ? 'bg-white' : 'bg-red-500'
                        }`}
                      />
                      เลเซอร์
                    </button>
                    {toolMode === 'laser' && (
                      <div className="inline-flex items-center justify-center rounded-[7px] border border-red-200 bg-white p-[2px] text-[12px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setLaserStyle('trail')}
                          title="วงหรือขีดค้างไว้ได้หลายจุด แล้วค่อยๆ จางหายหมดใน 1.5 วิ"
                          className={`px-[6px] py-[2px] rounded-[5px] transition ${
                            laserStyle === 'trail'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-red-700 hover:bg-red-50'
                          }`}
                        >
                          วง/ขีดค้าง
                        </button>
                        <button
                          type="button"
                          onClick={() => setLaserStyle('dot')}
                          title="เลเซอร์จุดสีแดง ไม่มีหาง ลอยตามหัวปากกา"
                          className={`px-[6px] py-[2px] rounded-[5px] transition ${
                            laserStyle === 'dot'
                              ? 'bg-red-600 text-white shadow-xs'
                              : 'text-red-700 hover:bg-red-50'
                          }`}
                        >
                          จุดชี้
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Palm Rejection Toggle */}
                  <button
                    type="button"
                    onClick={() => setPencilOnly((p) => !p)}
                    title="สลับระหว่างเฉพาะ Apple Pencil/เมาส์ (กันฝ่ามือ) กับอนุญาตนิ้ววาดด้วย"
                    className={`inline-flex items-center justify-center gap-1 px-[7px] py-[3px] rounded-[7px] font-semibold border transition ${
                      pencilOnly
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {pencilOnly ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>เฉพาะปากกา</span>
                      </>
                    ) : (
                      <>
                        <Hand className="w-3.5 h-3.5" />
                        <span>นิ้ว+ปากกา</span>
                      </>
                    )}
                  </button>

                  {/* Undo / Clear */}
                  <div className={`flex items-center gap-[3px] ${isVertBar ? 'flex-col items-stretch' : ''}`}>
                    <button
                      type="button"
                      onClick={handleUndoStroke}
                      disabled={!canUndo}
                      className="inline-flex items-center justify-center gap-1 px-[6px] py-[3px] rounded-[7px] border border-amber-200 bg-white text-slate-700 font-semibold disabled:opacity-40"
                    >
                      <RotateCcw className="w-3 h-3" /> ย้อน
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSlideInk}
                      disabled={currentStrokes.length === 0}
                      className="inline-flex items-center justify-center gap-1 px-[6px] py-[3px] rounded-[7px] border border-rose-200 bg-white text-rose-700 font-semibold disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" /> ล้างหน้า
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllInk}
                      disabled={annotatedSlideCount === 0}
                      className="inline-flex items-center justify-center gap-1 px-[6px] py-[3px] rounded-[7px] border border-rose-300 bg-rose-50 text-rose-800 font-semibold disabled:opacity-40"
                    >
                      <Trash2 className="w-3 h-3" /> ล้างหมด
                    </button>
                  </div>

                  {/* Toolbar Dock Position Switcher */}
                  <div
                    className={`flex items-center gap-[2px] rounded-[8px] border border-amber-200 bg-white p-[2px] text-[12px] font-bold ${
                      isVertBar ? 'grid grid-cols-2' : ''
                    }`}
                    title="ย้ายตำแหน่งแถบเครื่องมือเขียน"
                  >
                    {(
                      [
                        { id: 'top', label: 'บน' },
                        { id: 'bottom', label: 'ล่าง' },
                        { id: 'left', label: 'ซ้าย' },
                        { id: 'right', label: 'ขวา' },
                      ] as const
                    ).map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => {
                          setColorPickerOpen(false);
                          setCustomToolbarPos(null);
                          setToolbarPos(pos.id);
                        }}
                        className={`px-[5px] py-[2px] rounded-[6px] transition ${
                          !customToolbarPos && toolbarPos === pos.id
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-amber-50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Scaled Fixed-Resolution 1280x720 Slide Stage (Zero Ink Shift on Resize/Fullscreen) */}
            <div
              className="relative shrink-0"
              style={{
                width: Math.round(STAGE_WIDTH * stageScale),
                height: Math.round(STAGE_HEIGHT * stageScale),
              }}
            >
              <div
                className="slide-prose relative rounded-3xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden"
                style={{
                  width: STAGE_WIDTH,
                  height: STAGE_HEIGHT,
                  transform: `scale(${stageScale})`,
                  transformOrigin: 'top left',
                }}
              >
              {/* Slide Header */}
              <div className="shrink-0 px-6 pt-2.5 pb-1.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/60 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[20px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      01417168
                    </span>
                    <span className="text-sky-700">{slide.tagTh}</span>
                    <span className="text-slate-400">• {slide.tagEn}</span>
                    {slide.embed3D && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[16px]">
                        <Sparkles className="w-3.5 h-3.5" /> Interactive 3D
                      </span>
                    )}
                  </div>
                  <h2 className={`${fs.title} font-extrabold text-slate-900 mt-0.5`}>
                    {slide.titleTh}
                  </h2>
                  <p className={`${fs.subtitle} text-slate-500`}>
                    {slide.subtitle ?? slide.titleEn}
                  </p>
                </div>

                <div className="text-[20px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                  {safeSlideIdx + 1} / {totalSlides}
                </div>
              </div>

              {/* Slide Body (always scrollable via finger/wheel even in Write mode; ink canvas moves with content) */}
              <div
                ref={slideBodyRef}
                className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col ${
                  drawEnabled ? 'select-none' : 'select-text'
                }`}
              >
                <div className="relative flex-1 p-3.5 flex flex-col">
                {slide.kind === 'example' && slide.examples ? (
                  <div
                    className={`flex-1 min-h-0 flex flex-col ${
                      slide.examples.length > 1 ? 'gap-2' : 'gap-2.5'
                    }`}
                  >
                    {slide.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 ${
                          slide.examples && slide.examples.length > 1 ? 'p-2.5 gap-1.5' : 'p-3.5 gap-2'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className={`${fs.exPrompt} font-bold text-slate-900 leading-snug`}>
                            {ex.label && (
                              <span
                                className={`mr-2 px-2.5 py-0.5 rounded-md text-[22px] font-bold ${
                                  ex.label.includes('แนวข้อสอบ')
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {ex.label}
                              </span>
                            )}
                            <RichMathText text={ex.promptTh} />
                          </div>
                          {ex.promptLatex && (
                            <div
                              className={`px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 inline-block max-w-full overflow-x-auto overflow-y-hidden leading-normal text-sky-900 ${fs.exLatex}`}
                            >
                              <KaTeX math={ex.promptLatex} />
                            </div>
                          )}
                        </div>

                        {(() => {
                          const writeArea = (
                            <div
                              className={`${ex.scene3D ? 'col-span-8 h-full' : 'flex-1'} ${
                                slide.examples && slide.examples.length > 1
                                  ? 'min-h-[100px]'
                                  : 'min-h-[180px]'
                              } rounded-2xl border border-dashed border-slate-300 bg-white p-3 flex items-end justify-end text-xs text-slate-400`}
                              style={{
                                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                              }}
                            >
                              เปิด “เขียน” เพื่อเขียนวิธีทำสดด้วย Apple Pencil
                            </div>
                          );

                          if (!ex.scene3D) return writeArea;
                          return (
                            <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
                              {writeArea}
                              <div
                                className={`col-span-4 min-h-0 relative ${
                                  drawEnabled && toolMode !== 'laser' ? 'z-[25]' : 'z-10'
                                }`}
                              >
                                <MiniScene3D
                                  customScene={ex.scene3D}
                                  hintTh={ex.scene3D.hintTh}
                                  compact
                                  aboveInk={drawEnabled && toolMode !== 'laser'}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`flex-1 min-h-0 grid gap-4 ${
                      slide.embed3D ? 'grid-cols-12 items-start' : 'grid-cols-1'
                    }`}
                  >
                    <div
                      className={
                        slide.embed3D
                          ? 'col-span-6 my-auto flex flex-col gap-2.5'
                          : slide.kind === 'summary'
                            ? 'grid grid-cols-2 gap-3 items-stretch'
                            : 'my-auto flex flex-col gap-2.5'
                      }
                    >
                      {slide.cards?.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${
                            slide.kind === 'summary'
                              ? 'p-3 space-y-1 flex flex-col justify-between'
                              : 'p-3.5 space-y-1.5'
                          }`}
                        >
                          <div className={`${fs.cardHeading} font-bold text-slate-800`}>
                            <RichMathText text={card.heading} />
                          </div>
                          {card.bullets && (
                            <ul
                              className={`space-y-1 ${fs.bullet} text-slate-700 list-disc pl-6 leading-snug`}
                            >
                              {card.bullets.map((b, bIdx) => (
                                <li key={bIdx}>
                                  <RichMathText text={b} />
                                </li>
                              ))}
                            </ul>
                          )}
                          {card.formulas && (
                            <div
                              className={
                                card.formulaCols === 2 ? 'grid grid-cols-2 gap-2' : 'space-y-1.5'
                              }
                            >
                              {card.formulas.map((f, fIdx) => (
                                <div
                                  key={fIdx}
                                  className={`rounded-xl border px-3 py-1.5 ${toneClasses(f.tone)}`}
                                >
                                  {f.label && (
                                    <div className={`${fs.formulaLabel} font-semibold opacity-75 mb-0.5`}>
                                      {f.label}
                                    </div>
                                  )}
                                  <div
                                    className={`overflow-x-auto overflow-y-hidden leading-normal py-0.5 ${
                                      slide.kind === 'summary' ? 'text-[20px]' : fs.formula
                                    }`}
                                  >
                                    <KaTeX math={f.latex} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {card.note && (
                            <div
                              className={`px-3 py-1.5 rounded-lg bg-amber-100/70 text-amber-900 ${fs.note} font-semibold`}
                            >
                              {card.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {slide.embed3D && (
                      <div
                        className={`col-span-6 sticky top-0 h-[520px] ${
                          drawEnabled && toolMode !== 'laser' ? 'z-[25]' : 'z-10'
                        }`}
                      >
                        <MiniScene3D
                          embed={slide.embed3D}
                          hintTh={slide.embedHintTh}
                          aboveInk={drawEnabled && toolMode !== 'laser'}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Transparent Ink / Apple Pencil Overlay (pinned inside scrollable slide body) */}
                <AnnotationCanvas
                  strokes={currentStrokes}
                  drawEnabled={drawEnabled}
                  pencilOnly={pencilOnly}
                  penColor={penColor}
                  penWidth={penWidth}
                  eraserSize={eraserSize}
                  eraserMode={eraserMode}
                  toolMode={toolMode}
                  laserStyle={laserStyle}
                  onAddStroke={handleAddStroke}
                  onEraseStrokes={handleEraseStrokes}
                />
                </div>
              </div>
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Navigation Bar */}
        <footer className="shrink-0 bg-white border-t border-slate-200 px-3 sm:px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 z-20">
          <button
            type="button"
            onClick={goPrev}
            disabled={safeSlideIdx === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ก่อนหน้า</span>
          </button>

          <div className="flex-1 max-w-md flex flex-col items-center gap-1">
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-200"
                style={{ width: `${((safeSlideIdx + 1) / totalSlides) * 100}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              หน้า {safeSlideIdx + 1} / {totalSlides} • คาบที่ {slide.lecture}
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={safeSlideIdx === totalSlides - 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-sm disabled:opacity-40 transition"
          >
            <span>ถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>

      {/* Hidden Print/PDF Export Layout */}
      <SlidePrintView
        includeInk={printIncludeInk}
        inkImagesBySlide={inkImagesBySlide}
        printScope={exportScope}
      />
    </>
  );
}
