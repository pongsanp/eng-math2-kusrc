import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from 'react';
import { flushSync } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardPaste,
  Copy,
  Download,
  Eraser,
  Feather,
  FileDown,
  FilePlus2,
  GripVertical,
  Hand,
  Highlighter,
  Lasso,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Palette,
  PanelBottomClose,
  PanelBottomOpen,
  PenTool,
  Redo2,
  Shapes,
  ShieldCheck,
  Sparkles,
  SquareDashed,
  Trash2,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  CH1_VISIBLE_SLIDES,
  getExampleDashboardTarget,
  getLocalizedSlide,
  type Ch1DashboardTarget,
  type SlideDef,
  type SlideFormulaBlock,
} from '../../slides/ch1SlidesData';
import {
  clearDeckInk,
  clearDeckSnippets,
  exportDeckBackup,
  importDeckBackup,
  loadCustomBlankPages,
  loadDeckInk,
  loadDeckSnippets,
  saveCustomBlankPages,
  saveSlideInk,
  saveSlideSnippets,
} from '../../slides/inkStorage';
import { KaTeX } from '../KaTeX';
import { AnnotationCanvas, type SlideSnippetHit } from './AnnotationCanvas';
import {
  buildOrderedDeckEntries,
  cloneStrokesWithOffset,
  detectInAppBrowser,
  drawStrokeOnContext,
  isStylusTouch,
  renderStrokesForExport,
  resolveSwipeDirection,
  type AnnotationTool,
  type BlankPaperStyle,
  type CustomBlankPage,
  type EraserMode,
  type InkStroke,
  type LaserStyle,
  type NavDirection,
  type PenStyle,
  type PrintScope,
  type RenderedInkExport,
  type SelectionShape,
  type SlideBBox,
  type SlideLang,
  type SlideSnippet,
  type SnapShapeMode,
  type ToolbarDock,
} from '../../slides/inkUtils';
import { MiniScene3D } from './MiniScene3D';
import { RichMathText } from './RichMathText';
import { SlidePrintView } from './SlidePrintView';
import { VersionBadge } from '../VersionBadge';
import { CloudSyncButton } from '../CloudSyncButton';
import { CloudSyncConflictModal } from '../CloudSyncConflictModal';
import { useDeckCloudSync } from '../../firebase/useDeckCloudSync';
import type { DeckDataSnapshot } from '../../firebase/syncService';

interface SlidesDeckProps {
  onBackToDashboard: () => void;
  onOpenDashboardTarget?: (target: Ch1DashboardTarget) => void;
  lang: SlideLang;
  onChangeLang: (lang: SlideLang) => void;
}

type TextScale = 'normal' | 'large' | 'xlarge';

const DECK_ID = 'ch1';
const LEGACY_INK_STORAGE_KEY = 'eng_math_2_ch1_ink_v1';
const COMPACT_BARS_STORAGE_KEY = 'eng_math_2_slides_compact_bars';

function getStorageDeckId(lang: SlideLang): string {
  return lang === 'en' ? `${DECK_ID}_en` : DECK_ID;
}

function getLegacyInkKey(lang: SlideLang): string | undefined {
  return lang === 'th' ? LEGACY_INK_STORAGE_KEY : undefined;
}

function getLastSlideEntryStorageKey(storageDeckId: string): string {
  return `eng_math_2_${storageDeckId}_last_entry_id`;
}

const PEN_COLORS = [
  { color: '#0f172a', label: 'ดำ', labelEn: 'Black' },
  { color: '#2563eb', label: 'น้ำเงิน', labelEn: 'Blue' },
  { color: '#dc2626', label: 'แดง', labelEn: 'Red' },
  { color: '#059669', label: 'เขียว', labelEn: 'Green' },
  { color: '#7c3aed', label: 'ม่วง', labelEn: 'Violet' },
  { color: '#d97706', label: 'ส้ม', labelEn: 'Amber' },
];

const HIGHLIGHTER_COLORS = [
  { color: '#fef08a', label: 'เหลือง', labelEn: 'Yellow' },
  { color: '#fbcfe8', label: 'ชมพู', labelEn: 'Pink' },
  { color: '#bbf7d0', label: 'เขียวมิ้นต์', labelEn: 'Mint' },
  { color: '#bae6fd', label: 'ฟ้า', labelEn: 'Sky' },
  { color: '#fed7aa', label: 'ส้มอ่อน', labelEn: 'Peach' },
  { color: '#ddd6fe', label: 'ม่วงอ่อน', labelEn: 'Lavender' },
];

