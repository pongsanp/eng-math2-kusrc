import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eraser,
  FileDown,
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
import { CH1_SLIDES, type SlideDef, type SlideFormulaBlock } from '../../slides/ch1SlidesData';
import { clearDeckInk, loadDeckInk, saveSlideInk } from '../../slides/inkStorage';
import { KaTeX } from '../KaTeX';
import { AnnotationCanvas } from './AnnotationCanvas';
import {
  renderStrokesToDataUrl,
  type AnnotationTool,
  type InkStroke,
  type LaserStyle,
  type PrintScope,
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
    title: 'text-xl sm:text-2xl leading-tight',
    subtitle: 'text-xs sm:text-sm',
    cardHeading: 'text-base sm:text-lg',
    bullet: 'text-sm sm:text-base',
    formulaLabel: 'text-xs sm:text-sm',
    formula: 'text-base sm:text-lg',
    note: 'text-xs sm:text-sm',
    exPrompt: 'text-base sm:text-lg',
    exLatex: 'text-base sm:text-xl',
  },
  large: {
    labelTh: 'ใหญ่ (ฉายจอ)',
    title: 'text-2xl sm:text-3xl lg:text-[2rem] leading-tight',
    subtitle: 'text-sm sm:text-base',
    cardHeading: 'text-lg sm:text-xl lg:text-[1.28rem]',
    bullet: 'text-base sm:text-lg lg:text-[1.16rem]',
    formulaLabel: 'text-xs sm:text-sm lg:text-base',
    formula: 'text-lg sm:text-xl lg:text-[1.3rem]',
    note: 'text-sm sm:text-base',
    exPrompt: 'text-lg sm:text-xl lg:text-[1.3rem]',
    exLatex: 'text-lg sm:text-xl lg:text-[1.4rem]',
  },
  xlarge: {
    labelTh: 'ใหญ่มาก',
    title: 'text-2xl sm:text-3xl lg:text-[2.25rem] leading-tight',
    subtitle: 'text-base sm:text-lg',
    cardHeading: 'text-xl sm:text-2xl lg:text-[1.45rem]',
    bullet: 'text-lg sm:text-xl lg:text-[1.3rem]',
    formulaLabel: 'text-sm sm:text-base lg:text-lg',
    formula: 'text-xl sm:text-2xl lg:text-[1.48rem]',
    note: 'text-base sm:text-lg',
    exPrompt: 'text-xl sm:text-2xl lg:text-[1.45rem]',
    exLatex: 'text-xl sm:text-2xl lg:text-[1.58rem]',
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

export function SlidesDeck({ onBackToDashboard }: SlidesDeckProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('large');

  // Annotation / Apple Pencil state
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [pencilOnly, setPencilOnly] = useState(true);
  const [penColor, setPenColor] = useState('#2563eb');
  const [penWidth, setPenWidth] = useState(4);
  const [toolMode, setToolMode] = useState<AnnotationTool>('pen');
  const [laserStyle, setLaserStyle] = useState<LaserStyle>('trail');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [strokesBySlide, setStrokesBySlide] = useState<Record<number, InkStroke[]>>({});
  const strokesRef = useRef<Record<number, InkStroke[]>>({});

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

  const slide: SlideDef = CH1_SLIDES[slideIdx];
  const totalSlides = CH1_SLIDES.length;
  const lecture2StartIdx = CH1_SLIDES.findIndex((s) => s.lecture === 2);
  const lecture1EndPage = lecture2StartIdx > 0 ? lecture2StartIdx : totalSlides;
  const fs = FONT_SCALE_MAP[textScale];

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
  }, [goNext, goPrev, toggleFullscreen, toolMode]);

  const updateSlideStrokes = useCallback(
    (slideId: number, updater: (prevList: InkStroke[]) => InkStroke[]) => {
      const prevList = strokesRef.current[slideId] ?? [];
      const nextList = updater(prevList);
      if (nextList === prevList) return;
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

  const handleUndoStroke = () => {
    updateSlideStrokes(slide.id, (prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  };

  const handleClearSlideInk = () => {
    updateSlideStrokes(slide.id, () => []);
  };

  const handleClearAllInk = () => {
    if (window.confirm('ต้องการล้างลายมือที่เขียนไว้ทั้งหมดทุกหน้าหรือไม่?')) {
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
      ? CH1_SLIDES.filter((s) => s.lecture === 1)
      : exportScope === 'lec2'
        ? CH1_SLIDES.filter((s) => s.lecture === 2)
        : CH1_SLIDES;

  const triggerExportPdf = (withInk: boolean) => {
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
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 180);
    });
  };

  const currentStrokes = strokesBySlide[slide.id] ?? [];
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
        <header className="shrink-0 bg-white border-b border-slate-200 px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-1.5 z-30">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">3D Dashboard</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
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
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={goPrev}
              disabled={slideIdx === 0}
              aria-label="หน้าก่อนหน้า"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 disabled:opacity-40 shadow-xs transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>
            <div className="px-2 sm:px-3 text-xs sm:text-sm font-mono font-bold text-slate-700">
              หน้า {slideIdx + 1} / {totalSlides}
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={slideIdx === totalSlides - 1}
              aria-label="หน้าถัดไป"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold disabled:opacity-40 shadow-sm transition"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Projector Text Size Control */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-bold"
              title="ปรับขนาดตัวอักษรสำหรับฉายขึ้นจอ"
            >
              <button
                type="button"
                onClick={stepTextScaleDown}
                disabled={textScale === 'normal'}
                aria-label="ลดขนาดตัวอักษร"
                className="px-2 py-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 transition"
              >
                ก-
              </button>
              <span className="hidden 2xl:inline px-1.5 text-[11px] font-semibold text-slate-500">
                {fs.labelTh}
              </span>
              <button
                type="button"
                onClick={stepTextScaleUp}
                disabled={textScale === 'xlarge'}
                aria-label="เพิ่มขนาดตัวอักษร"
                className="px-2 py-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 transition"
              >
                ก+
              </button>
            </div>

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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition ${
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
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold transition ${
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
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition ${
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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
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
                    onClick={() => triggerExportPdf(true)}
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
                    onClick={() => triggerExportPdf(false)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-800 transition"
                  >
                    <div className="font-bold text-slate-800">PDF สไลด์เปล่า (GoodNotes)</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ส่งออก {scopedSlides.length} หน้าเป็นช่องตารางจุด 16:9 ยังไม่มีลายมือ
                    </div>
                  </button>
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

        {/* Optional Drawing Pen Toolbar */}
        {drawEnabled && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm z-30">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-amber-900">Apple Pencil:</span>
              <div className="flex items-center gap-1.5">
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
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      toolMode === 'pen' && penColor === c.color
                        ? 'border-amber-600 scale-110 shadow'
                        : 'border-white'
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}

                {/* Expandable More Pen Colors Palette */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setExportMenuOpen(false);
                      setColorPickerOpen((o) => !o);
                    }}
                    title="เลือกสีปากกาเพิ่มเติมหรือกำหนดสีเอง"
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-semibold border transition ${
                      colorPickerOpen ||
                      (toolMode === 'pen' && !PEN_COLORS.some((c) => c.color === penColor))
                        ? 'border-amber-600 bg-amber-100 text-amber-950 shadow-xs'
                        : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: penColor }}
                    />
                    <span>สีเพิ่ม</span>
                  </button>

                  {colorPickerOpen && (
                    <div className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl p-3 z-50 space-y-2.5">
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
              <div className="flex items-center gap-1 pl-2 border-l border-amber-200">
                {[2, 4, 7].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      setToolMode('pen');
                      setPenWidth(w);
                    }}
                    className={`px-2 py-0.5 rounded-lg font-semibold border ${
                      toolMode === 'pen' && penWidth === w
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-amber-200'
                    }`}
                  >
                    {w === 2 ? 'เล็ก' : w === 4 ? 'กลาง' : 'หนา'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setColorPickerOpen(false);
                  setToolMode((m) => (m === 'eraser' ? 'pen' : 'eraser'));
                }}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-semibold border ${
                  toolMode === 'eraser'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-amber-200'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" /> ยางลบ
              </button>
              <button
                type="button"
                onClick={() => {
                  setColorPickerOpen(false);
                  setToolMode((m) => (m === 'laser' ? 'pen' : 'laser'));
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-semibold border transition ${
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
                <div className="inline-flex items-center rounded-lg border border-red-200 bg-white p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setLaserStyle('trail')}
                    title="วงหรือขีดค้างไว้ได้หลายจุด แล้วค่อยๆ จางหายหมดใน 1.5 วิ"
                    className={`px-2 py-0.5 rounded-md transition ${
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
                    className={`px-2 py-0.5 rounded-md transition ${
                      laserStyle === 'dot'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-red-700 hover:bg-red-50'
                    }`}
                  >
                    จุดชี้
                  </button>
                </div>
              )}

              {/* Palm Rejection Mode Toggle */}
              <button
                type="button"
                onClick={() => setPencilOnly((p) => !p)}
                title="สลับระหว่างเฉพาะ Apple Pencil/เมาส์ (กันฝ่ามือ) กับอนุญาตนิ้ววาดด้วย"
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-semibold border transition ${
                  pencilOnly
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {pencilOnly ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>กันฝ่ามือ: เฉพาะปากกา</span>
                  </>
                ) : (
                  <>
                    <Hand className="w-3.5 h-3.5" />
                    <span>โหมดนิ้ว + ปากกา</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndoStroke}
                disabled={currentStrokes.length === 0}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-amber-200 bg-white text-slate-700 font-semibold disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" /> ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleClearSlideInk}
                disabled={currentStrokes.length === 0}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-rose-200 bg-white text-rose-700 font-semibold disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> ล้างหน้านี้
              </button>
              <button
                type="button"
                onClick={handleClearAllInk}
                disabled={annotatedSlideCount === 0}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 font-semibold disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> ล้างทุกหน้า
              </button>
            </div>
          </div>
        )}

        {/* Main Stage */}
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
          {/* Overview Drawer */}
          {overviewOpen && (
            <aside className="w-76 shrink-0 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-3 space-y-1.5 z-30">
              <div className="text-xs sm:text-sm font-bold text-slate-600 px-1 pb-1">
                สารบัญสไลด์บทที่ 1 ({totalSlides} หน้า)
              </div>
              {CH1_SLIDES.map((s, idx) => {
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
                      idx === slideIdx
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
                        <span
                          className={
                            s.tagTh.includes('แนวข้อสอบ')
                              ? 'text-rose-600 font-semibold'
                              : undefined
                          }
                        >
                          {s.tagTh.includes('แนวข้อสอบ')
                            ? 'แนวข้อสอบ'
                            : s.kind === 'example'
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
          <main className="slide-stage-wrapper flex-1 min-h-0 p-2 sm:p-3 flex items-center justify-center overflow-hidden">
            <div className="slide-stage-box slide-prose relative rounded-3xl border border-slate-200 bg-white shadow-xl flex flex-col overflow-hidden">
              {/* Slide Header */}
              <div className="shrink-0 px-5 sm:px-7 pt-3.5 pb-2.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/60 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                      01417168
                    </span>
                    <span className="text-sky-700">{slide.tagTh}</span>
                    <span className="text-slate-400 hidden sm:inline">• {slide.tagEn}</span>
                    {slide.embed3D && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                        <Sparkles className="w-3.5 h-3.5" /> Interactive 3D
                      </span>
                    )}
                  </div>
                  <h2 className={`${fs.title} font-extrabold text-slate-900 mt-1`}>
                    {slide.titleTh}
                  </h2>
                  <p className={`${fs.subtitle} text-slate-500`}>
                    {slide.subtitle ?? slide.titleEn}
                  </p>
                </div>

                <div className="text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                  {slideIdx + 1} / {totalSlides}
                </div>
              </div>

              {/* Slide Body */}
              <div
                className={`flex-1 min-h-0 p-4 sm:p-5 ${
                  drawEnabled
                    ? 'overflow-hidden touch-none select-none'
                    : 'overflow-y-auto custom-scrollbar select-text'
                }`}
              >
                {slide.kind === 'example' && slide.examples ? (
                  <div
                    className={`h-full flex flex-col ${
                      slide.examples.length > 1 ? 'gap-2' : 'gap-3'
                    }`}
                  >
                    {slide.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 ${
                          slide.examples && slide.examples.length > 1 ? 'p-2.5 gap-1.5' : 'p-4 gap-2.5'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className={`${fs.exPrompt} font-bold text-slate-900 leading-snug`}>
                            {ex.label && (
                              <span
                                className={`mr-2 px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-bold ${
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
                                  ? 'min-h-[60px]'
                                  : 'min-h-[150px]'
                              } rounded-2xl border border-dashed border-slate-300 bg-white p-3 flex items-end justify-end text-xs text-slate-400`}
                              style={{
                                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                              }}
                            >
                              เปิด “เขียนบนสไลด์” ด้านบนเพื่อเขียนวิธีทำสดด้วย Apple Pencil
                            </div>
                          );

                          if (!ex.scene3D) return writeArea;
                          return (
                            <div className="flex-1 min-h-0 grid grid-cols-12 gap-2.5">
                              {writeArea}
                              <div className="col-span-4 min-h-0">
                                <MiniScene3D
                                  customScene={ex.scene3D}
                                  hintTh={ex.scene3D.hintTh}
                                  compact
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
                    className={`h-full grid gap-4 ${
                      slide.embed3D ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'
                    }`}
                  >
                    <div
                      className={
                        slide.embed3D
                          ? 'md:col-span-6 flex flex-col justify-center gap-3'
                          : slide.kind === 'summary'
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch'
                            : 'flex flex-col justify-center gap-3'
                      }
                    >
                      {slide.cards?.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${
                            slide.kind === 'summary'
                              ? 'p-3.5 space-y-1.5 flex flex-col justify-between'
                              : 'p-4 space-y-2'
                          }`}
                        >
                          <div className={`${fs.cardHeading} font-bold text-slate-800`}>
                            <RichMathText text={card.heading} />
                          </div>
                          {card.bullets && (
                            <ul
                              className={`space-y-1.5 ${fs.bullet} text-slate-700 list-disc pl-6 leading-relaxed`}
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
                                card.formulaCols === 2
                                  ? 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
                                  : 'space-y-2'
                              }
                            >
                              {card.formulas.map((f, fIdx) => (
                                <div
                                  key={fIdx}
                                  className={`rounded-xl border px-3.5 py-2 ${toneClasses(f.tone)}`}
                                >
                                  {f.label && (
                                    <div className={`${fs.formulaLabel} font-semibold opacity-75 mb-0.5`}>
                                      {f.label}
                                    </div>
                                  )}
                                  <div
                                    className={`overflow-x-auto overflow-y-hidden leading-normal py-0.5 ${
                                      slide.kind === 'summary'
                                        ? 'text-base sm:text-lg lg:text-[1.12rem]'
                                        : fs.formula
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
                      <div className="md:col-span-6 min-h-[260px]">
                        <MiniScene3D embed={slide.embed3D} hintTh={slide.embedHintTh} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Transparent Ink / Apple Pencil Overlay */}
              <AnnotationCanvas
                strokes={currentStrokes}
                drawEnabled={drawEnabled}
                pencilOnly={pencilOnly}
                penColor={penColor}
                penWidth={penWidth}
                toolMode={toolMode}
                laserStyle={laserStyle}
                onAddStroke={handleAddStroke}
              />
            </div>
          </main>
        </div>

        {/* Bottom Navigation Bar */}
        <footer className="shrink-0 bg-white border-t border-slate-200 px-3 sm:px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 z-20">
          <button
            type="button"
            onClick={goPrev}
            disabled={slideIdx === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>ก่อนหน้า</span>
          </button>

          <div className="flex-1 max-w-md flex flex-col items-center gap-1">
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-200"
                style={{ width: `${((slideIdx + 1) / totalSlides) * 100}%` }}
              />
            </div>
            <div className="text-xs font-semibold text-slate-600">
              หน้า {slideIdx + 1} / {totalSlides} • คาบที่ {slide.lecture}
            </div>
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={slideIdx === totalSlides - 1}
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