function SlideMiniInkPreview({ strokes }: { strokes: InkStroke[] }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const scale = cv.width / 1280;
    for (const st of strokes) {
      drawStrokeOnContext(ctx, st, cv.width, cv.height, scale, 0);
    }
  }, [strokes]);
  return (
    <canvas
      ref={ref}
      width={220}
      height={124}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

const EXTENDED_PEN_COLORS = [
  { color: '#0f172a', label: 'ดำ', labelEn: 'Black' },
  { color: '#475569', label: 'เทาเข้ม', labelEn: 'Slate' },
  { color: '#92400e', label: 'น้ำตาล', labelEn: 'Brown' },
  { color: '#dc2626', label: 'แดงสด', labelEn: 'Red' },
  { color: '#9f1239', label: 'แดงเลือดหมู', labelEn: 'Crimson' },
  { color: '#db2777', label: 'ชมพูบานเย็น', labelEn: 'Pink' },
  { color: '#c026d3', label: 'ม่วงแดง', labelEn: 'Magenta' },
  { color: '#7c3aed', label: 'ม่วง', labelEn: 'Violet' },
  { color: '#4f46e5', label: 'คราม', labelEn: 'Indigo' },
  { color: '#2563eb', label: 'น้ำเงิน', labelEn: 'Blue' },
  { color: '#0284c7', label: 'ฟ้าสด', labelEn: 'Sky' },
  { color: '#0891b2', label: 'ฟ้าน้ำทะเล', labelEn: 'Cyan' },
  { color: '#0d9488', label: 'เขียวอมฟ้า', labelEn: 'Teal' },
  { color: '#059669', label: 'เขียวมรกต', labelEn: 'Emerald' },
  { color: '#15803d', label: 'เขียวเข้ม', labelEn: 'Forest' },
  { color: '#65a30d', label: 'เขียวมะกอก', labelEn: 'Olive' },
  { color: '#d97706', label: 'ส้มอำพัน', labelEn: 'Amber' },
  { color: '#ea580c', label: 'ส้มสด', labelEn: 'Orange' },
];

const FONT_SCALE_MAP: Record<
  TextScale,
  {
    labelTh: string;
    labelEn: string;
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
    labelEn: 'Normal',
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
    labelEn: 'Large',
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
    labelEn: 'X-Large',
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

function isNormPointInPolygon(
  px: number,
  py: number,
  poly: Array<[number, number]>,
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-9) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function createSnippetId(): string {
  return `snip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function getBlankPaperStyleCss(paperStyle: BlankPaperStyle): Record<string, string> {
  if (paperStyle === 'grid') {
    return {
      backgroundImage: 'radial-gradient(#cbd5e1 1.25px, transparent 1.25px)',
      backgroundSize: '20px 20px',
    };
  }
  if (paperStyle === 'lined') {
    return {
      backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 31px, #e2e8f0 31px 32px)',
      backgroundSize: '100% 32px',
    };
  }
  return {};
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;
const NAV_DIR_STORAGE_KEY = 'eng_math_2_nav_dir';
const TOOLBAR_POS_STORAGE_KEY = 'eng_math_2_toolbar_pos';
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function readSavedSlideEntryId(storageDeckId: string): number | null {
  try {
    const raw = window.localStorage.getItem(getLastSlideEntryStorageKey(storageDeckId));
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed !== 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function SlidesDeck(props: SlidesDeckProps) {
  const storageDeckId = getStorageDeckId(props.lang);
  // Keying by language deck cleanly isolates strokes, inserted blank pages, undo stack, and last page
  return <SlidesDeckInner key={storageDeckId} {...props} />;
}

function SlidesDeckInner({
  onBackToDashboard,
  onOpenDashboardTarget,
  lang,
  onChangeLang,
}: SlidesDeckProps) {
  const isEn = lang === 'en';
  const storageDeckId = getStorageDeckId(lang);
  const legacyInkKey = getLegacyInkKey(lang);
  const lastEntryStorageKey = getLastSlideEntryStorageKey(storageDeckId);
  const pendingRestoreIdRef = useRef<number | null>(readSavedSlideEntryId(storageDeckId));
  const hydratedRef = useRef(false);
  const [slideIdx, setSlideIdx] = useState(() => {
    const savedId = readSavedSlideEntryId(storageDeckId);
    if (savedId !== null && savedId > 0) {
      const idx = CH1_VISIBLE_SLIDES.findIndex((s) => s.id === savedId);
      if (idx >= 0) return idx;
    }
    return 0;
  });
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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const stageScaleRef = useRef(1);
  const [compactBars, setCompactBars] = useState<boolean>(() => {
    try {
      const saved = window.localStorage.getItem(COMPACT_BARS_STORAGE_KEY);
      if (saved === '0' || saved === 'false') return false;
      return true;
    } catch {
      return true;
    }
  });

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
  const activePenIdsRef = useRef<Set<number>>(new Set());
  const lastPenActivityAtRef = useRef<number>(0);
  const wheelCooldownRef = useRef(0);

  // Annotation / Apple Pencil / Copy-Select state
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [pencilOnly, setPencilOnly] = useState(true);
  const [penColor, setPenColor] = useState('#2563eb');
  const [penWidth, setPenWidth] = useState(4);
  const [eraserSize, setEraserSize] = useState(6);
  const [eraserMode, setEraserMode] = useState<EraserMode>('partial');
  const [toolMode, setToolMode] = useState<AnnotationTool>('pen');
  const [selectionShape, setSelectionShape] = useState<SelectionShape>('lasso');
  const [clipboardStrokes, setClipboardStrokes] = useState<InkStroke[]>([]);
  const [clipboardSnippets, setClipboardSnippets] = useState<SlideSnippet[]>([]);
  const [selectTrigger, setSelectTrigger] = useState<{ indices: number[]; seq: number } | null>(null);
  const [laserStyle, setLaserStyle] = useState<LaserStyle>('trail');
  const [penStyle, setPenStyle] = useState<PenStyle>('mono');
  const [snapShapeMode, setSnapShapeMode] = useState<SnapShapeMode>('smart');
  const [highlighterColor, setHighlighterColor] = useState('#fef08a');
  const [highlighterWidth, setHighlighterWidth] = useState(18);
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);
  const [quickRowOpen, setQuickRowOpen] = useState(true);
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [overviewMode, setOverviewMode] = useState<'list' | 'grid'>('list');
  const [dragBlankId, setDragBlankId] = useState<number | null>(null);
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [strokesBySlide, setStrokesBySlide] = useState<Record<number, InkStroke[]>>({});
  const strokesRef = useRef<Record<number, InkStroke[]>>({});
  const [snippetsBySlide, setSnippetsBySlide] = useState<Record<number, SlideSnippet[]>>({});
  const snippetsRef = useRef<Record<number, SlideSnippet[]>>({});
  const slideBodyAreaRef = useRef<HTMLDivElement | null>(null);
  const snippetDragRef = useRef<{
    slideId: number;
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    w: number;
    boxW: number;
    boxH: number;
  } | null>(null);
  const undoHistoryRef = useRef<Record<number, InkStroke[][]>>({});
  const [undoCountBySlide, setUndoCountBySlide] = useState<Record<number, number>>({});
  const redoHistoryRef = useRef<Record<number, InkStroke[][]>>({});
  const [redoCountBySlide, setRedoCountBySlide] = useState<Record<number, number>>({});
  const [customPages, setCustomPages] = useState<CustomBlankPage[]>([]);
  const customPagesRef = useRef<CustomBlankPage[]>([]);
  const [hydratedDeckId, setHydratedDeckId] = useState<string | null>(null);

  // PDF Export state
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportScope, setExportScope] = useState<PrintScope>('all');
  const [printIncludeInk, setPrintIncludeInk] = useState(false);
  const [inkImagesBySlide, setInkImagesBySlide] = useState<Record<number, RenderedInkExport>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportBlockedMessage, setExportBlockedMessage] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const printFallbackTimerRef = useRef<number | null>(null);
  const slideHeaderRef = useRef<HTMLDivElement | null>(null);
  const [slideHeaderHeight, setSlideHeaderHeight] = useState(0);
  const inAppBrowser = detectInAppBrowser(undefined, lang);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    stageScaleRef.current = stageScale;
  }, [stageScale]);

  useEffect(() => {
    customPagesRef.current = customPages;
  }, [customPages]);

  useEffect(() => {
    return () => {
      if (printFallbackTimerRef.current !== null) {
        window.clearTimeout(printFallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      loadDeckInk(storageDeckId, legacyInkKey),
      loadDeckSnippets(storageDeckId),
      loadCustomBlankPages(storageDeckId),
    ]).then(([loaded, loadedSnips, loadedPages]) => {
      if (cancelled) return;

      const preHydration = strokesRef.current;
      const mergedStrokes: Record<number, InkStroke[]> = { ...loaded };
      for (const [k, preList] of Object.entries(preHydration)) {
        const sId = Number(k);
        if (Number.isFinite(sId) && Array.isArray(preList) && preList.length > 0) {
          mergedStrokes[sId] = [...(loaded[sId] ?? []), ...preList];
          void saveSlideInk(storageDeckId, sId, mergedStrokes[sId], legacyInkKey);
        }
      }
      strokesRef.current = mergedStrokes;
      setStrokesBySlide(mergedStrokes);

      const preSnips = snippetsRef.current;
      const mergedSnips: Record<number, SlideSnippet[]> = { ...loadedSnips };
      for (const [k, preList] of Object.entries(preSnips)) {
        const sId = Number(k);
        if (Number.isFinite(sId) && Array.isArray(preList) && preList.length > 0) {
          mergedSnips[sId] = [...(loadedSnips[sId] ?? []), ...preList];
          void saveSlideSnippets(storageDeckId, sId, mergedSnips[sId]);
        }
      }
      snippetsRef.current = mergedSnips;
      setSnippetsBySlide(mergedSnips);

      if (customPagesRef.current.length === 0 && loadedPages.length > 0) {
        customPagesRef.current = loadedPages;
        setCustomPages(loadedPages);
      }
      const pendingId = pendingRestoreIdRef.current;
      pendingRestoreIdRef.current = null;
      hydratedRef.current = true;
      if (pendingId !== null) {
        const effectivePages =
          customPagesRef.current.length > 0 ? customPagesRef.current : loadedPages;
        const entries = buildOrderedDeckEntries(CH1_VISIBLE_SLIDES, effectivePages);
        const restoredIdx = entries.findIndex((e) => e.id === pendingId);
        if (restoredIdx >= 0) {
          setSlideIdx(restoredIdx);
        }
      }
      setHydratedDeckId(storageDeckId);
    });
    return () => {
      cancelled = true;
    };
  }, [storageDeckId, legacyInkKey]);

  const handleApplyCloudSnapshot = useCallback((snapshot: DeckDataSnapshot) => {
    undoHistoryRef.current = {};
    redoHistoryRef.current = {};
    setUndoCountBySlide({});
    setRedoCountBySlide({});
    strokesRef.current = snapshot.strokesBySlide;
    setStrokesBySlide(snapshot.strokesBySlide);
    snippetsRef.current = snapshot.snippetsBySlide;
    setSnippetsBySlide(snapshot.snippetsBySlide);
    customPagesRef.current = snapshot.customPages;
    setCustomPages(snapshot.customPages);
  }, []);

  const handleApplyRemoteMeta = useCallback((pages: CustomBlankPage[]) => {
    customPagesRef.current = pages;
    setCustomPages(pages);
  }, []);

  const handleApplyRemoteSlide = useCallback(
    (slideId: number, strokes: InkStroke[], snippets: SlideSnippet[]) => {
      const nextStrokes = { ...strokesRef.current };
      if (strokes.length > 0) {
        nextStrokes[slideId] = strokes;
      } else {
        delete nextStrokes[slideId];
      }
      strokesRef.current = nextStrokes;
      setStrokesBySlide(nextStrokes);

      const nextSnips = { ...snippetsRef.current };
      if (snippets.length > 0) {
        nextSnips[slideId] = snippets;
      } else {
        delete nextSnips[slideId];
      }
      snippetsRef.current = nextSnips;
      setSnippetsBySlide(nextSnips);
    },
    [],
  );

  const handleApplyRemoteSlideRemove = useCallback((slideId: number) => {
    if (strokesRef.current[slideId]) {
      const nextStrokes = { ...strokesRef.current };
      delete nextStrokes[slideId];
      strokesRef.current = nextStrokes;
      setStrokesBySlide(nextStrokes);
    }
    if (snippetsRef.current[slideId]) {
      const nextSnips = { ...snippetsRef.current };
      delete nextSnips[slideId];
      snippetsRef.current = nextSnips;
      setSnippetsBySlide(nextSnips);
    }
  }, []);

  const cloudSync = useDeckCloudSync({
    deckId: storageDeckId,
    legacyInkKey,
    localHydrated: hydratedDeckId === storageDeckId,
    isEn,
    strokesRef,
    snippetsRef,
    customPagesRef,
    onApplySnapshot: handleApplyCloudSnapshot,
    onApplyRemoteMeta: handleApplyRemoteMeta,
    onApplyRemoteSlide: handleApplyRemoteSlide,
    onApplyRemoteSlideRemove: handleApplyRemoteSlideRemove,
  });

  const orderedEntries = useMemo(
    () => buildOrderedDeckEntries(CH1_VISIBLE_SLIDES, customPages),
    [customPages],
  );

  const totalEntries = orderedEntries.length;
  const safeSlideIdx = Math.min(slideIdx, Math.max(0, totalEntries - 1));
  const activeEntry = orderedEntries[safeSlideIdx];
  const activeId = activeEntry.id;
  const activeLecture = activeEntry.lecture;
  const activeBuiltinSlide: SlideDef | null =
    activeEntry.kind === 'builtin' ? activeEntry.slide : null;
  const activeLoc = activeBuiltinSlide ? getLocalizedSlide(activeBuiltinSlide, lang) : null;
  const lecture2StartIdx = orderedEntries.findIndex((e) => e.lecture === 2);
  const lecture1EndPage = lecture2StartIdx > 0 ? lecture2StartIdx : totalEntries;
  const fs = FONT_SCALE_MAP[textScale];
  const currentSnippets = snippetsBySlide[activeId] ?? [];

  useEffect(() => {
    if (!hydratedRef.current && pendingRestoreIdRef.current !== null) return;
    try {
      window.localStorage.setItem(lastEntryStorageKey, String(activeId));
    } catch {
      // ignore storage errors
    }
  }, [activeId, lastEntryStorageKey]);

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
      window.localStorage.setItem(COMPACT_BARS_STORAGE_KEY, compactBars ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, [compactBars]);

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

  const clampPan = useCallback((rawPan: { x: number; y: number }, targetZoom: number) => {
    if (targetZoom <= 1.005) {
      return { x: 0, y: 0 };
    }
    const baseW = STAGE_WIDTH * stageScaleRef.current;
    const baseH = STAGE_HEIGHT * stageScaleRef.current;
    const maxX = Math.max(40, ((targetZoom - 1) * baseW) / 2 + 48);
    const maxY = Math.max(40, ((targetZoom - 1) * baseH) / 2 + 48);
    return {
      x: Math.max(-maxX, Math.min(maxX, rawPan.x)),
      y: Math.max(-maxY, Math.min(maxY, rawPan.y)),
    };
  }, []);

  const zoomTo = useCallback(
    (nextZoomRaw: number, nextPanRaw?: { x: number; y: number }) => {
      const clampedZ = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw)) * 100) / 100;
      const finalZ = clampedZ <= 1.02 ? 1 : clampedZ;
      zoomRef.current = finalZ;
      setZoom(finalZ);
      const clampedP = clampPan(nextPanRaw ?? panRef.current, finalZ);
      panRef.current = clampedP;
      setPan(clampedP);
    },
    [clampPan],
  );

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
      stageScaleRef.current = next;
      setStageScale(next);
      if (zoomRef.current > 1.005) {
        const clampedP = clampPan(panRef.current, zoomRef.current);
        panRef.current = clampedP;
        setPan(clampedP);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampPan, compactBars, overviewOpen]);

  useEffect(() => {
    const hdr = slideHeaderRef.current;
    if (!hdr) return;
    const syncHdr = () => {
      setSlideHeaderHeight(hdr.offsetHeight);
    };
    const rafId = window.requestAnimationFrame(syncHdr);
    const ro = new ResizeObserver(syncHdr);
    ro.observe(hdr);
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [safeSlideIdx, textScale, lang, activeEntry.kind]);

  const goPrev = useCallback(() => {
    pendingRestoreIdRef.current = null;
    hydratedRef.current = true;
    setExportMenuOpen(false);
    setColorPickerOpen(false);
    setSelectTrigger(null);
    setSlideIdx((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    pendingRestoreIdRef.current = null;
    hydratedRef.current = true;
    setExportMenuOpen(false);
    setColorPickerOpen(false);
    setSelectTrigger(null);
    setSlideIdx((i) => Math.min(totalEntries - 1, i + 1));
  }, [totalEntries]);

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
        redoHistoryRef.current[slideId] = [];
        setRedoCountBySlide((prev) => ({ ...prev, [slideId]: 0 }));
      }
      const nextMap = { ...strokesRef.current, [slideId]: nextList };
      strokesRef.current = nextMap;
      setStrokesBySlide(nextMap);
      void saveSlideInk(storageDeckId, slideId, nextList, legacyInkKey);
      cloudSync.notifySlideDirty(slideId);
    },
    [storageDeckId, legacyInkKey, cloudSync],
  );

  const updateSlideSnippets = useCallback(
    (slideId: number, updater: (prevList: SlideSnippet[]) => SlideSnippet[]) => {
      const prevList = snippetsRef.current[slideId] ?? [];
      const nextList = updater(prevList);
      if (nextList === prevList) return;
      const nextMap = { ...snippetsRef.current, [slideId]: nextList };
      snippetsRef.current = nextMap;
      setSnippetsBySlide(nextMap);
      void saveSlideSnippets(storageDeckId, slideId, nextList);
      cloudSync.notifySlideDirty(slideId);
    },
    [storageDeckId, cloudSync],
  );

  const handlePasteClipboard = useCallback(() => {
    if (clipboardStrokes.length === 0 && clipboardSnippets.length === 0) return;
    if (clipboardStrokes.length > 0) {
      const clones = cloneStrokesWithOffset(clipboardStrokes, 0.015, 0.015, -0.35);
      if (clones.length > 0) {
        const curLen = (strokesRef.current[activeId] ?? []).length;
        const newIndices = clones.map((_, i) => curLen + i);
        updateSlideStrokes(activeId, (prev) => [...prev, ...clones]);
        setDrawEnabled(true);
        setToolMode('select');
        setSelectTrigger({ indices: newIndices, seq: Date.now() });
      }
    }
    if (clipboardSnippets.length > 0) {
      const existingCount = (snippetsRef.current[activeId] ?? []).length;
      const clonedSnips: SlideSnippet[] = clipboardSnippets.map((sn, idx) => {
        const bump = ((existingCount + idx) % 4) * 0.015;
        return {
          ...sn,
          id: createSnippetId(),
          x: Math.max(0.02, Math.min(Math.max(0.08, 0.96 - sn.w), sn.x + 0.02 + bump)),
          y: Math.max(0.02, Math.min(0.8, sn.y + 0.02 + bump)),
        };
      });
      updateSlideSnippets(activeId, (prev) => [...prev, ...clonedSnips]);
    }
  }, [activeId, clipboardSnippets, clipboardStrokes, updateSlideSnippets, updateSlideStrokes]);

  const handleUndoStroke = useCallback(() => {
    const cur = strokesRef.current[activeId] ?? [];
    const stack = undoHistoryRef.current[activeId] ?? [];
    if (stack.length > 0) {
      const restored = stack[stack.length - 1];
      const nextStack = stack.slice(0, -1);
      undoHistoryRef.current[activeId] = nextStack;
      setUndoCountBySlide((prev) => ({ ...prev, [activeId]: nextStack.length }));
      const nextRedo = [...(redoHistoryRef.current[activeId] ?? []), cur].slice(-40);
      redoHistoryRef.current[activeId] = nextRedo;
      setRedoCountBySlide((prev) => ({ ...prev, [activeId]: nextRedo.length }));
      updateSlideStrokes(activeId, () => restored, false);
      return;
    }
    if (cur.length > 0) {
      const nextRedo = [...(redoHistoryRef.current[activeId] ?? []), cur].slice(-40);
      redoHistoryRef.current[activeId] = nextRedo;
      setRedoCountBySlide((prev) => ({ ...prev, [activeId]: nextRedo.length }));
      updateSlideStrokes(activeId, (prev) => prev.slice(0, -1), false);
    }
  }, [activeId, updateSlideStrokes]);

  const handleRedoStroke = useCallback(() => {
    const rStack = redoHistoryRef.current[activeId] ?? [];
    if (rStack.length === 0) return;
    const restored = rStack[rStack.length - 1];
    const nextRedo = rStack.slice(0, -1);
    redoHistoryRef.current[activeId] = nextRedo;
    setRedoCountBySlide((prev) => ({ ...prev, [activeId]: nextRedo.length }));
    const cur = strokesRef.current[activeId] ?? [];
    const nextUndo = [...(undoHistoryRef.current[activeId] ?? []), cur].slice(-40);
    undoHistoryRef.current[activeId] = nextUndo;
    setUndoCountBySlide((prev) => ({ ...prev, [activeId]: nextUndo.length }));
    updateSlideStrokes(activeId, () => restored, false);
  }, [activeId, updateSlideStrokes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportMenuOpen(false);
        setColorPickerOpen(false);
        setSizePopoverOpen(false);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoStroke();
        } else {
          handleUndoStroke();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        e.preventDefault();
        handleRedoStroke();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
        if (clipboardStrokes.length > 0 || clipboardSnippets.length > 0) {
          e.preventDefault();
          handlePasteClipboard();
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        zoomTo(1, { x: 0, y: 0 });
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
  }, [
    clipboardSnippets.length,
    clipboardStrokes.length,
    goNext,
    goPrev,
    handlePasteClipboard,
    handleRedoStroke,
    handleUndoStroke,
    navDirection,
    toggleFullscreen,
    toolMode,
    zoomTo,
  ]);

  const handleAddStroke = (stroke: InkStroke) => {
    updateSlideStrokes(activeId, (prev) => [...prev, stroke]);
  };

  const handleEraseStrokes = (remainingStrokes: InkStroke[]) => {
    updateSlideStrokes(activeId, () => remainingStrokes);
  };

  const handleReplaceStrokes = (nextStrokes: InkStroke[]) => {
    updateSlideStrokes(activeId, () => nextStrokes);
  };

  const handleCopyStrokes = (copied: InkStroke[]) => {
    setClipboardStrokes(
      copied.map((st) => ({
        ...st,
        points: st.points.map(([x, y]) => [x, y] as [number, number]),
      })),
    );
  };

  const handleCopySnippets = useCallback((copied: SlideSnippet[]) => {
    setClipboardSnippets(copied.map((sn) => ({ ...sn })));
  }, []);

  const findSnippetsInSelection = useCallback(
    (shape: SelectionShape, draft: Array<[number, number]>, isTap: boolean): SlideSnippetHit[] => {
      const bodyEl = slideBodyAreaRef.current;
      if (!bodyEl || draft.length === 0) return [];
      const bodyRect = bodyEl.getBoundingClientRect();
      if (bodyRect.width < 10 || bodyRect.height < 10) return [];

      let selMinX = Infinity;
      let selMinY = Infinity;
      let selMaxX = -Infinity;
      let selMaxY = -Infinity;
      for (const [x, y] of draft) {
        if (x < selMinX) selMinX = x;
        if (y < selMinY) selMinY = y;
        if (x > selMaxX) selMaxX = x;
        if (y > selMaxY) selMaxY = y;
      }

      const candidates = Array.from(bodyEl.querySelectorAll<HTMLElement>('[data-snip-type]'));
      interface RawHit {
        el: HTMLElement;
        type: string;
        area: number;
        normBox: SlideBBox;
        snippet: SlideSnippet;
      }
      const rawHits: RawHit[] = [];

      const buildSnippet = (el: HTMLElement, box: SlideBBox): SlideSnippet | null => {
        const type = el.dataset.snipType;
        const w = Math.max(0.2, Math.min(0.84, box.maxX - box.minX));
        if (type === 'pasted') {
          const id = el.dataset.snipId;
          const found = (snippetsRef.current[activeId] ?? []).find((s) => s.id === id);
          return found ? { ...found } : null;
        }
        if (type === 'formula') {
          const cIdx = Number(el.dataset.snipCard);
          const fIdx = Number(el.dataset.snipFormula);
          const f = activeLoc?.cards?.[cIdx]?.formulas?.[fIdx];
          if (!f) return null;
          return {
            id: createSnippetId(),
            x: box.minX,
            y: box.minY,
            w,
            kind: 'formula',
            label: f.label,
            latex: f.latex,
            tone: f.tone,
          };
        }
        if (type === 'ex-formula') {
          const exIdx = Number(el.dataset.snipIdx);
          const ex = activeLoc?.examples?.[exIdx];
          if (!ex?.displayLatex) return null;
          return {
            id: createSnippetId(),
            x: box.minX,
            y: box.minY,
            w,
            kind: 'formula',
            label: ex.displayLabel,
            latex: ex.displayLatex,
            tone: 'sky',
          };
        }
        if (type === 'prompt') {
          const exIdx = Number(el.dataset.snipIdx);
          const ex = activeLoc?.examples?.[exIdx];
          if (!ex) return null;
          return {
            id: createSnippetId(),
            x: box.minX,
            y: box.minY,
            w,
            kind: 'prompt',
            label: ex.displayLabel,
            text: ex.displayPrompt,
          };
        }
        if (type === 'card') {
          const cIdx = Number(el.dataset.snipIdx);
          const card = activeLoc?.cards?.[cIdx];
          if (!card) return null;
          const bulletsText = card.bullets?.map((b) => `• ${b}`).join('\n');
          const latexCombined =
            card.formulas && card.formulas.length > 0
              ? card.formulas.map((f) => f.latex).join(' \\\\[4pt] ')
              : undefined;
          return {
            id: createSnippetId(),
            x: box.minX,
            y: box.minY,
            w,
            kind: 'card',
            label: card.heading,
            text: bulletsText,
            latex: latexCombined,
          };
        }
        return null;
      };

      for (const el of candidates) {
        const type = el.dataset.snipType ?? '';
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        const bx1 = Math.max(0, Math.min(1, (r.left - bodyRect.left) / bodyRect.width));
        const bx2 = Math.max(0, Math.min(1, (r.right - bodyRect.left) / bodyRect.width));
        const by1 = Math.max(0, Math.min(1, (r.top - bodyRect.top) / bodyRect.height));
        const by2 = Math.max(0, Math.min(1, (r.bottom - bodyRect.top) / bodyRect.height));
        const bw = Math.max(1e-5, bx2 - bx1);
        const bh = Math.max(1e-5, by2 - by1);
        const area = bw * bh;

        if (isTap) {
          const [tx, ty] = draft[0];
          if (tx < bx1 || tx > bx2 || ty < by1 || ty > by2) continue;
        } else {
          const ix1 = Math.max(selMinX, bx1);
          const iy1 = Math.max(selMinY, by1);
          const ix2 = Math.min(selMaxX, bx2);
          const iy2 = Math.min(selMaxY, by2);
          if (ix2 <= ix1 || iy2 <= iy1) continue;
          const interArea = (ix2 - ix1) * (iy2 - iy1);
          const fracOfEl = interArea / area;
          const minReq = type === 'card' ? 0.5 : 0.16;
          if (shape === 'rect') {
            if (fracOfEl < minReq) continue;
          } else {
            let insideCount = 0;
            for (let gx = 0; gx < 3; gx++) {
              for (let gy = 0; gy < 3; gy++) {
                const sx = bx1 + bw * (0.15 + gx * 0.35);
                const sy = by1 + bh * (0.15 + gy * 0.35);
                if (isNormPointInPolygon(sx, sy, draft)) insideCount++;
              }
            }
            const minPts = type === 'card' ? 5 : 1;
            if (insideCount < minPts && fracOfEl < 0.35) continue;
          }
        }

        const normBox: SlideBBox = { minX: bx1, minY: by1, maxX: bx2, maxY: by2 };
        const snippet = buildSnippet(el, normBox);
        if (snippet) {
          rawHits.push({ el, type, area, normBox, snippet });
        }
      }

      if (rawHits.length === 0) return [];
      if (isTap) {
        // Pick the tightest matching box under the tap
        rawHits.sort((a, b) => a.area - b.area);
        return [{ snippet: rawHits[0].snippet, normBox: rawHits[0].normBox }];
      }

      // Avoid duplicating both an entire card AND its own nested formula boxes
      const matchedCards = rawHits.filter((h) => h.type === 'card').map((h) => h.el);
      return rawHits
        .filter((h) => h.type === 'card' || !matchedCards.some((c) => c.contains(h.el)))
        .map((h) => ({ snippet: h.snippet, normBox: h.normBox }));
    },
    [activeId, activeLoc],
  );

  const handleStepBlankPage = useCallback(
    (pageId: number, dir: -1 | 1) => {
      const entries = buildOrderedDeckEntries(CH1_VISIBLE_SLIDES, customPagesRef.current);
      const curIdx = entries.findIndex((e) => e.id === pageId);
      const targetIdx = curIdx + dir;
      if (curIdx < 0 || targetIdx < 0 || targetIdx >= entries.length) return;
      const curEntry = entries[curIdx];
      if (curEntry.kind !== 'blank') return;
      const targetEntry = entries[targetIdx];

      const curPages = customPagesRef.current.slice();
      const targetAnchor =
        targetEntry.kind === 'builtin'
          ? dir === -1
            ? (() => {
                const prevBuiltin = entries
                  .slice(0, targetIdx)
                  .reverse()
                  .find((e) => e.kind === 'builtin');
                return prevBuiltin && prevBuiltin.kind === 'builtin' ? prevBuiltin.slide.id : null;
              })()
            : targetEntry.slide.id
          : targetEntry.page.afterSlideId;

      if (targetAnchor === null) return;

      const updated = curPages.map((p) => {
        if (p.id === pageId) {
          return {
            ...p,
            afterSlideId: targetAnchor,
            order:
              targetEntry.kind === 'blank'
                ? targetEntry.page.order + dir * 5
                : dir === 1
                  ? -100
                  : 100000,
          };
        }
        return p;
      });

      const byAnchor = new Map<number, CustomBlankPage[]>();
      for (const p of updated) {
        const list = byAnchor.get(p.afterSlideId) ?? [];
        list.push(p);
        byAnchor.set(p.afterSlideId, list);
      }
      const normalized: CustomBlankPage[] = [];
      for (const list of byAnchor.values()) {
        list.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
        list.forEach((item, i) => normalized.push({ ...item, order: (i + 1) * 10 }));
      }
      customPagesRef.current = normalized;
      setCustomPages(normalized);
      void saveCustomBlankPages(storageDeckId, normalized);
      cloudSync.notifyMetaDirty();
      if (activeId === pageId) {
        const nextOrdered = buildOrderedDeckEntries(CH1_VISIBLE_SLIDES, normalized);
        const newIdx = nextOrdered.findIndex((e) => e.id === pageId);
        if (newIdx >= 0) setSlideIdx(newIdx);
      }
    },
    [activeId, storageDeckId, cloudSync],
  );

  const handleMoveBlankAfterAnchor = useCallback(
    (pageId: number, targetAnchorSlideId: number) => {
      const updated = customPagesRef.current.map((p) =>
        p.id === pageId ? { ...p, afterSlideId: targetAnchorSlideId, order: 99999 } : p,
      );
      const byAnchor = new Map<number, CustomBlankPage[]>();
      for (const p of updated) {
        const list = byAnchor.get(p.afterSlideId) ?? [];
        list.push(p);
        byAnchor.set(p.afterSlideId, list);
      }
      const normalized: CustomBlankPage[] = [];
      for (const list of byAnchor.values()) {
        list.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
        list.forEach((item, i) => normalized.push({ ...item, order: (i + 1) * 10 }));
      }
      customPagesRef.current = normalized;
      setCustomPages(normalized);
      void saveCustomBlankPages(storageDeckId, normalized);
      cloudSync.notifyMetaDirty();
    },
    [storageDeckId, cloudSync],
  );

  const handleExportJsonBackup = useCallback(async () => {
    const payload = await exportDeckBackup(storageDeckId, legacyInkKey);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.download = `eng-math-2-${storageDeckId}-backup-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBackupStatusMsg(
      isEn ? 'Backup file downloaded (.json).' : 'ดาวน์โหลดไฟล์สำรองโน้ต (.json) เรียบร้อย',
    );
    window.setTimeout(() => setBackupStatusMsg(null), 3500);
  }, [isEn, legacyInkKey, storageDeckId]);

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const hasExisting =
        Object.values(strokesRef.current).some((l) => l.length > 0) ||
        customPagesRef.current.length > 0 ||
        Object.values(snippetsRef.current).some((l) => l.length > 0);
      let mode: 'replace' | 'merge' = 'replace';
      if (hasExisting) {
        const replaceConfirm = window.confirm(
          isEn
            ? 'Press OK to REPLACE current notes with the backup, or Cancel to MERGE into existing notes.'
            : 'กด OK เพื่อเขียนทับโน้ตเดิมทั้งหมดด้วยไฟล์สำรอง หรือกด Cancel เพื่อผสานรวมเข้ากับโน้ตที่มีอยู่',
        );
        mode = replaceConfirm ? 'replace' : 'merge';
      }
      const prevIds = new Set<number>([
        ...Object.keys(strokesRef.current).map(Number),
        ...Object.keys(snippetsRef.current).map(Number),
      ]);
      const res = await importDeckBackup(storageDeckId, parsed, mode, legacyInkKey);
      undoHistoryRef.current = {};
      redoHistoryRef.current = {};
      setUndoCountBySlide({});
      setRedoCountBySlide({});
      strokesRef.current = res.strokesBySlide;
      setStrokesBySlide(res.strokesBySlide);
      customPagesRef.current = res.customPages;
      setCustomPages(res.customPages);
      snippetsRef.current = res.snippetsBySlide;
      setSnippetsBySlide(res.snippetsBySlide);
      cloudSync.notifyMetaDirty();
      const nextIds = new Set<number>([
        ...Object.keys(res.strokesBySlide).map(Number),
        ...Object.keys(res.snippetsBySlide).map(Number),
      ]);
      for (const id of nextIds) {
        if (Number.isFinite(id)) cloudSync.notifySlideDirty(id);
      }
      if (mode === 'replace') {
        for (const id of prevIds) {
          if (Number.isFinite(id) && !nextIds.has(id)) {
            cloudSync.notifySlideDeleted(id);
          }
        }
      }
      setBackupStatusMsg(
        isEn ? 'Notes restored from backup!' : 'นำเข้าโน้ตจากไฟล์สำรองเรียบร้อยแล้ว',
      );
      window.setTimeout(() => setBackupStatusMsg(null), 3500);
    } catch {
      setBackupStatusMsg(
        isEn
          ? 'Could not read backup file — please choose a valid .json export.'
          : 'ไม่สามารถอ่านไฟล์ได้ กรุณาเลือกไฟล์ .json ที่ส่งออกจากแอปนี้',
      );
      window.setTimeout(() => setBackupStatusMsg(null), 4500);
    }
  };

  const handleClearSlideInk = () => {
    updateSlideStrokes(activeId, () => []);
  };

  const handleClearAllInk = () => {
    const confirmMsg = isEn
      ? 'Clear all handwritten annotations in the English version? (Thai version notes are kept separately)'
      : 'ต้องการล้างลายมือที่เขียนไว้ทั้งหมดในเวอร์ชันภาษาไทยหรือไม่? (ลายมือในเวอร์ชันภาษาอังกฤษจะถูกแยกเก็บและไม่ถูกลบ)';
    if (window.confirm(confirmMsg)) {
      const removedIds = new Set<number>([
        ...Object.keys(strokesRef.current).map(Number),
        ...Object.keys(snippetsRef.current).map(Number),
      ]);
      undoHistoryRef.current = {};
      redoHistoryRef.current = {};
      setUndoCountBySlide({});
      setRedoCountBySlide({});
      strokesRef.current = {};
      setStrokesBySlide({});
      snippetsRef.current = {};
      setSnippetsBySlide({});
      void clearDeckInk(storageDeckId, legacyInkKey);
      void clearDeckSnippets(storageDeckId);
      for (const id of removedIds) {
        if (Number.isFinite(id)) cloudSync.notifySlideDeleted(id);
      }
    }
  };

  const handleInsertBlankPage = (paperStyle: BlankPaperStyle = 'grid') => {
    const curPages = customPagesRef.current;
    const anchorSlideId =
      activeEntry.kind === 'builtin' ? activeEntry.slide.id : activeEntry.page.afterSlideId;
    const newId = curPages.reduce((minId, p) => Math.min(minId, p.id), 0) - 1;
    const newPage: CustomBlankPage = {
      id: newId,
      afterSlideId: anchorSlideId,
      order: 0,
      lecture: activeLecture,
      paperStyle,
      createdAt: Date.now(),
    };

    const sameAnchor = curPages
      .filter((p) => p.afterSlideId === anchorSlideId)
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || b.id - a.id);
    const others = curPages.filter((p) => p.afterSlideId !== anchorSlideId);

    const insertPos =
      activeEntry.kind === 'builtin'
        ? 0
        : Math.max(0, sameAnchor.findIndex((p) => p.id === activeEntry.page.id) + 1);
    const nextBucket = [
      ...sameAnchor.slice(0, insertPos),
      newPage,
      ...sameAnchor.slice(insertPos),
    ].map((p, idx) => ({ ...p, order: (idx + 1) * 10 }));

    const nextPages = [...others, ...nextBucket];
    customPagesRef.current = nextPages;
    setCustomPages(nextPages);
    void saveCustomBlankPages(storageDeckId, nextPages);
    cloudSync.notifyMetaDirty();
    setSelectTrigger(null);
    setSlideIdx(safeSlideIdx + 1);
  };

  const handleChangeBlankPaperStyle = (pageId: number, paperStyle: BlankPaperStyle) => {
    const nextPages = customPagesRef.current.map((p) =>
      p.id === pageId ? { ...p, paperStyle } : p,
    );
    customPagesRef.current = nextPages;
    setCustomPages(nextPages);
    void saveCustomBlankPages(storageDeckId, nextPages);
    cloudSync.notifyMetaDirty();
  };

  const handleDeleteBlankPage = (pageId: number) => {
    const hasInk = (strokesRef.current[pageId]?.length ?? 0) > 0;
    if (hasInk) {
      const msg = isEn
        ? 'Delete this extra note page and its handwritten notes?'
        : 'ต้องการลบหน้ากระดาษจดเพิ่มเติมนี้ (รวมถึงลายมือในหน้านี้) ใช่หรือไม่?';
      if (!window.confirm(msg)) return;
    }
    const nextPages = customPagesRef.current.filter((p) => p.id !== pageId);
    customPagesRef.current = nextPages;
    setCustomPages(nextPages);
    void saveCustomBlankPages(storageDeckId, nextPages);

    if (strokesRef.current[pageId]) {
      const nextMap = { ...strokesRef.current };
      delete nextMap[pageId];
      strokesRef.current = nextMap;
      setStrokesBySlide(nextMap);
    }
    delete undoHistoryRef.current[pageId];
    void saveSlideInk(storageDeckId, pageId, [], legacyInkKey);
    if (snippetsRef.current[pageId]) {
      const nextSnipMap = { ...snippetsRef.current };
      delete nextSnipMap[pageId];
      snippetsRef.current = nextSnipMap;
      setSnippetsBySlide(nextSnipMap);
    }
    void saveSlideSnippets(storageDeckId, pageId, []);
    cloudSync.notifySlideDeleted(pageId);
    setSelectTrigger(null);
    setSlideIdx((prev) => Math.max(0, Math.min(prev, orderedEntries.length - 2)));
  };

  const stepTextScaleDown = () => {
    setTextScale((s) => (s === 'xlarge' ? 'large' : s === 'large' ? 'normal' : 'normal'));
  };

  const stepTextScaleUp = () => {
    setTextScale((s) => (s === 'normal' ? 'large' : s === 'large' ? 'xlarge' : 'xlarge'));
  };

  const scopedEntries =
    exportScope === 'lec1'
      ? orderedEntries.filter((e) => e.lecture === 1)
      : exportScope === 'lec2'
        ? orderedEntries.filter((e) => e.lecture === 2)
        : orderedEntries;

  useEffect(() => {
    if (slideBodyRef.current) {
      slideBodyRef.current.scrollTop = 0;
    }
  }, [safeSlideIdx]);

  // 2-finger pinch-to-zoom & pan + 1-finger pan while zoomed (non-passive so iOS Safari doesn't bounce)
  useEffect(() => {
    const el = stageWrapperRef.current;
    if (!el) return;

    type GestureState =
      | {
          mode: 'pinch';
          startDist: number;
          startMidX: number;
          startMidY: number;
          startZoom: number;
          startPan: { x: number; y: number };
          wrapCenterX: number;
          wrapCenterY: number;
        }
      | {
          mode: 'pan';
          startX: number;
          startY: number;
          startPan: { x: number; y: number };
        };

    let gesture: GestureState | null = null;

    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-floating-toolbar],[data-scene-3d],button,input,a,label')) {
        gesture = null;
        return;
      }
      if (e.touches.length === 2) {
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        if (dist < 10) return;
        const rect = el.getBoundingClientRect();
        gesture = {
          mode: 'pinch',
          startDist: dist,
          startMidX: (t0.clientX + t1.clientX) / 2,
          startMidY: (t0.clientY + t1.clientY) / 2,
          startZoom: zoomRef.current,
          startPan: { ...panRef.current },
          wrapCenterX: rect.left + rect.width / 2,
          wrapCenterY: rect.top + rect.height / 2,
        };
        return;
      }
      if (e.touches.length === 1 && zoomRef.current > 1.01) {
        if (drawEnabled && !pencilOnly) {
          gesture = null;
          return;
        }
        const t = e.touches[0] as Touch & { touchType?: string };
        if (
          isStylusTouch(t) ||
          activePenIdsRef.current.size > 0 ||
          performance.now() - lastPenActivityAtRef.current < 350
        ) {
          gesture = null;
          return;
        }
        gesture = {
          mode: 'pan',
          startX: t.clientX,
          startY: t.clientY,
          startPan: { ...panRef.current },
        };
      } else {
        gesture = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!gesture) return;
      if (gesture.mode === 'pinch' && e.touches.length === 2) {
        e.preventDefault();
        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
        const curMidX = (t0.clientX + t1.clientX) / 2;
        const curMidY = (t0.clientY + t1.clientY) / 2;
        const nextZoomRaw = gesture.startZoom * (dist / Math.max(10, gesture.startDist));
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));
        const ratio = clampedZoom / Math.max(0.01, gesture.startZoom);
        const targetPan = {
          x:
            curMidX -
            gesture.wrapCenterX -
            (gesture.startMidX - gesture.wrapCenterX - gesture.startPan.x) * ratio,
          y:
            curMidY -
            gesture.wrapCenterY -
            (gesture.startMidY - gesture.wrapCenterY - gesture.startPan.y) * ratio,
        };
        zoomTo(clampedZoom, targetPan);
      } else if (gesture.mode === 'pan' && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const nextPan = {
          x: gesture.startPan.x + (t.clientX - gesture.startX),
          y: gesture.startPan.y + (t.clientY - gesture.startY),
        };
        const clampedP = clampPan(nextPan, zoomRef.current);
        panRef.current = clampedP;
        setPan(clampedP);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        gesture = null;
      } else if (e.touches.length === 1 && gesture?.mode === 'pinch') {
        gesture = null;
      }
    };

    const onWheelZoom = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const wrapCenterX = rect.left + rect.width / 2;
      const wrapCenterY = rect.top + rect.height / 2;
      const startZ = zoomRef.current;
      const nextZ = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, startZ * (1 - e.deltaY * 0.004)));
      const ratio = nextZ / Math.max(0.01, startZ);
      const targetPan = {
        x: e.clientX - wrapCenterX - (e.clientX - wrapCenterX - panRef.current.x) * ratio,
        y: e.clientY - wrapCenterY - (e.clientY - wrapCenterY - panRef.current.y) * ratio,
      };
      zoomTo(nextZ, targetPan);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    el.addEventListener('wheel', onWheelZoom, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheelZoom);
    };
  }, [clampPan, drawEnabled, pencilOnly, zoomTo]);

  const handleStageTouchStart = (e: ReactTouchEvent<HTMLElement>) => {
    if (zoom > 1.01) {
      stageSwipeRef.current = null;
      return;
    }
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
    if (
      isStylusTouch(touch) ||
      activePenIdsRef.current.size > 0 ||
      performance.now() - lastPenActivityAtRef.current < 350
    ) {
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
    if (
      e.touches?.length !== 1 ||
      activePenIdsRef.current.size > 0 ||
      performance.now() - lastPenActivityAtRef.current < 350
    ) {
      stageSwipeRef.current = null;
    }
  };

  const handleStageTouchEnd = (e: ReactTouchEvent<HTMLElement>) => {
    const start = stageSwipeRef.current;
    stageSwipeRef.current = null;
    if (!start || e.changedTouches?.length !== 1) return;
    if (zoom > 1.01) return;
    if (drawEnabled && !pencilOnly) return;
    const ct = e.changedTouches[0] as Touch & { touchType?: string };
    if (
      isStylusTouch(ct) ||
      activePenIdsRef.current.size > 0 ||
      performance.now() - lastPenActivityAtRef.current < 350
    ) {
      return;
    }
    if (performance.now() - start.t > 900) return;

    const body = slideBodyRef.current;
    const didBodyScroll = body ? Math.abs(body.scrollTop - start.scrollTop) > 4 : false;
    if (navDirection === 'vertical' && didBodyScroll) return;

    const dir = resolveSwipeDirection(ct.clientX - start.x, ct.clientY - start.y, navDirection);
    if (dir === 'next') goNext();
    else if (dir === 'prev') goPrev();
  };

  const handleStageWheel = (e: ReactWheelEvent<HTMLElement>) => {
    if (e.ctrlKey || e.metaKey) return;
    if (navDirection !== 'vertical' || zoom > 1.01) return;
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

  const copyCurrentUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      window.prompt(
        isEn
          ? 'Copy the link below and open it in Safari or Chrome:'
          : 'คัดลอกลิงก์ด้านล่างไปเปิดใน Safari หรือ Chrome:',
        window.location.href,
      );
    }
  }, [isEn]);

  const invokePrintWithFallbackCheck = useCallback(() => {
    if (printFallbackTimerRef.current !== null) {
      window.clearTimeout(printFallbackTimerRef.current);
      printFallbackTimerRef.current = null;
    }
    let beforePrintFired = false;
    const onBeforePrint = () => {
      beforePrintFired = true;
      setExportBlockedMessage(null);
    };
    window.addEventListener('beforeprint', onBeforePrint, { once: true });

    const startedAt = performance.now();
    try {
      window.print();
    } catch {
      // Restricted WebViews may throw synchronously on window.print()
    }
    const elapsed = performance.now() - startedAt;

    printFallbackTimerRef.current = window.setTimeout(() => {
      window.removeEventListener('beforeprint', onBeforePrint);
      printFallbackTimerRef.current = null;
      if (!beforePrintFired && elapsed < 400 && document.visibilityState === 'visible') {
        if (isEn) {
          setExportBlockedMessage(
            inAppBrowser.isInApp
              ? `Opened inside ${inAppBrowser.appName ?? 'an in-app browser'}, which often blocks PDF export — tap the menu (⋮ or Share) and choose "Open in Safari" / "Open in Chrome", or copy the link below.`
              : 'This browser blocked or ignored the Print/PDF dialog — copy the link to open directly in Safari or Chrome, or use your browser Share menu → Print / Save as PDF.',
          );
        } else {
          setExportBlockedMessage(
            inAppBrowser.isInApp
              ? `ตรวจพบการเปิดผ่านเบราว์เซอร์ของ ${inAppBrowser.appName ?? 'แอปภายนอก'} ซึ่งมักปิดคำสั่ง Export PDF — กรุณากดเมนู (⋮ หรือ แชร์) แล้วเลือก "เปิดใน Safari" หรือ "เปิดใน Chrome" หรือคัดลอกลิงก์ไปเปิดในเบราว์เซอร์โดยตรง`
              : 'เบราว์เซอร์นี้ไม่อนุญาตหรือบล็อกหน้าต่าง Export PDF — แนะนำให้คัดลอกลิงก์ไปเปิดใน Safari หรือ Chrome โดยตรง หรือลองกดเมนูแชร์ของเบราว์เซอร์ → พิมพ์/บันทึกเป็น PDF',
          );
        }
      }
    }, 1100);
  }, [inAppBrowser.appName, inAppBrowser.isInApp, isEn]);

  const triggerExportPdf = async (withInk: boolean) => {
    const generated: Record<number, RenderedInkExport> = {};
    if (withInk) {
      for (const entry of scopedEntries) {
        const list = strokesBySlide[entry.id];
        if (list && list.length > 0) {
          const rendered = renderStrokesForExport(list, 1920, 1080);
          if (rendered.dataUrl) generated[entry.id] = rendered;
        }
      }
    }

    const doc = document as Document & { webkitFullscreenElement?: Element | null };
    const inFullscreen = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);

    flushSync(() => {
      setExportMenuOpen(false);
      setExportBlockedMessage(null);
      if (withInk) {
        setInkImagesBySlide(generated);
        setPrintIncludeInk(true);
      } else {
        setPrintIncludeInk(false);
      }
    });

    if (inFullscreen) {
      await exitFullscreenBeforePrint();
    }
    invokePrintWithFallbackCheck();
  };

  const currentStrokes = strokesBySlide[activeId] ?? [];
  const canUndo = (undoCountBySlide[activeId] ?? 0) > 0 || currentStrokes.length > 0;
  const canRedo = (redoCountBySlide[activeId] ?? 0) > 0;
  const annotatedSlideCount = Object.values(strokesBySlide).filter(
    (list) => Array.isArray(list) && list.length > 0,
  ).length;
  const scopedAnnotatedCount = scopedEntries.filter(
    (entry) => (strokesBySlide[entry.id]?.length ?? 0) > 0,
  ).length;

  return (
    <>
      <div className="print:hidden h-dvh w-screen overflow-hidden flex flex-col bg-slate-100 text-slate-900 select-none">
        {/* Top Control Bar */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-2 sm:px-3 py-1 flex flex-wrap items-center justify-between gap-1 z-30">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[14px] sm:text-[15px] font-bold text-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">3D Dashboard</span>
            </button>
            <VersionBadge isEn={isEn} compact tone="light" />

            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSelectTrigger(null);
                  setSlideIdx(0);
                }}
                className={`px-2 py-1 rounded-lg transition ${
                  activeLecture === 1 ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {isEn ? `Lec 1 (1–${lecture1EndPage})` : `คาบ 1 (1–${lecture1EndPage})`}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectTrigger(null);
                  setSlideIdx(lecture2StartIdx >= 0 ? lecture2StartIdx : 0);
                }}
                className={`px-2 py-1 rounded-lg transition ${
                  activeLecture === 2 ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {isEn
                  ? `Lec 2 (${lecture1EndPage + 1}–${totalEntries})`
                  : `คาบ 2 (${lecture1EndPage + 1}–${totalEntries})`}
              </button>
            </div>
          </div>

          {/* Always-Accessible Top Bar Prev / Page / Next Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeSlideIdx === 0}
              aria-label={isEn ? 'Previous slide' : 'หน้าก่อนหน้า'}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-[14px] font-bold text-slate-700 disabled:opacity-40 shadow-xs transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isEn ? 'Prev' : 'ก่อนหน้า'}</span>
            </button>
            <div className="px-2 text-[14px] font-mono font-bold text-slate-700">
              {isEn
                ? `${safeSlideIdx + 1} / ${totalEntries}`
                : `หน้า ${safeSlideIdx + 1} / ${totalEntries}`}
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={safeSlideIdx === totalEntries - 1}
              aria-label={isEn ? 'Next slide' : 'หน้าถัดไป'}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[14px] font-bold disabled:opacity-40 shadow-sm transition"
            >
              <span>{isEn ? 'Next' : 'ถัดไป'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {/* Zoom Controls (100% - 300%, also supports 2-finger pinch & Ctrl+Wheel) */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[13px] font-bold"
              title={
                isEn
                  ? 'Zoom slide (supports 2-finger pinch or Ctrl+Scroll)'
                  : 'ซูมขยายสไลด์ (รองรับ 2 นิ้วถ่าง/หุบ หรือ Ctrl+หมุนลูกกลิ้ง)'
              }
            >
              <button
                type="button"
                onClick={() => zoomTo(zoom - 0.25)}
                disabled={zoom <= MIN_ZOOM + 0.01}
                aria-label={isEn ? 'Zoom out' : 'ซูมออก'}
                className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-35 transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => zoomTo(1, { x: 0, y: 0 })}
                aria-label={isEn ? 'Reset zoom to 100%' : 'รีเซ็ตซูม 100%'}
                className={`px-1.5 py-0.5 rounded-lg font-mono text-[12px] transition ${
                  zoom > 1.01 ? 'bg-sky-100 text-sky-800' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => zoomTo(zoom + 0.25)}
                disabled={zoom >= MAX_ZOOM - 0.01}
                aria-label={isEn ? 'Zoom in' : 'ซูมเข้า'}
                className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-35 transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Insert Blank Note Page */}
            <button
              type="button"
              onClick={() => handleInsertBlankPage('grid')}
              title={
                isEn
                  ? 'Insert a blank dot-grid note page right after the current slide'
                  : 'แทรกหน้ากระดาษเปล่าสำหรับจดเพิ่มต่อท้ายหน้าปัจจุบัน'
              }
              className="inline-flex items-center gap-1 px-2 py-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[13px] sm:text-[14px] font-bold transition"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isEn ? '+ Blank' : '+ หน้าเปล่า'}</span>
            </button>

            {/* Compact / Focus Writing Mode (hides footer to maximize slide space on 7" tablets) */}
            <button
              type="button"
              onClick={() => setCompactBars((c) => !c)}
              aria-label={
                isEn
                  ? compactBars
                    ? 'Show bottom navigation bar'
                    : 'Hide bottom bar for more writing space'
                  : compactBars
                    ? 'แสดงแถบด้านล่าง'
                    : 'ซ่อนแถบล่างเพื่อเพิ่มพื้นที่เขียน'
              }
              title={
                isEn
                  ? compactBars
                    ? 'Show bottom navigation bar'
                    : 'Maximize canvas space (hide bottom bar for small tablets)'
                  : compactBars
                    ? 'แสดงแถบนำทางด้านล่าง'
                    : 'ขยายพื้นที่เขียนสูงสุด (ซ่อนแถบล่าง เหมาะสำหรับจอ 7 นิ้ว)'
              }
              className={`inline-flex items-center justify-center p-1.5 rounded-xl border transition ${
                compactBars
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {compactBars ? (
                <PanelBottomOpen className="w-4 h-4" />
              ) : (
                <PanelBottomClose className="w-4 h-4" />
              )}
            </button>
            {/* Language Switcher (TH / EN) */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-[13px] font-bold"
              title={
                isEn
                  ? 'Switch slide language (Thai / English)'
                  : 'สลับภาษาสไลด์ (ไทย / English สำหรับ EP/Inter)'
              }
            >
              <button
                type="button"
                onClick={() => onChangeLang('th')}
                aria-label="ภาษาไทย"
                className={`px-2 py-0.5 rounded-lg transition ${
                  lang === 'th'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                TH
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                aria-label="English"
                className={`px-2 py-0.5 rounded-lg transition ${
                  lang === 'en'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {/* Projector Text Size Control */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[14px] font-bold"
              title={isEn ? 'Adjust slide text size for projection' : 'ปรับขนาดตัวอักษรสำหรับฉายขึ้นจอ'}
            >
              <button
                type="button"
                onClick={stepTextScaleDown}
                disabled={textScale === 'normal'}
                aria-label={isEn ? 'Decrease text size' : 'ลดขนาดตัวอักษร'}
                className="px-2 py-0.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 transition"
              >
                {isEn ? 'A-' : 'ก-'}
              </button>
              <span className="hidden 2xl:inline px-1.5 text-[13px] font-semibold text-slate-500">
                {isEn ? fs.labelEn : fs.labelTh}
              </span>
              <button
                type="button"
                onClick={stepTextScaleUp}
                disabled={textScale === 'xlarge'}
                aria-label={isEn ? 'Increase text size' : 'เพิ่มขนาดตัวอักษร'}
                className="px-2 py-0.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-40 transition"
              >
                {isEn ? 'A+' : 'ก+'}
              </button>
            </div>

            {/* Slide Navigation Direction Toggle (Horizontal / Vertical) */}
            <button
              type="button"
              onClick={() =>
                setNavDirection((d) => (d === 'horizontal' ? 'vertical' : 'horizontal'))
              }
              title={
                isEn
                  ? navDirection === 'horizontal'
                    ? 'Horizontal swipe mode (Swipe Left = Next, Swipe Right = Prev) — click to switch to vertical'
                    : 'Vertical swipe/scroll mode (Swipe Up / Scroll Down = Next) — click to switch to horizontal'
                  : navDirection === 'horizontal'
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
                  <span className="hidden sm:inline">{isEn ? 'Horiz' : 'แนวนอน'}</span>
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEn ? 'Vert' : 'แนวตั้ง'}</span>
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
              title={isEn ? 'Red laser pointer (Shortcut: L)' : 'ชี้จุดสนใจด้วยเลเซอร์สีแดง (คีย์ลัด L)'}
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
              <span>
                {isEn
                  ? drawEnabled && toolMode === 'laser'
                    ? 'Stop Laser'
                    : 'Laser'
                  : drawEnabled && toolMode === 'laser'
                    ? 'ปิดเลเซอร์'
                    : 'เลเซอร์'}
              </span>
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
                {isEn
                  ? !drawEnabled
                    ? 'Write'
                    : toolMode === 'laser'
                      ? 'Pen'
                      : 'Done'
                  : !drawEnabled
                    ? 'เขียน'
                    : toolMode === 'laser'
                      ? 'ปากกา'
                      : 'ปิดปากกา'}
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
              <span className="hidden md:inline">{isEn ? 'Outline' : 'สารบัญ'}</span>
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
                  {inAppBrowser.isInApp && (
                    <div className="px-2.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] leading-snug text-rose-900 space-y-1.5">
                      <div className="flex items-start gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>
                          {isEn
                            ? `Opened in ${inAppBrowser.appName ?? 'an in-app browser'} — PDF export may be blocked`
                            : `เปิดผ่านแอป ${inAppBrowser.appName ?? 'ภายนอก'} อาจกด Export PDF ไม่ขึ้น`}
                        </span>
                      </div>
                      <div className="text-rose-800">
                        {isEn ? (
                          <>
                            Tap the menu (⋮ / Share) and choose <b>Open in Safari / Chrome</b>
                          </>
                        ) : (
                          <>
                            กรุณากดเมนู (⋮ / แชร์) แล้วเลือก <b>เปิดใน Safari / Chrome</b>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyCurrentUrl()}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold hover:bg-rose-100 transition"
                      >
                        <Copy className="w-3 h-3" />
                        <span>
                          {isEn
                            ? linkCopied
                              ? 'Link Copied ✓'
                              : 'Copy Page Link'
                            : linkCopied
                              ? 'คัดลอกลิงก์แล้ว ✓'
                              : 'คัดลอกลิงก์เว็บ'}
                        </span>
                      </button>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-bold text-slate-500 px-1 mb-1">
                      {isEn ? 'Select slide range to export:' : 'เลือกช่วงสไลด์ที่จะส่งออก:'}
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
                        {isEn ? `All (1–${totalEntries})` : `ทั้งหมด (1–${totalEntries})`}
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
                        {isEn ? `Lec 1 (1–${lecture1EndPage})` : `คาบ 1 (1–${lecture1EndPage})`}
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
                        {isEn
                          ? `Lec 2 (${lecture1EndPage + 1}–${totalEntries})`
                          : `คาบ 2 (${lecture1EndPage + 1}–${totalEntries})`}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void triggerExportPdf(true)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-slate-800 transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-emerald-900">
                        {isEn ? 'PDF with Annotations' : 'PDF รวมลายมือที่เขียน'}
                      </span>
                      {scopedAnnotatedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          {isEn ? `${scopedAnnotatedCount} annotated` : `มีลายมือ ${scopedAnnotatedCount} หน้า`}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {isEn
                        ? `Export ${scopedEntries.length} pages with your on-screen ink`
                        : `ส่งออก ${scopedEntries.length} หน้าพร้อมสิ่งที่เขียนบนหน้าจอ`}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => void triggerExportPdf(false)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-slate-200 text-slate-800 transition"
                  >
                    <div className="font-bold text-slate-800">
                      {isEn ? 'Blank PDF Worksheet (GoodNotes)' : 'PDF สไลด์เปล่า (GoodNotes)'}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {isEn
                        ? `Export ${scopedEntries.length} clean 16:9 dot-grid slides (no ink)`
                        : `ส่งออก ${scopedEntries.length} หน้าเป็นช่องตารางจุด 16:9 ยังไม่มีลายมือ`}
                    </div>
                  </button>

                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-500 px-1">
                      {isEn ? 'Backup & Restore Notes (.json):' : 'สำรองและกู้คืนโน้ตทั้งบท (.json):'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleExportJsonBackup()}
                        className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-sky-900 font-bold text-[11px] transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Backup .json' : 'สำรองไฟล์'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => backupFileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1 px-2 py-2 rounded-xl border border-violet-200 bg-violet-50/70 hover:bg-violet-100 text-violet-900 font-bold text-[11px] transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Import .json' : 'นำเข้าไฟล์'}</span>
                      </button>
                    </div>
                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => void handleImportJsonFile(e)}
                      className="hidden"
                    />
                    {backupStatusMsg && (
                      <div className="px-2 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                        {backupStatusMsg}
                      </div>
                    )}
                  </div>

                  <div className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] leading-snug text-amber-900">
                    {isEn
                      ? 'Default layout is A4 Landscape — on iPad/Safari, if the preview opens in Portrait you can switch Orientation to Landscape (slides still fit cleanly without clipping either way).'
                      : 'ตั้งค่าเริ่มต้นเป็นแนวนอน (A4 Landscape) แล้ว — บน iPad/Safari หากหน้าตัวอย่างขึ้นแนวตั้งสามารถกดสลับเป็นแนวนอนได้ (และแม้ไม่สลับ สไลด์จะย่อพอดีกรอบไม่ตกขอบ)'}
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Sync Status / Google Sign-In */}
            <CloudSyncButton
              isEn={isEn}
              tone="light"
              compact
              syncState={cloudSync.syncState}
              lastSyncedAt={cloudSync.lastSyncedAt}
              syncError={cloudSync.syncError}
              onSyncNow={cloudSync.syncNow}
            />

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={
                isEn
                  ? isFullscreen
                    ? 'Exit fullscreen'
                    : 'Fullscreen'
                  : isFullscreen
                    ? 'ออกจากเต็มจอ'
                    : 'เต็มจอ'
              }
              title={
                isEn
                  ? isFullscreen
                    ? 'Exit fullscreen (F)'
                    : 'Enter fullscreen (F)'
                  : isFullscreen
                    ? 'ออกจากเต็มจอ (F)'
                    : 'ขยายเต็มจอ (F)'
              }
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

        {exportBlockedMessage && (
          <div
            role="alert"
            className="shrink-0 bg-rose-50 border-b border-rose-200 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-rose-900 z-25"
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-semibold leading-snug">{exportBlockedMessage}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void copyCurrentUrl()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 font-bold hover:bg-rose-100 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {isEn
                    ? linkCopied
                      ? 'Link Copied ✓'
                      : 'Copy Link for Safari/Chrome'
                    : linkCopied
                      ? 'คัดลอกลิงก์แล้ว ✓'
                      : 'คัดลอกลิงก์ไปเปิดใน Safari/Chrome'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setExportBlockedMessage(null)}
                aria-label={isEn ? 'Dismiss Export PDF notice' : 'ปิดคำแนะนำ Export PDF'}
                className="p-1 rounded-lg text-rose-700 hover:bg-rose-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Stage */}
        <div className="relative flex-1 min-h-0 flex overflow-hidden">
          {/* Overview Drawer / Thumbnail Grid Modal */}
          {overviewOpen && (
            <aside
              className={
                overviewMode === 'grid'
                  ? 'fixed inset-x-3 top-14 bottom-14 md:inset-x-8 rounded-2xl border border-slate-200 bg-white/98 backdrop-blur-md shadow-2xl z-40 flex flex-col p-4 overflow-hidden'
                  : 'w-80 shrink-0 border-r border-slate-200 bg-white overflow-y-auto custom-scrollbar p-3 space-y-1.5 z-30'
              }
            >
              <div className="shrink-0 flex items-center justify-between gap-2 px-1 pb-2 border-b border-slate-100">
                <div className="text-xs sm:text-sm font-bold text-slate-700">
                  {isEn
                    ? `Chapter 1 (${totalEntries} pages)`
                    : `สารบัญบทที่ 1 (${totalEntries} หน้า)`}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setOverviewMode('list')}
                      title={isEn ? 'List view' : 'มุมมองรายการ'}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition ${
                        overviewMode === 'list'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3 h-3" />
                      <span>{isEn ? 'List' : 'รายการ'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOverviewMode('grid')}
                      title={isEn ? 'Thumbnail grid view & reorder' : 'มุมมองตาราง & จัดลำดับหน้า'}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md transition ${
                        overviewMode === 'grid'
                          ? 'bg-white text-sky-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span>{isEn ? 'Grid' : 'ตาราง'}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInsertBlankPage('grid')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-800 transition"
                  >
                    <FilePlus2 className="w-3 h-3" />
                    <span>{isEn ? '+ Blank' : '+ หน้าเปล่า'}</span>
                  </button>
                  {overviewMode === 'grid' && (
                    <button
                      type="button"
                      onClick={() => setOverviewOpen(false)}
                      aria-label={isEn ? 'Close grid view' : 'ปิดหน้าต่างตาราง'}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {overviewMode === 'grid' && (
                <div className="shrink-0 text-[11px] text-slate-500 px-1 py-1.5">
                  {isEn
                    ? 'Tip: Drag a Blank Note sheet onto any slide (or use ◀ ▶ arrows) to reorder it.'
                    : 'เคล็ดลับ: ลากหน้ากระดาษเปล่าไปวางต่อท้ายสไลด์ที่ต้องการ หรือกดลูกศร ◀ ▶ เพื่อย้ายตำแหน่งหน้า'}
                </div>
              )}

              <div
                className={
                  overviewMode === 'grid'
                    ? 'flex-1 min-h-0 overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pt-1'
                    : 'space-y-1.5 pt-1'
                }
              >
              {orderedEntries.map((entry, idx) => {
                const pageStrokes = strokesBySlide[entry.id] ?? [];
                const pageSnippets = snippetsBySlide[entry.id] ?? [];
                const hasInk = pageStrokes.length > 0 || pageSnippets.length > 0;
                const isSelected = idx === safeSlideIdx;
                const anchorSlideId =
                  entry.kind === 'builtin' ? entry.slide.id : entry.page.afterSlideId;

                if (overviewMode === 'grid') {
                  return (
                    <div
                      key={entry.id}
                      draggable={entry.kind === 'blank'}
                      onDragStart={() => {
                        if (entry.kind === 'blank') setDragBlankId(entry.id);
                      }}
                      onDragEnd={() => setDragBlankId(null)}
                      onDragOver={(e) => {
                        if (dragBlankId !== null && dragBlankId !== entry.id) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragBlankId !== null && dragBlankId !== entry.id) {
                          handleMoveBlankAfterAnchor(dragBlankId, anchorSlideId);
                          setDragBlankId(null);
                        }
                      }}
                      className={`group rounded-2xl border p-2 flex flex-col gap-1.5 transition ${
                        isSelected
                          ? entry.kind === 'blank'
                            ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-300'
                            : 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-300'
                          : 'border-slate-200 bg-white hover:border-sky-300 hover:shadow-md'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectTrigger(null);
                          setSlideIdx(idx);
                          setOverviewOpen(false);
                        }}
                        className="text-left w-full"
                      >
                        <div
                          className={`relative aspect-[16/10] w-full rounded-xl border overflow-hidden p-2 flex flex-col justify-between ${
                            entry.kind === 'blank'
                              ? 'border-dashed border-emerald-300 bg-white'
                              : 'border-slate-200 bg-gradient-to-br from-slate-50 to-white'
                          }`}
                          style={
                            entry.kind === 'blank'
                              ? getBlankPaperStyleCss(entry.page.paperStyle)
                              : undefined
                          }
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                entry.kind === 'blank'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            {hasInk && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                {pageStrokes.length > 0 ? `${pageStrokes.length}` : 'สูตร'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight pr-1">
                            {entry.kind === 'blank'
                              ? isEn
                                ? `Blank Note #${entry.blankIndexAfterSlide}`
                                : `กระดาษจด #${entry.blankIndexAfterSlide}`
                              : isEn
                                ? entry.slide.titleEn
                                : entry.slide.titleTh}
                          </div>
                          {pageStrokes.length > 0 && <SlideMiniInkPreview strokes={pageStrokes} />}
                        </div>
                      </button>

                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <span className="font-semibold text-slate-500 truncate">
                          {entry.kind === 'blank'
                            ? isEn
                              ? 'Blank Sheet'
                              : 'กระดาษจด'
                            : entry.slide.kind === 'example'
                              ? isEn
                                ? 'Example'
                                : 'โจทย์'
                              : entry.slide.embed3D
                                ? '3D'
                                : isEn
                                  ? 'Concept'
                                  : 'เนื้อหา'}
                        </span>
                        {entry.kind === 'blank' && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx <= 1}
                              onClick={() => handleStepBlankPage(entry.id, -1)}
                              title={isEn ? 'Move earlier' : 'ย้ายขึ้นก่อนหน้า'}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-35"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx >= orderedEntries.length - 1}
                              onClick={() => handleStepBlankPage(entry.id, 1)}
                              title={isEn ? 'Move later' : 'ย้ายไปหน้าถัดไป'}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-35"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBlankPage(entry.id)}
                              title={isEn ? 'Delete blank page' : 'ลบหน้านี้'}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (entry.kind === 'blank') {
                  return (
                    <div key={entry.id} className="flex items-stretch gap-1 pl-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectTrigger(null);
                          setSlideIdx(idx);
                          setOverviewOpen(false);
                        }}
                        className={`flex-1 min-w-0 text-left px-2.5 py-1.5 rounded-xl border border-dashed text-xs transition ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] opacity-80">
                          <span>
                            {isEn
                              ? `Page ${idx + 1} • Lec ${entry.lecture}`
                              : `หน้า ${idx + 1} • คาบ ${entry.lecture}`}
                          </span>
                          <span className="flex items-center gap-1">
                            {hasInk && (
                              <span
                                title={isEn ? 'Has handwritten annotations' : 'มีลายมือที่เขียนไว้'}
                                className="inline-block w-2 h-2 rounded-full bg-amber-500"
                              />
                            )}
                            <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              {isEn ? 'Note' : 'จดเพิ่ม'}
                            </span>
                          </span>
                        </div>
                        <div className="truncate mt-0.5">
                          {isEn
                            ? `Blank Note #${entry.blankIndexAfterSlide}`
                            : `กระดาษจดเพิ่มเติม #${entry.blankIndexAfterSlide}`}
                        </div>
                      </button>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx <= 1}
                          onClick={() => handleStepBlankPage(entry.id, -1)}
                          title={isEn ? 'Move page up' : 'เลื่อนขึ้น'}
                          className="px-1.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-35"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx >= orderedEntries.length - 1}
                          onClick={() => handleStepBlankPage(entry.id, 1)}
                          title={isEn ? 'Move page down' : 'เลื่อนลง'}
                          className="px-1.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 disabled:opacity-35"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlankPage(entry.id)}
                        title={isEn ? 'Delete extra note page' : 'ลบหน้ากระดาษจดนี้'}
                        className="px-2 rounded-xl border border-rose-200/80 bg-rose-50/70 hover:bg-rose-100 text-rose-700 transition flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                const s = entry.slide;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectTrigger(null);
                      setSlideIdx(idx);
                      setOverviewOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl border text-xs sm:text-sm transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold'
                        : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] opacity-75">
                      <span>
                        {isEn
                          ? `Slide ${idx + 1} • Lec ${s.lecture}`
                          : `หน้า ${idx + 1} • คาบ ${s.lecture}`}
                      </span>
                      <span className="flex items-center gap-1">
                        {hasInk && (
                          <span
                            title={isEn ? 'Has handwritten annotations' : 'มีลายมือที่เขียนไว้'}
                            className="inline-block w-2 h-2 rounded-full bg-amber-500"
                          />
                        )}
                        <span>
                          {s.kind === 'example'
                            ? isEn
                              ? 'Example'
                              : 'โจทย์'
                            : s.embed3D
                              ? '3D'
                              : isEn
                                ? 'Concept'
                                : 'เนื้อหา'}
                        </span>
                      </span>
                    </div>
                    <div className="truncate mt-0.5">{isEn ? s.titleEn : s.titleTh}</div>
                  </button>
                );
              })}
              </div>
            </aside>
          )}

          {/* Slide Canvas Container */}
          <main
            ref={stageWrapperRef}
            onPointerDownCapture={(e) => {
              if (e.pointerType === 'pen') {
                activePenIdsRef.current.add(e.pointerId);
                lastPenActivityAtRef.current = performance.now();
                stageSwipeRef.current = null;
              }
            }}
            onPointerMoveCapture={(e) => {
              if (e.pointerType === 'pen') {
                lastPenActivityAtRef.current = performance.now();
                stageSwipeRef.current = null;
              }
            }}
            onPointerUpCapture={(e) => {
              if (e.pointerType === 'pen') {
                activePenIdsRef.current.delete(e.pointerId);
                lastPenActivityAtRef.current = performance.now();
                stageSwipeRef.current = null;
              }
            }}
            onPointerCancelCapture={(e) => {
              if (e.pointerType === 'pen') {
                activePenIdsRef.current.delete(e.pointerId);
                lastPenActivityAtRef.current = performance.now();
                stageSwipeRef.current = null;
              }
            }}
            onTouchStart={handleStageTouchStart}
            onTouchMove={handleStageTouchMove}
            onTouchEnd={handleStageTouchEnd}
            onWheel={handleStageWheel}
            className={`slide-stage-wrapper flex-1 min-h-0 flex items-center justify-center overflow-hidden overscroll-x-none relative ${
              compactBars ? 'p-0.5 sm:p-1' : 'p-1 sm:p-2'
            }`}
          >
            {/* Floating Zoom Reset Indicator when zoomed > 100% */}
            {zoom > 1.01 && (
              <div
                data-floating-toolbar="true"
                className="absolute top-2 left-2 z-40 flex items-center gap-1.5 rounded-full border border-sky-300 bg-white/95 backdrop-blur-md px-2.5 py-1 shadow-md text-xs font-bold text-sky-800"
              >
                <span className="font-mono">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => zoomTo(1, { x: 0, y: 0 })}
                  className="px-2 py-0.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-[11px] transition"
                >
                  {isEn ? 'Reset' : '100%'}
                </button>
              </div>
            )}
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
                    setQuickRowOpen(true);
                  }}
                  title={isEn ? 'Enter Write mode (Shortcut: W)' : 'เข้าสู่โหมดเขียน (คีย์ลัด W)'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition active:scale-95"
                >
                  <PenTool className="w-4 h-4" />
                  <span>{isEn ? 'Write' : 'เขียน'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDrawEnabled(true);
                    setToolMode('laser');
                    setQuickRowOpen(true);
                  }}
                  title={isEn ? 'Turn on laser pointer (Shortcut: L)' : 'เปิดเลเซอร์ชี้จุด (คีย์ลัด L)'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-bold transition active:scale-95"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.85)]" />
                  <span>{isEn ? 'Laser' : 'เลเซอร์'}</span>
                </button>
              </div>
            )}

            {/* Notability-Style Compact Dual-Row Floating Pill Toolbar */}
            {drawEnabled && (() => {
              const dockPosClass = customToolbarPos
                ? 'flex-col'
                : toolbarPos === 'top'
                  ? 'top-2.5 left-1/2 -translate-x-1/2 flex-col'
                  : 'bottom-2.5 left-1/2 -translate-x-1/2 flex-col';
              const popoverPosClass = customToolbarPos
                ? customToolbarPos.y > STAGE_HEIGHT * stageScale * 0.5
                  ? 'bottom-full mb-2 right-0'
                  : 'top-full mt-2 right-0'
                : toolbarPos === 'top'
                  ? 'top-full mt-2 right-0'
                  : 'bottom-full mb-2 right-0';

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

              const selectMainTool = (targetTool: AnnotationTool) => {
                setColorPickerOpen(false);
                setSizePopoverOpen(false);
                if (toolMode === targetTool) {
                  setQuickRowOpen((o) => !o);
                } else {
                  setToolMode(targetTool);
                  setQuickRowOpen(true);
                }
              };

              const isHl = toolMode === 'highlighter';
              const activeSwatches = isHl ? HIGHLIGHTER_COLORS : PEN_COLORS;
              const activeInkColor = isHl ? highlighterColor : penColor;
              const activeInkWidth =
                toolMode === 'eraser' ? eraserSize : isHl ? highlighterWidth : penWidth;
              const previewDotPx =
                toolMode === 'eraser'
                  ? Math.max(6, Math.min(18, eraserSize * 1.4))
                  : isHl
                    ? Math.max(8, Math.min(20, highlighterWidth * 0.65))
                    : Math.max(4, Math.min(16, penWidth * 1.6));

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
                  className={`absolute z-40 max-w-[95vw] rounded-2xl border border-amber-300 bg-amber-50/95 text-slate-800 backdrop-blur-md shadow-xl flex touch-none ${dockPosClass}`}
                >
                  {toolbarCollapsed ? (
                    <div className="flex items-center gap-1 p-1.5 text-xs">
                      <div
                        data-toolbar-drag="true"
                        title={isEn ? 'Drag toolbar' : 'ลากย้ายแถบ'}
                        className="px-1 py-1 rounded-lg text-amber-700 hover:bg-amber-100 cursor-grab active:cursor-grabbing touch-none"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDrawEnabled(false);
                          setColorPickerOpen(false);
                          setSizePopoverOpen(false);
                        }}
                        title={isEn ? 'Done (W)' : 'เสร็จ (W)'}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToolbarCollapsed(false)}
                        title={isEn ? 'Expand toolbar' : 'ขยายแถบเครื่องมือ'}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs"
                      >
                        {toolMode === 'highlighter' ? (
                          <Highlighter className="w-3.5 h-3.5" />
                        ) : toolMode === 'eraser' ? (
                          <Eraser className="w-3.5 h-3.5" />
                        ) : toolMode === 'select' ? (
                          <Lasso className="w-3.5 h-3.5" />
                        ) : (
                          <PenTool className="w-3.5 h-3.5" />
                        )}
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleUndoStroke}
                        disabled={!canUndo}
                        aria-label={isEn ? 'Undo' : 'ย้อน'}
                        className="p-1.5 rounded-lg bg-white border border-amber-200 text-slate-700 hover:bg-amber-100 disabled:opacity-35"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Row 1: Contextual Quick Bar (folds away when tapping the active main tool button) */}
                      {quickRowOpen && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-amber-200/90 overflow-x-auto">
                          {(toolMode === 'pen' || toolMode === 'highlighter') && (
                            <>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {activeSwatches.map((c) => {
                                  const isSel = activeInkColor.toLowerCase() === c.color.toLowerCase();
                                  return (
                                    <button
                                      key={c.color}
                                      type="button"
                                      onClick={() => {
                                        if (isSel) {
                                          setSizePopoverOpen(false);
                                          setColorPickerOpen((o) => !o);
                                        } else if (isHl) {
                                          setHighlighterColor(c.color);
                                        } else {
                                          setPenColor(c.color);
                                        }
                                      }}
                                      title={isEn ? c.labelEn : c.label}
                                      aria-label={isEn ? c.labelEn : c.label}
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                                        isSel
                                          ? 'border-slate-900 ring-2 ring-amber-400 scale-110 shadow-sm'
                                          : 'border-white shadow-xs hover:scale-105'
                                      }`}
                                      style={{ backgroundColor: c.color }}
                                    >
                                      {isSel && (
                                        <PenTool
                                          className={`w-2.5 h-2.5 ${
                                            isHl || c.color === '#d97706' ? 'text-slate-900' : 'text-white'
                                          }`}
                                        />
                                      )}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSizePopoverOpen(false);
                                    setColorPickerOpen((o) => !o);
                                  }}
                                  title={isEn ? 'More colors' : 'สีเพิ่มเติม'}
                                  aria-label={isEn ? 'More colors' : 'สีเพิ่มเติม'}
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                                    colorPickerOpen
                                      ? 'border-amber-600 bg-amber-500 text-white'
                                      : 'border-amber-200 bg-white text-slate-700 hover:bg-amber-100'
                                  }`}
                                >
                                  <Palette className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="w-px h-5 bg-amber-200 shrink-0" />

                              {/* Direct 1-Tap Size Chips for Pen & Highlighter */}
                              <div className="flex items-center gap-1 shrink-0 text-[11px] font-bold">
                                {(isHl ? [12, 18, 28] : [2, 4, 7]).map((w, idx) => {
                                  const label = isEn
                                    ? idx === 0
                                      ? 'S'
                                      : idx === 1
                                        ? 'M'
                                        : 'L'
                                    : idx === 0
                                      ? 'เล็ก'
                                      : idx === 1
                                        ? 'กลาง'
                                        : 'หนา';
                                  const isSelW = isHl ? highlighterWidth === w : penWidth === w;
                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => {
                                        if (isHl) setHighlighterWidth(w);
                                        else setPenWidth(w);
                                      }}
                                      className={`px-2 py-0.5 rounded-lg border transition ${
                                        isSelW
                                          ? isHl
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                            : 'bg-sky-600 text-white border-sky-600 shadow-xs'
                                          : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/70'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setColorPickerOpen(false);
                                  setSizePopoverOpen((o) => !o);
                                }}
                                title={
                                  isEn
                                    ? 'Fine size, fountain pen & smart shapes'
                                    : 'ปรับขนาดละเอียด แรงกดปากกา และรูปทรงอัตโนมัติ'
                                }
                                aria-label={isEn ? 'Pen settings' : 'ตั้งค่าหัวปากกา'}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                  sizePopoverOpen
                                    ? 'border-sky-600 bg-sky-50'
                                    : 'border-amber-300 bg-white hover:border-amber-500'
                                }`}
                              >
                                <span
                                  className="rounded-full border border-slate-300/60"
                                  style={{
                                    width: previewDotPx,
                                    height: previewDotPx,
                                    backgroundColor: activeInkColor,
                                  }}
                                />
                              </button>
                            </>
                          )}

                          {toolMode === 'eraser' && (
                            <div className="flex items-center justify-between gap-1.5 w-full text-[11px] font-bold">
                              <div className="inline-flex items-center rounded-lg bg-white p-0.5 border border-rose-200 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setEraserMode('partial')}
                                  className={`px-2 py-0.5 rounded-md transition ${
                                    eraserMode === 'partial'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-rose-700 hover:bg-rose-50'
                                  }`}
                                >
                                  {isEn ? 'Partial' : 'บางส่วน'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEraserMode('stroke')}
                                  className={`px-2 py-0.5 rounded-md transition ${
                                    eraserMode === 'stroke'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-rose-700 hover:bg-rose-50'
                                  }`}
                                >
                                  {isEn ? 'Stroke' : 'ทั้งเส้น'}
                                </button>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {[3, 6, 12].map((w, idx) => {
                                  const label = isEn
                                    ? idx === 0
                                      ? 'S'
                                      : idx === 1
                                        ? 'M'
                                        : 'L'
                                    : idx === 0
                                      ? 'เล็ก'
                                      : idx === 1
                                        ? 'กลาง'
                                        : 'ใหญ่';
                                  return (
                                    <button
                                      key={label}
                                      type="button"
                                      onClick={() => setEraserSize(w)}
                                      className={`px-2 py-0.5 rounded-lg border transition ${
                                        eraserSize === w
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                          : 'bg-white text-slate-700 border-rose-200 hover:bg-rose-50'
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setColorPickerOpen(false);
                                  setSizePopoverOpen((o) => !o);
                                }}
                                title={isEn ? 'Fine eraser size' : 'ปรับขนาดยางลบละเอียด'}
                                aria-label={isEn ? 'Eraser size' : 'ขนาดยางลบ'}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                  sizePopoverOpen
                                    ? 'border-rose-600 bg-rose-50'
                                    : 'border-rose-300 bg-white hover:border-rose-500'
                                }`}
                              >
                                <span
                                  className="rounded-full bg-rose-500"
                                  style={{ width: previewDotPx, height: previewDotPx }}
                                />
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={handleClearSlideInk}
                                  disabled={currentStrokes.length === 0}
                                  className="px-2 py-1 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 disabled:opacity-35 transition"
                                >
                                  {isEn ? 'Clear Page' : 'ล้างหน้า'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleClearAllInk}
                                  disabled={annotatedSlideCount === 0}
                                  className="px-2 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 disabled:opacity-35 transition"
                                >
                                  {isEn ? 'All' : 'ล้างหมด'}
                                </button>
                              </div>
                            </div>
                          )}

                          {toolMode === 'laser' && (
                            <div className="flex items-center justify-between gap-2 w-full text-[11px] font-bold">
                              <span className="text-red-700 shrink-0">
                                {isEn ? 'Laser Mode' : 'โหมดเลเซอร์'}
                              </span>
                              <div className="inline-flex items-center rounded-lg bg-white p-0.5 border border-red-200">
                                <button
                                  type="button"
                                  onClick={() => setLaserStyle('trail')}
                                  className={`px-2 py-0.5 rounded-md transition ${
                                    laserStyle === 'trail'
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : 'text-red-700 hover:bg-red-50'
                                  }`}
                                >
                                  {isEn ? 'Trail' : 'วง/ขีดค้าง'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setLaserStyle('dot')}
                                  className={`px-2 py-0.5 rounded-md transition ${
                                    laserStyle === 'dot'
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : 'text-red-700 hover:bg-red-50'
                                  }`}
                                >
                                  {isEn ? 'Dot' : 'จุดชี้'}
                                </button>
                              </div>
                            </div>
                          )}

                          {toolMode === 'select' && (
                            <div className="flex items-center justify-between gap-1.5 w-full text-[11px] font-bold">
                              <div className="inline-flex items-center rounded-lg bg-white p-0.5 border border-sky-200 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setSelectionShape('lasso')}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition ${
                                    selectionShape === 'lasso'
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'text-sky-800 hover:bg-sky-50'
                                  }`}
                                >
                                  <Lasso className="w-3 h-3" />
                                  <span>{isEn ? 'Lasso' : 'วงอิสระ'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectionShape('rect')}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition ${
                                    selectionShape === 'rect'
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'text-sky-800 hover:bg-sky-50'
                                  }`}
                                >
                                  <SquareDashed className="w-3 h-3" />
                                  <span>{isEn ? 'Rect' : 'สี่เหลี่ยม'}</span>
                                </button>
                              </div>
                              {(clipboardStrokes.length > 0 || clipboardSnippets.length > 0) && (() => {
                                const pasteCount = clipboardStrokes.length + clipboardSnippets.length;
                                return (
                                  <button
                                    type="button"
                                    onClick={handlePasteClipboard}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition shrink-0"
                                  >
                                    <ClipboardPaste className="w-3 h-3" />
                                    <span>{isEn ? `Paste (${pasteCount})` : `วาง (${pasteCount})`}</span>
                                  </button>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Row 2: Main Compact Tool Dock (tapping active tool folds/unfolds Row 1) */}
                      <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto text-xs font-bold">
                        <div
                          data-toolbar-drag="true"
                          title={isEn ? 'Drag toolbar' : 'ลากย้ายตำแหน่งแถบ'}
                          className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 cursor-grab active:cursor-grabbing touch-none shrink-0"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDrawEnabled(false);
                            setColorPickerOpen(false);
                            setSizePopoverOpen(false);
                          }}
                          title={isEn ? 'Done writing (W)' : 'เสร็จ (W)'}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isEn ? 'Done' : 'เสร็จ'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => selectMainTool('pen')}
                          title={
                            isEn
                              ? 'Pen (tap again to toggle options bar)'
                              : 'ปากกา (กดซ้ำเพื่อพับ/เปิดแถบสีและตัวเลือก)'
                          }
                          aria-label={isEn ? 'Pen' : 'ปากกา'}
                          className={`p-1.5 rounded-lg border transition shrink-0 ${
                            toolMode === 'pen'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/70'
                          }`}
                        >
                          <PenTool className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => selectMainTool('highlighter')}
                          title={
                            isEn
                              ? 'Highlighter (tap again to toggle options bar)'
                              : 'ปากกาไฮไลต์ (กดซ้ำเพื่อพับ/เปิดแถบสีและขนาด)'
                          }
                          aria-label={isEn ? 'Highlighter' : 'ไฮไลต์'}
                          className={`p-1.5 rounded-lg border transition shrink-0 ${
                            toolMode === 'highlighter'
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/70'
                          }`}
                        >
                          <Highlighter className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => selectMainTool('eraser')}
                          title={
                            isEn
                              ? 'Eraser (tap again to toggle options bar)'
                              : 'ยางลบ (กดซ้ำเพื่อพับ/เปิดแถบขนาด)'
                          }
                          aria-label={isEn ? 'Eraser' : 'ยางลบ'}
                          className={`p-1.5 rounded-lg border transition shrink-0 ${
                            toolMode === 'eraser'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/70'
                          }`}
                        >
                          <Eraser className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => selectMainTool('laser')}
                          title={
                            isEn
                              ? 'Laser Pointer (tap again to toggle options bar)'
                              : 'เลเซอร์ (กดซ้ำเพื่อพับ/เปิดแถบ)'
                          }
                          aria-label={isEn ? 'Laser' : 'เลเซอร์'}
                          className={`p-1.5 rounded-lg border transition shrink-0 ${
                            toolMode === 'laser'
                              ? 'bg-red-600 text-white border-red-600 shadow-xs'
                              : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                          }`}
                        >
                          <span
                            className={`block w-3 h-3 rounded-full m-0.5 ${
                              toolMode === 'laser' ? 'bg-white' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => selectMainTool('select')}
                          title={
                            isEn
                              ? 'Select / Resize / Recolor / Copy (tap again to toggle bar)'
                              : 'เลือก / ย่อขยาย / เปลี่ยนสี / คัดลอก (กดซ้ำเพื่อพับ/เปิดแถบ)'
                          }
                          aria-label={isEn ? 'Select' : 'เลือก'}
                          className={`p-1.5 rounded-lg border transition shrink-0 ${
                            toolMode === 'select'
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                          }`}
                        >
                          {selectionShape === 'lasso' ? (
                            <Lasso className="w-4 h-4" />
                          ) : (
                            <SquareDashed className="w-4 h-4" />
                          )}
                        </button>

                        <div className="w-px h-5 bg-amber-200 shrink-0 mx-0.5" />

                        <button
                          type="button"
                          onClick={handleUndoStroke}
                          disabled={!canUndo}
                          title={isEn ? 'Undo (Ctrl+Z)' : 'ย้อนกลับ (Ctrl+Z)'}
                          aria-label={isEn ? 'Undo' : 'ย้อน'}
                          className="p-1.5 rounded-lg bg-white border border-amber-200 text-slate-700 hover:bg-amber-100/70 disabled:opacity-35 shrink-0 transition"
                        >
                          <Undo2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={handleRedoStroke}
                          disabled={!canRedo}
                          title={isEn ? 'Redo (Ctrl+Y)' : 'ทำซ้ำ (Ctrl+Y)'}
                          aria-label={isEn ? 'Redo' : 'ทำซ้ำ'}
                          className="p-1.5 rounded-lg bg-white border border-amber-200 text-slate-700 hover:bg-amber-100/70 disabled:opacity-35 shrink-0 transition"
                        >
                          <Redo2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPencilOnly((p) => !p)}
                          title={
                            isEn
                              ? pencilOnly
                                ? 'Pencil Only (tap to allow finger drawing)'
                                : 'Touch + Pen (tap for Pencil Only)'
                              : pencilOnly
                                ? 'เฉพาะปากกา (แตะเพื่อสลับใช้นิ้ววาดได้)'
                                : 'นิ้ว+ปากกา (แตะเพื่อสลับเฉพาะปากกา)'
                          }
                          aria-label={pencilOnly ? (isEn ? 'Pencil Only' : 'เฉพาะปากกา') : (isEn ? 'Touch+Pen' : 'นิ้ว+ปากกา')}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border shrink-0 transition ${
                            pencilOnly
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {pencilOnly ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Hand className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden md:inline">
                            {pencilOnly ? (isEn ? 'Pen' : 'ปากกา') : isEn ? 'Touch' : 'นิ้ว+ปากกา'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setColorPickerOpen(false);
                            setSizePopoverOpen(false);
                            setToolbarCollapsed(true);
                          }}
                          title={isEn ? 'Collapse toolbar' : 'พับเก็บแถบ'}
                          aria-label={isEn ? 'Collapse toolbar' : 'พับแถบ'}
                          className="p-1.5 rounded-lg bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 shrink-0 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Extended Color Picker Popover */}
                      {colorPickerOpen && (
                        <div
                          className={`absolute ${popoverPosClass} w-64 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl p-3 z-50 space-y-2.5`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span>
                              {isHl
                                ? isEn
                                  ? 'Highlighter Color'
                                  : 'สีปากกาไฮไลต์'
                                : isEn
                                  ? 'Pen Color'
                                  : 'เลือกสีปากกา'}
                            </span>
                            <span className="font-mono text-[11px] uppercase text-slate-500">
                              {activeInkColor}
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {(isHl ? HIGHLIGHTER_COLORS : EXTENDED_PEN_COLORS).map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                  if (isHl) setHighlighterColor(c.color);
                                  else setPenColor(c.color);
                                  setColorPickerOpen(false);
                                }}
                                title={isEn ? c.labelEn : c.label}
                                className={`w-7 h-7 rounded-full border-2 transition ${
                                  activeInkColor.toLowerCase() === c.color.toLowerCase()
                                    ? 'border-slate-900 scale-110 shadow'
                                    : 'border-white shadow-xs hover:scale-105'
                                }`}
                                style={{ backgroundColor: c.color }}
                              />
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                            <label htmlFor="custom-pen-color" className="text-xs font-semibold text-slate-700 cursor-pointer">
                              {isEn ? 'Custom:' : 'สีอิสระ:'}
                            </label>
                            <input
                              id="custom-pen-color"
                              type="color"
                              value={activeInkColor}
                              onChange={(e) => {
                                if (isHl) setHighlighterColor(e.target.value);
                                else setPenColor(e.target.value);
                              }}
                              className="h-7 w-14 rounded border border-slate-200 bg-white cursor-pointer"
                            />
                          </div>
                        </div>
                      )}

                      {/* Pen / Highlighter / Eraser Settings Popover */}
                      {sizePopoverOpen && (
                        <div
                          className={`absolute ${popoverPosClass} w-68 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl p-3 z-50 space-y-3 text-xs`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between font-bold text-slate-700">
                              <span>
                                {toolMode === 'eraser'
                                  ? isEn
                                    ? 'Eraser Size'
                                    : 'ขนาดยางลบ'
                                  : isHl
                                    ? isEn
                                      ? 'Highlighter Thickness'
                                      : 'ความหนาไฮไลต์'
                                    : isEn
                                      ? 'Pen Thickness'
                                      : 'ความหนาเส้นปากกา'}
                              </span>
                              <span className="font-mono text-sky-700">{activeInkWidth}px</span>
                            </div>
                            <input
                              type="range"
                              min={toolMode === 'eraser' ? 3 : isHl ? 10 : 1.5}
                              max={toolMode === 'eraser' ? 16 : isHl ? 32 : 10}
                              step={toolMode === 'eraser' ? 1 : isHl ? 2 : 0.5}
                              value={activeInkWidth}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (toolMode === 'eraser') setEraserSize(val);
                                else if (isHl) setHighlighterWidth(val);
                                else setPenWidth(val);
                              }}
                              className="w-full accent-sky-600 cursor-pointer"
                            />
                          </div>

                          {toolMode === 'pen' && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                <Feather className="w-3.5 h-3.5 text-sky-600" />
                                <span>{isEn ? 'Pen Nib Style' : 'สไตล์หัวปากกา'}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => setPenStyle('mono')}
                                  className={`py-1 px-2 rounded-md font-semibold transition ${
                                    penStyle === 'mono'
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {isEn ? 'Ballpoint' : 'เส้นสม่ำเสมอ'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPenStyle('fountain')}
                                  className={`py-1 px-2 rounded-md font-semibold transition ${
                                    penStyle === 'fountain'
                                      ? 'bg-sky-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {isEn ? 'Fountain (Pressure)' : 'ตามแรงกด (Fountain)'}
                                </button>
                              </div>
                            </div>
                          )}

                          {(toolMode === 'pen' || toolMode === 'highlighter') && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-200">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                <Shapes className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isEn ? 'Hold-to-Snap (~0.5s)' : 'ลากค้าง ~0.5 วิ จัดรูปอัตโนมัติ'}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                                {(
                                  [
                                    { id: 'off', th: 'ปิด', en: 'Off' },
                                    { id: 'line', th: 'เส้นตรง', en: 'Line' },
                                    { id: 'smart', th: 'รูปทรง/→', en: 'Shapes' },
                                  ] as const
                                ).map((opt) => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSnapShapeMode(opt.id)}
                                    className={`py-1 px-1.5 rounded-md font-semibold transition ${
                                      snapShapeMode === opt.id
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                  >
                                    {isEn ? opt.en : opt.th}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                            <span className="text-slate-600 font-semibold">
                              {isEn ? 'Dock Position:' : 'ตำแหน่งแถบ:'}
                            </span>
                            <div className="inline-flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                              {(['top', 'bottom'] as const).map((pos) => (
                                <button
                                  key={pos}
                                  type="button"
                                  onClick={() => {
                                    setCustomToolbarPos(null);
                                    setToolbarPos(pos);
                                  }}
                                  className={`px-2 py-0.5 rounded-md font-bold transition ${
                                    !customToolbarPos && toolbarPos === pos
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {pos === 'top' ? (isEn ? 'Top' : 'บน') : isEn ? 'Bottom' : 'ล่าง'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* Scaled Fixed-Resolution 1280x720 Slide Stage (Zero Ink Shift on Resize/Fullscreen/Zoom) */}
            <div
              className="relative shrink-0"
              style={{
                width: Math.round(STAGE_WIDTH * stageScale),
                height: Math.round(STAGE_HEIGHT * stageScale),
                transform:
                  zoom > 1.005 || pan.x !== 0 || pan.y !== 0
                    ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`
                    : undefined,
                transformOrigin: 'center center',
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
              {/* Scrollable Slide Body (Header + Body + AnnotationCanvas together so finger scroll, wheel & swipe always work!) */}
              <div
                ref={slideBodyRef}
                className={`flex-1 min-h-0 overflow-y-auto overscroll-x-none custom-scrollbar flex flex-col ${
                  drawEnabled ? 'select-none' : 'select-text'
                }`}
              >
                <div className="relative flex-1 flex flex-col">
              {/* Slide Header (Built-in vs Blank Note Page) */}
              {activeEntry.kind === 'blank' ? (
                <div
                  ref={slideHeaderRef}
                  className="shrink-0 px-6 pt-2.5 pb-2 border-b border-slate-200 bg-gradient-to-r from-emerald-50/70 via-white to-sky-50/50 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[20px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                        01417168
                      </span>
                      <span className="text-emerald-700">
                        {isEn ? `Lecture ${activeLecture}` : `คาบที่ ${activeLecture}`}
                      </span>
                      <span className="text-slate-400">
                        • {isEn ? 'Extra Note Page' : 'หน้ากระดาษจดเพิ่มเติม'}
                      </span>
                    </div>
                    <h2 className={`${fs.title} font-extrabold text-slate-900 mt-0.5`}>
                      {isEn
                        ? `Blank Note Sheet #${activeEntry.blankIndexAfterSlide}`
                        : `กระดาษจดเพิ่มเติม #${activeEntry.blankIndexAfterSlide}`}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 text-[16px] font-bold">
                      {(
                        [
                          { id: 'grid', th: 'กระดาษจุด', en: 'Dot Grid' },
                          { id: 'lined', th: 'มีเส้น', en: 'Lined' },
                          { id: 'blank', th: 'หน้าเปล่า', en: 'Blank' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleChangeBlankPaperStyle(activeEntry.page.id, opt.id)}
                          className={`px-3 py-1 rounded-lg transition ${
                            activeEntry.page.paperStyle === opt.id
                              ? 'bg-white text-emerald-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isEn ? opt.en : opt.th}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBlankPage(activeEntry.page.id)}
                      title={isEn ? 'Delete this blank page' : 'ลบหน้ากระดาษเปล่านี้'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[16px] font-bold transition"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isEn ? 'Delete Page' : 'ลบหน้านี้'}</span>
                    </button>

                    <div className="text-[20px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600">
                      {safeSlideIdx + 1} / {totalEntries}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={slideHeaderRef}
                  className="shrink-0 px-6 pt-2.5 pb-1.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/60 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[20px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                        01417168
                      </span>
                      <span className="text-sky-700">{activeLoc?.primaryTag}</span>
                      <span className="text-slate-400">• {activeLoc?.secondaryTag}</span>
                      {activeBuiltinSlide?.embed3D && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[16px]">
                          <Sparkles className="w-3.5 h-3.5" /> Interactive 3D
                        </span>
                      )}
                    </div>
                    <h2 className={`${fs.title} font-extrabold text-slate-900 mt-0.5`}>
                      {activeLoc?.title}
                    </h2>
                    {activeLoc?.subtitle && (
                      <p className={`${fs.subtitle} text-slate-500`}>{activeLoc.subtitle}</p>
                    )}
                  </div>

                  <div className="text-[20px] font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                    {safeSlideIdx + 1} / {totalEntries}
                  </div>
                </div>
              )}

                <div
                  ref={slideBodyAreaRef}
                  className={`relative flex-1 min-h-0 flex flex-col ${
                    activeBuiltinSlide?.kind === 'example' || activeEntry.kind === 'blank'
                      ? 'p-2.5'
                      : 'p-3.5'
                  }`}
                >
                {activeEntry.kind === 'blank' ? (
                  <div
                    className="flex-1 rounded-2xl border border-dashed border-slate-300 bg-white p-4 flex items-end justify-end text-sm text-slate-400"
                    style={getBlankPaperStyleCss(activeEntry.page.paperStyle)}
                  >
                    {isEn
                      ? 'Blank note sheet — use "Write" or Apple Pencil to jot extra derivations'
                      : 'หน้ากระดาษจดเพิ่มเติม — เปิด “เขียน” เพื่อจดทดลองคำนวณหรือตัวอย่างเพิ่มได้เต็มหน้า'}
                  </div>
                ) : activeBuiltinSlide?.kind === 'example' && activeLoc?.examples ? (
                  <div
                    className={`flex-1 min-h-0 flex flex-col ${
                      activeLoc.examples.length > 1 ? 'gap-1.5' : 'gap-2.5'
                    }`}
                  >
                    {activeLoc.examples.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/60 ${
                          activeLoc.examples && activeLoc.examples.length > 1
                            ? 'p-2 gap-1'
                            : 'p-3 gap-1.5'
                        }`}
                      >
                        <div className={activeLoc.examples && activeLoc.examples.length > 1 ? 'space-y-1' : 'space-y-1.5'}>
                          <div
                            data-snip-type="prompt"
                            data-snip-idx={String(exIdx)}
                            className={`${fs.exPrompt} font-bold text-slate-900 leading-snug rounded-lg`}
                          >
                            {ex.displayLabel && (
                              <span
                                className={`mr-2 px-2.5 py-0.5 rounded-md text-[22px] font-bold ${
                                  ex.displayLabel.includes('แนวข้อสอบ') ||
                                  ex.displayLabel.includes('Drill')
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {ex.displayLabel}
                              </span>
                            )}
                            <RichMathText text={ex.displayPrompt} />
                          </div>
                          {ex.displayLatex && (
                            <div
                              data-snip-type="ex-formula"
                              data-snip-idx={String(exIdx)}
                              className={`px-3 py-1 rounded-xl bg-white border border-slate-200 inline-block max-w-full overflow-x-auto overflow-y-hidden leading-normal text-sky-900 ${fs.exLatex}`}
                            >
                              <KaTeX math={ex.displayLatex} />
                            </div>
                          )}
                        </div>

                        {(() => {
                          const writeArea = (
                            <div
                              className={`${ex.scene3D ? 'col-span-8 h-full' : 'flex-1'} ${
                                activeLoc.examples && activeLoc.examples.length > 1
                                  ? 'min-h-[165px]'
                                  : 'min-h-[250px]'
                              } rounded-2xl border border-dashed border-slate-300 bg-white p-3 flex items-end justify-end text-xs text-slate-400`}
                              style={{
                                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                              }}
                            >
                              {isEn
                                ? 'Enable "Write" to annotate live with Apple Pencil'
                                : 'เปิด “เขียน” เพื่อเขียนวิธีทำสดด้วย Apple Pencil'}
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
                                  hintTh={ex.displaySceneHint}
                                  compact
                                  aboveInk={drawEnabled && toolMode !== 'laser'}
                                  lang={lang}
                                  onOpenDashboard={(() => {
                                    if (!onOpenDashboardTarget || !activeBuiltinSlide) return undefined;
                                    const target = getExampleDashboardTarget(activeBuiltinSlide.id, exIdx);
                                    return target ? () => onOpenDashboardTarget(target) : undefined;
                                  })()}
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
                      activeBuiltinSlide?.embed3D ? 'grid-cols-12 items-start' : 'grid-cols-1'
                    }`}
                  >
                    <div
                      className={
                        activeBuiltinSlide?.embed3D
                          ? 'col-span-6 my-auto flex flex-col gap-2.5'
                          : activeBuiltinSlide?.kind === 'summary'
                            ? 'grid grid-cols-2 gap-3 items-stretch'
                            : 'my-auto flex flex-col gap-2.5'
                      }
                    >
                      {activeLoc?.cards?.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          data-snip-type="card"
                          data-snip-idx={String(cIdx)}
                          className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${
                            activeBuiltinSlide?.kind === 'summary'
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
                                  data-snip-type="formula"
                                  data-snip-card={String(cIdx)}
                                  data-snip-formula={String(fIdx)}
                                  className={`rounded-xl border px-3 py-1.5 ${toneClasses(f.tone)}`}
                                >
                                  {f.label && (
                                    <div className={`${fs.formulaLabel} font-semibold opacity-75 mb-0.5`}>
                                      {f.label}
                                    </div>
                                  )}
                                  <div
                                    className={`overflow-x-auto overflow-y-hidden leading-normal py-0.5 ${
                                      activeBuiltinSlide?.kind === 'summary' ? 'text-[20px]' : fs.formula
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

                    {activeBuiltinSlide?.embed3D && (
                      <div
                        className={`col-span-6 sticky top-0 h-[520px] ${
                          drawEnabled && toolMode !== 'laser' ? 'z-[25]' : 'z-10'
                        }`}
                      >
                        <MiniScene3D
                          embed={activeBuiltinSlide.embed3D}
                          hintTh={activeLoc?.embedHint}
                          aboveInk={drawEnabled && toolMode !== 'laser'}
                          lang={lang}
                          onOpenDashboardTarget={onOpenDashboardTarget}
                        />
                      </div>
                    )}
                  </div>
                )}

                  {/* Pasted Formula / Card Snippets (z-[15] under ink canvas so notes write cleanly on top) */}
                  {currentSnippets.map((snip) => (
                    <div
                      key={snip.id}
                      data-snip-type="pasted"
                      data-snip-id={snip.id}
                      style={{
                        left: `${snip.x * 100}%`,
                        top: `${snip.y * 100}%`,
                        width: `${snip.w * 100}%`,
                      }}
                      className={`absolute z-[15] pointer-events-none rounded-xl border px-3 py-2 shadow-md ${
                        snip.kind === 'formula'
                          ? toneClasses(snip.tone)
                          : snip.kind === 'prompt'
                            ? 'bg-sky-50/95 border-sky-300 text-slate-900'
                            : 'bg-slate-50/95 border-slate-300 text-slate-900'
                      }`}
                    >
                      {snip.label && (
                        <div className="text-[13px] font-bold opacity-75 mb-0.5 pr-16">
                          {snip.label}
                        </div>
                      )}
                      {snip.latex && (
                        <div className="text-[20px] leading-normal overflow-x-auto overflow-y-hidden py-0.5">
                          <KaTeX math={snip.latex} />
                        </div>
                      )}
                      {snip.text && (
                        <div className="text-[15px] font-semibold leading-snug whitespace-pre-line mt-0.5">
                          <RichMathText text={snip.text} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Floating Drag / Resize / Delete Handles for Pasted Snippets (z-[24] above ink canvas) */}
                  {toolMode !== 'laser' &&
                    currentSnippets.map((snip) => (
                      <div
                        key={`ctrl_${snip.id}`}
                        data-floating-toolbar="true"
                        style={{
                          left: `${Math.min(97, (snip.x + snip.w) * 100)}%`,
                          top: `${Math.max(0.5, snip.y * 100 - 0.5)}%`,
                          transform: 'translate(-100%, -45%)',
                        }}
                        className="absolute z-[24] pointer-events-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/95 border border-emerald-300 shadow-sm text-[11px] font-bold text-slate-700"
                      >
                        <button
                          type="button"
                          title={isEn ? 'Drag to move pasted card' : 'ลากเพื่อย้ายกล่องสูตร'}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            const bodyEl = slideBodyAreaRef.current;
                            if (!bodyEl) return;
                            const bodyRect = bodyEl.getBoundingClientRect();
                            e.currentTarget.setPointerCapture(e.pointerId);
                            snippetDragRef.current = {
                              slideId: activeId,
                              id: snip.id,
                              pointerId: e.pointerId,
                              startClientX: e.clientX,
                              startClientY: e.clientY,
                              origX: snip.x,
                              origY: snip.y,
                              w: snip.w,
                              boxW: bodyRect.width || STAGE_WIDTH,
                              boxH: bodyRect.height || STAGE_HEIGHT,
                            };
                          }}
                          onPointerMove={(e) => {
                            const d = snippetDragRef.current;
                            if (!d || d.id !== snip.id || d.pointerId !== e.pointerId) return;
                            e.stopPropagation();
                            const dxNorm = (e.clientX - d.startClientX) / d.boxW;
                            const dyNorm = (e.clientY - d.startClientY) / d.boxH;
                            const nextX = Math.max(
                              0.01,
                              Math.min(Math.max(0.06, 0.98 - d.w), d.origX + dxNorm),
                            );
                            const nextY = Math.max(0.01, Math.min(0.88, d.origY + dyNorm));
                            updateSlideSnippets(d.slideId, (prev) =>
                              prev.map((item) =>
                                item.id === d.id ? { ...item, x: nextX, y: nextY } : item,
                              ),
                            );
                          }}
                          onPointerUp={(e) => {
                            const d = snippetDragRef.current;
                            if (d && d.id === snip.id && d.pointerId === e.pointerId) {
                              snippetDragRef.current = null;
                              try {
                                e.currentTarget.releasePointerCapture(e.pointerId);
                              } catch {
                                // ignore
                              }
                            }
                          }}
                          onPointerCancel={() => {
                            snippetDragRef.current = null;
                          }}
                          className="px-1.5 py-0.5 rounded-full hover:bg-emerald-50 text-emerald-700 cursor-grab active:cursor-grabbing touch-none"
                        >
                          {isEn ? '⠿ Move' : '⠿ ย้าย'}
                        </button>
                        <button
                          type="button"
                          title={isEn ? 'Cycle card width' : 'สลับความกว้างกล่อง'}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextW = snip.w < 0.38 ? 0.48 : snip.w < 0.6 ? 0.72 : 0.3;
                            updateSlideSnippets(activeId, (prev) =>
                              prev.map((item) =>
                                item.id === snip.id
                                  ? {
                                      ...item,
                                      w: nextW,
                                      x: Math.min(item.x, Math.max(0.02, 0.98 - nextW)),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          className="px-1 py-0.5 rounded hover:bg-slate-100 text-slate-600"
                        >
                          {snip.w < 0.38 ? 'S' : snip.w < 0.6 ? 'M' : 'L'}
                        </button>
                        <button
                          type="button"
                          title={isEn ? 'Remove pasted card' : 'ลบกล่องนี้'}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSlideSnippets(activeId, (prev) =>
                              prev.filter((item) => item.id !== snip.id),
                            );
                          }}
                          className="p-0.5 rounded-full hover:bg-rose-100 text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                </div>

                {/* Transparent Ink / Apple Pencil Overlay (inside slideBodyRef so touch scroll, wheel & swipe work!) */}
                <AnnotationCanvas
                  key={storageDeckId}
                  strokes={currentStrokes}
                  drawEnabled={drawEnabled}
                  pencilOnly={pencilOnly}
                  penColor={penColor}
                  penWidth={penWidth}
                  penStyle={penStyle}
                  snapShapeMode={snapShapeMode}
                  highlighterColor={highlighterColor}
                  highlighterWidth={highlighterWidth}
                  eraserSize={eraserSize}
                  eraserMode={eraserMode}
                  toolMode={toolMode}
                  selectionShape={selectionShape}
                  laserStyle={laserStyle}
                  zoom={zoom}
                  headerHeight={slideHeaderHeight}
                  lang={lang}
                  selectTrigger={selectTrigger}
                  onAddStroke={handleAddStroke}
                  onEraseStrokes={handleEraseStrokes}
                  onReplaceStrokes={handleReplaceStrokes}
                  onCopyStrokes={handleCopyStrokes}
                  findSnippetsInSelection={findSnippetsInSelection}
                  onCopySnippets={handleCopySnippets}
                />
                </div>
              </div>

              {/* Inside-Slide Faculty Credit Footer (matches PDF export on every page) */}
              <div className="shrink-0 px-6 py-1.5 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[13px] font-medium text-slate-500">
                <span>
                  {isEn
                    ? '01417168 Engineering Mathematics II • Faculty of Science at Sriracha, Kasetsart University'
                    : '01417168 คณิตศาสตร์วิศวกรรม II • คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์'}
                </span>
                <span>
                  {isEn
                    ? `Chapter 1 • Lecture ${activeLecture} • Page ${safeSlideIdx + 1} / ${totalEntries}`
                    : `บทที่ 1 • คาบที่ ${activeLecture} • หน้า ${safeSlideIdx + 1} / ${totalEntries}`}
                </span>
              </div>
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Navigation Bar (collapsible via Focus button for maximum 7" tablet writing space) */}
        {!compactBars && (
          <footer className="shrink-0 bg-white border-t border-slate-200 px-3 sm:px-5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 z-20">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeSlideIdx === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isEn ? 'Previous' : 'ก่อนหน้า'}</span>
            </button>

            <div className="flex-1 max-w-md flex flex-col items-center gap-0.5">
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-200"
                  style={{ width: `${((safeSlideIdx + 1) / totalEntries) * 100}%` }}
                />
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-600">
                {isEn
                  ? `Page ${safeSlideIdx + 1} / ${totalEntries} • Lecture ${activeLecture}`
                  : `หน้า ${safeSlideIdx + 1} / ${totalEntries} • คาบที่ ${activeLecture}`}
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={safeSlideIdx === totalEntries - 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold shadow-sm disabled:opacity-40 transition"
            >
              <span>{isEn ? 'Next' : 'ถัดไป'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </footer>
        )}
      </div>

      {cloudSync.pendingConflictInfo && (
        <CloudSyncConflictModal
          isEn={isEn}
          conflict={cloudSync.pendingConflictInfo}
          busy={cloudSync.resolvingConflict}
          onResolve={(choice) => void cloudSync.resolveConflict(choice)}
          onSignOutInstead={cloudSync.cancelConflictAndSignOut}
        />
      )}

      {/* Hidden Print/PDF Export Layout */}
      <SlidePrintView
        includeInk={printIncludeInk}
        inkImagesBySlide={inkImagesBySlide}
        snippetsBySlide={snippetsBySlide}
        printScope={exportScope}
        customPages={customPages}
        lang={lang}
      />
    </>
  );
}
