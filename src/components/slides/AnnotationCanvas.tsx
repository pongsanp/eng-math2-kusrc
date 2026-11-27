import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  LASER_FADE_MS,
  LASER_HOLD_MS,
  clampDeltaToBBox,
  cloneStrokesWithOffset,
  computeStrokesBBox,
  doesSegmentHitStroke,
  doesStrokeMatchSelection,
  drawLaserStrokePath,
  drawLaserTip,
  drawStrokeOnContext,
  isStylusTouch,
  recognizeHoldSnapShape,
  recolorStroke,
  scaleStroke,
  translateStroke,
  type AnnotationTool,
  type EraserMode,
  type InkStroke,
  type LaserStyle,
  type PenStyle,
  type SelectionShape,
  type SlideBBox,
  type SlideSnippet,
  type SnapShapeMode,
} from '../../slides/inkUtils';

export type { InkStroke };

export interface SlideSnippetHit {
  snippet: SlideSnippet;
  normBox: SlideBBox;
}

interface AnnotationCanvasProps {
  strokes: InkStroke[];
  drawEnabled: boolean;
  pencilOnly: boolean;
  penColor: string;
  penWidth: number;
  penStyle?: PenStyle;
  snapShapeMode?: SnapShapeMode;
  highlighterColor?: string;
  highlighterWidth?: number;
  eraserSize?: number;
  eraserMode?: EraserMode;
  toolMode: AnnotationTool;
  selectionShape?: SelectionShape;
  laserStyle: LaserStyle;
  zoom?: number;
  headerHeight?: number;
  lang?: 'th' | 'en';
  selectTrigger?: { indices: number[]; seq: number } | null;
  onAddStroke: (stroke: InkStroke) => void;
  onEraseStrokes?: (remainingStrokes: InkStroke[]) => void;
  onReplaceStrokes?: (nextStrokes: InkStroke[]) => void;
  onCopyStrokes?: (copied: InkStroke[]) => void;
  findSnippetsInSelection?: (
    shape: SelectionShape,
    points: Array<[number, number]>,
    isTap: boolean,
  ) => SlideSnippetHit[];
  onCopySnippets?: (copied: SlideSnippet[]) => void;
}

const LINE_SNAP_HOLD_MS = 480;
const LINE_SNAP_STILL_PX = 8;

const SELECT_RECOLOR_SWATCHES = ['#0f172a', '#2563eb', '#dc2626', '#059669', '#d97706'];

function getFountainPressureFactor(
  evt: { pointerType?: string; pressure?: number },
  distPx: number,
  dtMs: number,
  prevFactor: number,
): number {
  const p = evt.pressure ?? 0;
  let raw: number;
  if (evt.pointerType === 'pen' && p > 0 && Math.abs(p - 0.5) > 0.015) {
    raw = 0.42 + p * 1.18;
  } else {
    const speed = distPx / Math.max(4, dtMs);
    raw = Math.max(0.7, Math.min(1.22, 1.18 - speed * 0.22));
  }
  const clamped = Math.max(0.4, Math.min(1.55, raw));
  return Math.round((prevFactor * 0.62 + clamped * 0.38) * 100) / 100;
}

function getCanvasScale(canvas: HTMLCanvasElement): number {
  const cw = canvas.clientWidth || 1280;
  return canvas.width / Math.max(1, cw);
}

export function AnnotationCanvas({
  strokes,
  drawEnabled,
  pencilOnly,
  penColor,
  penWidth,
  penStyle = 'mono',
  snapShapeMode = 'smart',
  highlighterColor = '#fef08a',
  highlighterWidth = 18,
  eraserSize = 6,
  eraserMode = 'partial',
  toolMode,
  selectionShape = 'lasso',
  laserStyle,
  zoom = 1,
  headerHeight = 0,
  lang = 'th',
  selectTrigger = null,
  onAddStroke,
  onEraseStrokes,
  onReplaceStrokes,
  onCopyStrokes,
  findSnippetsInSelection,
  onCopySnippets,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerTypeRef = useRef<string | null>(null);
  const lastPenAtRef = useRef<number>(0);
  const lastEraserPtRef = useRef<[number, number] | null>(null);
  const strokesLatestRef = useRef<InkStroke[]>(strokes);

  const [userSelection, setUserSelection] = useState<{
    indices: number[];
    contextKey: string;
    ackTriggerSeq?: number;
  } | null>(null);
  const [snippetSelection, setSnippetSelection] = useState<{
    hits: SlideSnippetHit[];
    contextKey: string;
  } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const selectedIndicesRef = useRef<number[]>([]);
  const selectedSnippetsRef = useRef<SlideSnippetHit[]>([]);
  const selectionDraftRef = useRef<Array<[number, number]> | null>(null);
  const dragStateRef = useRef<{
    mode: 'move' | 'resize';
    startPt: [number, number];
    curDx: number;
    curDy: number;
    anchorX: number;
    anchorY: number;
    origW: number;
    origH: number;
    curScale: number;
    baseBBox: SlideBBox;
  } | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const copiedTimerRef = useRef<number | null>(null);

  const selectionContextKey = `${drawEnabled}:${toolMode}`;
  const selectedIndices = useMemo(() => {
    if (!drawEnabled || toolMode !== 'select') return [];
    const base =
      selectTrigger && userSelection?.ackTriggerSeq !== selectTrigger.seq
        ? selectTrigger.indices
        : userSelection && userSelection.contextKey === selectionContextKey
          ? userSelection.indices
          : [];
    return base.filter((idx) => idx >= 0 && idx < strokes.length && !strokes[idx]?.isEraser);
  }, [drawEnabled, selectTrigger, selectionContextKey, strokes, toolMode, userSelection]);

  const selectedSnippets = useMemo(() => {
    if (!drawEnabled || toolMode !== 'select') return [];
    return snippetSelection && snippetSelection.contextKey === selectionContextKey
      ? snippetSelection.hits
      : [];
  }, [drawEnabled, selectionContextKey, snippetSelection, toolMode]);

  const setSelectedIndicesSafe = useCallback(
    (indices: number[]) => {
      setUserSelection({
        indices,
        contextKey: selectionContextKey,
        ackTriggerSeq: selectTrigger?.seq,
      });
    },
    [selectTrigger?.seq, selectionContextKey],
  );

  const setSelectedSnippetsSafe = useCallback(
    (hits: SlideSnippetHit[]) => {
      setSnippetSelection({ hits, contextKey: selectionContextKey });
    },
    [selectionContextKey],
  );

  useEffect(() => {
    strokesLatestRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    selectedIndicesRef.current = selectedIndices;
  }, [selectedIndices]);

  useEffect(() => {
    selectedSnippetsRef.current = selectedSnippets;
  }, [selectedSnippets]);

  const laserStrokesRef = useRef<Array<Array<[number, number]>>>([]);
  const activeLaserStrokeRef = useRef<Array<[number, number]> | null>(null);
  const laserGroupReleasedAtRef = useRef<number | null>(null);
  const laserActiveTipRef = useRef<{ x: number; y: number } | null>(null);
  const laserRafRef = useRef<number | null>(null);

  const getStageLayout = useCallback(
    (el?: HTMLCanvasElement | null) => {
      const target = el ?? canvasRef.current;
      const totalH = Math.max(100, target?.parentElement?.clientHeight || target?.clientHeight || 686);
      const safeHeaderH = Math.min(totalH * 0.45, Math.max(0, headerHeight));
      const headerFrac = safeHeaderH / totalH;
      const bodyFrac = Math.max(0.1, 1 - headerFrac);
      const minNormY = headerFrac > 0 ? -headerFrac / bodyFrac : 0;
      return { headerFrac, bodyFrac, minNormY };
    },
    [headerHeight],
  );

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = getCanvasScale(canvas);
    const { headerFrac, bodyFrac, minNormY } = getStageLayout(canvas);
    const bodyH = h * bodyFrac;
    const offsetY = h * headerFrac;
    ctx.clearRect(0, 0, w, h);

    const drag = dragStateRef.current;
    const selSet = drag ? new Set(selectedIndicesRef.current) : null;

    for (let i = 0; i < strokes.length; i++) {
      const st = strokes[i];
      if (drag && selSet && selSet.has(i)) {
        const transformed =
          drag.mode === 'resize'
            ? scaleStroke(st, drag.anchorX, drag.anchorY, drag.curScale, drag.curScale, minNormY)
            : translateStroke(st, drag.curDx, drag.curDy, minNormY);
        drawStrokeOnContext(ctx, transformed, w, bodyH, scale, offsetY);
      } else {
        drawStrokeOnContext(ctx, st, w, bodyH, scale, offsetY);
      }
    }
    if (activeStrokeRef.current) {
      drawStrokeOnContext(ctx, activeStrokeRef.current, w, bodyH, scale, offsetY);
    }
  }, [getStageLayout, strokes]);

  const snapHoldTimerRef = useRef<number | null>(null);
  const lineSnapRef = useRef<{
    snapped: boolean;
    snappedKind?: 'line' | 'circle' | 'ellipse' | 'rect' | 'triangle' | 'arrow';
    startPt: [number, number];
    holdPt: [number, number];
    lastPt: [number, number];
    pathLenPx: number;
  } | null>(null);

  const clearLineSnapTimer = useCallback(() => {
    if (snapHoldTimerRef.current !== null) {
      window.clearTimeout(snapHoldTimerRef.current);
      snapHoldTimerRef.current = null;
    }
  }, []);

  const scheduleLineSnap = useCallback(
    (stageW: number, stageBodyH: number, minNormY: number) => {
      clearLineSnapTimer();
      if (snapShapeMode === 'off') return;
      snapHoldTimerRef.current = window.setTimeout(() => {
        snapHoldTimerRef.current = null;
        const snap = lineSnapRef.current;
        const stroke = activeStrokeRef.current;
        if (!snap || snap.snapped || !stroke || stroke.isEraser) return;
        const recognized = recognizeHoldSnapShape(
          stroke.points,
          stageW,
          stageBodyH,
          snapShapeMode,
          minNormY,
        );
        if (!recognized) return;
        snap.snapped = true;
        snap.snappedKind = recognized.kind;
        stroke.points = recognized.points;
        stroke.pressures = undefined;
        stroke.sharp = true;
        redrawAll();
      }, LINE_SNAP_HOLD_MS);
    },
    [clearLineSnapTimer, redrawAll, snapShapeMode],
  );

  const drawSelectionOverlay = useCallback(() => {
    const overlay = laserCanvasRef.current;
    if (!overlay || toolMode !== 'select') return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const w = overlay.width;
    const h = overlay.height;
    const scale = getCanvasScale(overlay);
    const { headerFrac, bodyFrac } = getStageLayout(overlay);
    const toCanvasY = (ny: number) => (ny * bodyFrac + headerFrac) * h;
    ctx.clearRect(0, 0, w, h);

    if (!drawEnabled) return;

    const draft = selectionDraftRef.current;
    if (draft && draft.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#0284c7';
      ctx.fillStyle = 'rgba(14, 165, 233, 0.10)';
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([6 * scale, 4 * scale]);
      if (selectionShape === 'rect') {
        const p0 = draft[0];
        const p1 = draft[draft.length - 1];
        const rx = Math.min(p0[0], p1[0]) * w;
        const ry = toCanvasY(Math.min(p0[1], p1[1]));
        const rw = Math.abs(p1[0] - p0[0]) * w;
        const rh = Math.abs(p1[1] - p0[1]) * bodyFrac * h;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (draft.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(draft[0][0] * w, toCanvasY(draft[0][1]));
        for (let i = 1; i < draft.length; i++) {
          ctx.lineTo(draft[i][0] * w, toCanvasY(draft[i][1]));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (selectedSnippets.length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([6 * scale, 4 * scale]);
      for (const hit of selectedSnippets) {
        const sx = hit.normBox.minX * w;
        const sy = toCanvasY(hit.normBox.minY);
        const sw = Math.max(12 * scale, (hit.normBox.maxX - hit.normBox.minX) * w);
        const sh = Math.max(12 * scale, (hit.normBox.maxY - hit.normBox.minY) * bodyFrac * h);
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeRect(sx, sy, sw, sh);
      }
      ctx.restore();
    }

    if (selectedIndices.length === 0) return;
    const chosen = selectedIndices.map((idx) => strokesLatestRef.current[idx]).filter(Boolean);
    const bbox = computeStrokesBBox(chosen);
    if (!bbox) return;

    const drag = dragStateRef.current;
    const effMinX =
      drag?.mode === 'resize'
        ? drag.anchorX + (bbox.minX - drag.anchorX) * drag.curScale
        : bbox.minX + (drag?.curDx ?? 0);
    const effMaxX =
      drag?.mode === 'resize'
        ? drag.anchorX + (bbox.maxX - drag.anchorX) * drag.curScale
        : bbox.maxX + (drag?.curDx ?? 0);
    const effMinY =
      drag?.mode === 'resize'
        ? drag.anchorY + (bbox.minY - drag.anchorY) * drag.curScale
        : bbox.minY + (drag?.curDy ?? 0);
    const effMaxY =
      drag?.mode === 'resize'
        ? drag.anchorY + (bbox.maxY - drag.anchorY) * drag.curScale
        : bbox.maxY + (drag?.curDy ?? 0);
    const padX = 8 * scale;
    const padY = 8 * scale;
    const x1 = Math.min(effMinX, effMaxX) * w - padX;
    const y1 = toCanvasY(Math.min(effMinY, effMaxY)) - padY;
    const bw = Math.max(12 * scale, Math.abs(effMaxX - effMinX) * w + padX * 2);
    const bh = Math.max(12 * scale, Math.abs(effMaxY - effMinY) * bodyFrac * h + padY * 2);

    ctx.save();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([7 * scale, 4 * scale]);
    ctx.fillRect(x1, y1, bw, bh);
    ctx.strokeRect(x1, y1, bw, bh);

    // Resize corner handles
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.8 * scale;
    const hs = 8 * scale;
    const corners: Array<[number, number]> = [
      [x1, y1],
      [x1 + bw, y1],
      [x1, y1 + bh],
      [x1 + bw, y1 + bh],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx - hs / 2, cy - hs / 2, hs, hs);
      ctx.strokeRect(cx - hs / 2, cy - hs / 2, hs, hs);
    }
    ctx.restore();
  }, [drawEnabled, getStageLayout, selectedIndices, selectedSnippets, selectionShape, toolMode]);

  const ensureLaserLoop = useCallback(() => {
    if (laserRafRef.current !== null) return;

    function tickLaser() {
      const laserCanvas = laserCanvasRef.current;
      if (!laserCanvas) {
        laserRafRef.current = null;
        return;
      }
      const ctx = laserCanvas.getContext('2d');
      if (!ctx) {
        laserRafRef.current = null;
        return;
      }

      const w = laserCanvas.width;
      const h = laserCanvas.height;
      const dpr = getCanvasScale(laserCanvas);
      const { headerFrac, bodyFrac } = getStageLayout(laserCanvas);
      const bodyH = h * bodyFrac;
      const offsetY = h * headerFrac;
      const now = performance.now();

      ctx.clearRect(0, 0, w, h);

      let groupAlpha = 0;
      if (laserStrokesRef.current.length > 0) {
        const releasedAt = laserGroupReleasedAtRef.current;
        if (releasedAt === null) {
          groupAlpha = 1;
        } else {
          const elapsed = now - releasedAt;
          if (elapsed <= LASER_HOLD_MS) {
            groupAlpha = 1;
          } else if (elapsed < LASER_HOLD_MS + LASER_FADE_MS) {
            groupAlpha = 1 - (elapsed - LASER_HOLD_MS) / LASER_FADE_MS;
          } else {
            laserStrokesRef.current = [];
            laserGroupReleasedAtRef.current = null;
            groupAlpha = 0;
          }
        }
      }

      if (groupAlpha > 0) {
        for (const strokePts of laserStrokesRef.current) {
          drawLaserStrokePath(ctx, strokePts, w, bodyH, dpr, groupAlpha, offsetY);
        }
      }

      const tip = laserActiveTipRef.current;
      if (tip) {
        drawLaserTip(ctx, tip.x * w, (tip.y * bodyFrac + headerFrac) * h, dpr);
      }

      if (tip !== null || laserStrokesRef.current.length > 0) {
        laserRafRef.current = window.requestAnimationFrame(tickLaser);
      } else {
        laserRafRef.current = null;
      }
    }

    laserRafRef.current = window.requestAnimationFrame(tickLaser);
  }, [getStageLayout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const syncSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const baseDpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetScale = baseDpr * Math.min(2.5, Math.max(1, zoom));
      const pw = Math.max(100, parent.clientWidth);
      const ph = Math.max(100, parent.clientHeight);
      const clampedScale = Math.min(targetScale, 3600 / pw, 3600 / ph);
      const cw = Math.round(pw * clampedScale);
      const ch = Math.round(ph * clampedScale);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      const laserCanvas = laserCanvasRef.current;
      if (laserCanvas && (laserCanvas.width !== cw || laserCanvas.height !== ch)) {
        laserCanvas.width = cw;
        laserCanvas.height = ch;
      }
      redrawAll();
      drawSelectionOverlay();
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [drawSelectionOverlay, redrawAll, zoom]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  useEffect(() => {
    drawSelectionOverlay();
  }, [drawSelectionOverlay]);

  // Clear laser loop and reset transient laser/selection state when overlay turns off or tool switches
  useEffect(() => {
    if (laserRafRef.current !== null) {
      window.cancelAnimationFrame(laserRafRef.current);
      laserRafRef.current = null;
    }
    laserStrokesRef.current = [];
    activeLaserStrokeRef.current = null;
    laserGroupReleasedAtRef.current = null;
    laserActiveTipRef.current = null;

    if (!drawEnabled || toolMode !== 'select') {
      selectionDraftRef.current = null;
      dragStateRef.current = null;
    }

    const laserCanvas = laserCanvasRef.current;
    const lctx = laserCanvas?.getContext('2d');
    if (laserCanvas && lctx && toolMode !== 'select') {
      lctx.clearRect(0, 0, laserCanvas.width, laserCanvas.height);
    }

    if (!drawEnabled) {
      activePointerIdRef.current = null;
      activePointerTypeRef.current = null;
      activeStrokeRef.current = null;
      lastEraserPtRef.current = null;
      lineSnapRef.current = null;
      clearLineSnapTimer();
    }
  }, [clearLineSnapTimer, drawEnabled, toolMode, laserStyle]);

  useEffect(() => {
    return () => {
      if (laserRafRef.current !== null) {
        window.cancelAnimationFrame(laserRafRef.current);
        laserRafRef.current = null;
      }
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
      clearLineSnapTimer();
    };
  }, [clearLineSnapTimer]);

  // Prevent iOS/iPadOS Safari from intercepting Apple Pencil (or single finger when !pencilOnly),
  // while cancelling accidental single-finger touch strokes if a 2-finger pinch begins.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !drawEnabled) return;
    const preventStylusOrFingerDraw = (e: Event) => {
      const te = e as TouchEvent;
      if (te.touches && te.touches.length >= 2) {
        if (activePointerTypeRef.current === 'touch') {
          activePointerIdRef.current = null;
          activePointerTypeRef.current = null;
          activeStrokeRef.current = null;
          lineSnapRef.current = null;
          clearLineSnapTimer();
          selectionDraftRef.current = null;
          redrawAll();
          drawSelectionOverlay();
        }
        return;
      }
      if (!pencilOnly) {
        e.preventDefault();
        return;
      }
      const first = te.touches?.[0] ?? te.changedTouches?.[0];
      const isPenActive =
        activePointerTypeRef.current === 'pen' ||
        performance.now() - lastPenAtRef.current < 350;
      if (isPenActive || (first && isStylusTouch(first as Touch & { touchType?: string }))) {
        e.preventDefault();
      }
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };
    canvas.addEventListener('touchstart', preventStylusOrFingerDraw, { passive: false });
    canvas.addEventListener('touchmove', preventStylusOrFingerDraw, { passive: false });
    canvas.addEventListener('touchend', preventStylusOrFingerDraw, { passive: false });
    canvas.addEventListener('gesturestart', preventGesture, { passive: false });
    canvas.addEventListener('gesturechange', preventGesture, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', preventStylusOrFingerDraw);
      canvas.removeEventListener('touchmove', preventStylusOrFingerDraw);
      canvas.removeEventListener('touchend', preventStylusOrFingerDraw);
      canvas.removeEventListener('gesturestart', preventGesture);
      canvas.removeEventListener('gesturechange', preventGesture);
    };
  }, [clearLineSnapTimer, drawEnabled, drawSelectionOverlay, pencilOnly, redrawAll]);

  const toNormFromClient = (
    clientX: number,
    clientY: number,
    rect: DOMRect,
    layout = getStageLayout(),
  ): [number, number] => {
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
    const fracY = (clientY - rect.top) / (rect.height || 1);
    const rawY = (fracY - layout.headerFrac) / layout.bodyFrac;
    const y = Math.max(layout.minNormY, Math.min(1, rawY));
    return [x, y];
  };

  const selectedBBox = useMemo(() => {
    if (!drawEnabled || toolMode !== 'select') return null;
    const boxes: SlideBBox[] = [];
    if (selectedIndices.length > 0) {
      const chosen = selectedIndices.map((idx) => strokes[idx]).filter(Boolean);
      const sb = computeStrokesBBox(chosen);
      if (sb) boxes.push(sb);
    }
    for (const hit of selectedSnippets) {
      boxes.push(hit.normBox);
    }
    if (boxes.length === 0) return null;
    return {
      minX: Math.min(...boxes.map((b) => b.minX)),
      minY: Math.min(...boxes.map((b) => b.minY)),
      maxX: Math.max(...boxes.map((b) => b.maxX)),
      maxY: Math.max(...boxes.map((b) => b.maxY)),
    };
  }, [drawEnabled, selectedIndices, selectedSnippets, strokes, toolMode]);

  const handleCopySelected = () => {
    const chosenStrokes = selectedIndicesRef.current
      .map((idx) => strokesLatestRef.current[idx])
      .filter((st): st is InkStroke => Boolean(st && !st.isEraser));
    const chosenSnippets = selectedSnippetsRef.current.map((h) => h.snippet);
    if (chosenStrokes.length === 0 && chosenSnippets.length === 0) return;
    onCopyStrokes?.(chosenStrokes);
    onCopySnippets?.(chosenSnippets);
    setCopiedFeedback(true);
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopiedFeedback(false), 1400);
  };

  const handleDuplicateSelected = () => {
    const cur = strokesLatestRef.current;
    const chosen = selectedIndicesRef.current
      .map((idx) => cur[idx])
      .filter((st): st is InkStroke => Boolean(st && !st.isEraser));
    if (chosen.length === 0) return;
    const { minNormY } = getStageLayout();
    const clones = cloneStrokesWithOffset(chosen, 0.03, 0.03, minNormY);
    const startIdx = cur.length;
    const next = [...cur, ...clones];
    const nextIndices = clones.map((_, i) => startIdx + i);
    setSelectedIndicesSafe(nextIndices);
    onReplaceStrokes?.(next);
  };

  const handleDeleteSelected = () => {
    const cur = strokesLatestRef.current;
    if (selectedIndicesRef.current.length === 0) return;
    const killSet = new Set(selectedIndicesRef.current);
    const next = cur.filter((_, idx) => !killSet.has(idx));
    setSelectedIndicesSafe([]);
    onReplaceStrokes?.(next);
  };

  const handleRecolorSelected = (nextColor: string) => {
    const cur = strokesLatestRef.current;
    if (selectedIndicesRef.current.length === 0) return;
    const selSet = new Set(selectedIndicesRef.current);
    const next = cur.map((st, idx) => (selSet.has(idx) ? recolorStroke(st, nextColor) : st));
    onReplaceStrokes?.(next);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawEnabled) return;
    const canvas = e.currentTarget;
    if (e.pointerType === 'pen') {
      lastPenAtRef.current = performance.now();
      canvas.style.touchAction = 'none';
    } else if (pencilOnly && e.pointerType === 'touch') {
      canvas.style.touchAction = 'pan-y';
      return;
    }
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;

    e.preventDefault();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Safari may reject capture on rapid stylus re-entry
    }

    const rect = canvas.getBoundingClientRect();
    const layout = getStageLayout(canvas);
    const pt = toNormFromClient(e.clientX, e.clientY, rect, layout);
    activePointerIdRef.current = e.pointerId;
    activePointerTypeRef.current = e.pointerType;

    if (toolMode === 'laser') {
      laserActiveTipRef.current = { x: pt[0], y: pt[1] };
      if (laserStyle === 'trail') {
        // Keep any existing strokes glowing in the cluster while drawing a new stroke
        const newStroke: Array<[number, number]> = [pt];
        laserStrokesRef.current.push(newStroke);
        activeLaserStrokeRef.current = newStroke;
        laserGroupReleasedAtRef.current = null;
      }
      ensureLaserLoop();
      return;
    }

    if (toolMode === 'select') {
      const curSelected = selectedIndicesRef.current;
      if (curSelected.length > 0) {
        const chosen = curSelected.map((idx) => strokesLatestRef.current[idx]).filter(Boolean);
        const bbox = computeStrokesBBox(chosen);
        const stageW = canvas.clientWidth || 1280;
        const stageBodyH = (canvas.clientHeight || 686) * layout.bodyFrac;
        const padX = 12 / stageW;
        const padY = 12 / stageBodyH;

        if (bbox) {
          const hitPadX = 18 / stageW;
          const hitPadY = 18 / stageBodyH;
          const cornerAnchors: Array<{ cx: number; cy: number; ax: number; ay: number }> = [
            { cx: bbox.minX - 8 / stageW, cy: bbox.minY - 8 / stageBodyH, ax: bbox.maxX, ay: bbox.maxY },
            { cx: bbox.maxX + 8 / stageW, cy: bbox.minY - 8 / stageBodyH, ax: bbox.minX, ay: bbox.maxY },
            { cx: bbox.minX - 8 / stageW, cy: bbox.maxY + 8 / stageBodyH, ax: bbox.maxX, ay: bbox.minY },
            { cx: bbox.maxX + 8 / stageW, cy: bbox.maxY + 8 / stageBodyH, ax: bbox.minX, ay: bbox.minY },
          ];
          const hitCorner = cornerAnchors.find(
            (c) => Math.abs(pt[0] - c.cx) <= hitPadX && Math.abs(pt[1] - c.cy) <= hitPadY,
          );
          if (hitCorner) {
            dragStateRef.current = {
              mode: 'resize',
              startPt: pt,
              curDx: 0,
              curDy: 0,
              anchorX: hitCorner.ax,
              anchorY: hitCorner.ay,
              origW: Math.max(0.02, bbox.maxX - bbox.minX),
              origH: Math.max(0.02, bbox.maxY - bbox.minY),
              curScale: 1,
              baseBBox: bbox,
            };
            setIsDraggingSelection(true);
            drawSelectionOverlay();
            return;
          }

          if (
            pt[0] >= bbox.minX - padX &&
            pt[0] <= bbox.maxX + padX &&
            pt[1] >= bbox.minY - padY &&
            pt[1] <= bbox.maxY + padY
          ) {
            dragStateRef.current = {
              mode: 'move',
              startPt: pt,
              curDx: 0,
              curDy: 0,
              anchorX: bbox.minX,
              anchorY: bbox.minY,
              origW: bbox.maxX - bbox.minX,
              origH: bbox.maxY - bbox.minY,
              curScale: 1,
              baseBBox: bbox,
            };
            setIsDraggingSelection(true);
            drawSelectionOverlay();
            return;
          }
        }
      }

      setSelectedIndicesSafe([]);
      setSelectedSnippetsSafe([]);
      selectionDraftRef.current = selectionShape === 'rect' ? [pt, pt] : [pt];
      drawSelectionOverlay();
      return;
    }

    if (toolMode === 'eraser' && eraserMode === 'stroke') {
      lastEraserPtRef.current = pt;
      const radiusPx = (eraserSize * 4.5) / 2;
      const stageW = canvas.clientWidth || 1280;
      const stageH = (canvas.clientHeight || 686) * layout.bodyFrac;
      const cur = strokesLatestRef.current;
      const next = cur.filter(
        (st) => !doesSegmentHitStroke(pt, pt, st, radiusPx, stageW, stageH),
      );
      if (next.length !== cur.length) {
        strokesLatestRef.current = next;
        onEraseStrokes?.(next);
      }
      return;
    }

    const isHighlighterTool = toolMode === 'highlighter';
    const isFountain = toolMode === 'pen' && penStyle === 'fountain';
    const nativeEvt = e.nativeEvent as PointerEvent;
    lastSampleTimeRef.current = performance.now();
    const initialPressure = isFountain
      ? getFountainPressureFactor(nativeEvt, 0, 16, 0.95)
      : undefined;

    const stroke: InkStroke = {
      color: isHighlighterTool ? highlighterColor : penColor,
      width: toolMode === 'eraser' ? eraserSize : isHighlighterTool ? highlighterWidth : penWidth,
      isEraser: toolMode === 'eraser',
      isHighlighter: isHighlighterTool || undefined,
      pressures: initialPressure !== undefined ? [initialPressure] : undefined,
      points: [pt],
    };
    activeStrokeRef.current = stroke;

    if (!stroke.isEraser) {
      const stageW = canvas.clientWidth || 1280;
      const stageBodyH = (canvas.clientHeight || 686) * layout.bodyFrac;
      lineSnapRef.current = {
        snapped: false,
        startPt: pt,
        holdPt: pt,
        lastPt: pt,
        pathLenPx: 0,
      };
      scheduleLineSnap(stageW, stageBodyH, layout.minNormY);
    } else {
      lineSnapRef.current = null;
      clearLineSnapTimer();
    }

    // Draw initial dot immediately without redrawing prior strokes
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawStrokeOnContext(
        ctx,
        stroke,
        canvas.width,
        canvas.height * layout.bodyFrac,
        getCanvasScale(canvas),
        canvas.height * layout.headerFrac,
      );
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawEnabled) return;
    const canvas = e.currentTarget;
    if (e.pointerType === 'pen') {
      lastPenAtRef.current = performance.now();
      canvas.style.touchAction = 'none';
    }
    const rect = canvas.getBoundingClientRect();
    const layout = getStageLayout(canvas);
    const nativeEvt = e.nativeEvent as PointerEvent;

    if (toolMode === 'laser') {
      // Hovering Apple Pencil above screen updates the glowing laser dot
      if (activePointerIdRef.current === null) {
        if (e.pointerType === 'pen') {
          const hoverPt = toNormFromClient(e.clientX, e.clientY, rect, layout);
          laserActiveTipRef.current = { x: hoverPt[0], y: hoverPt[1] };
          ensureLaserLoop();
        }
        return;
      }
      if (activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      const coalesced =
        typeof nativeEvt.getCoalescedEvents === 'function'
          ? nativeEvt.getCoalescedEvents()
          : [nativeEvt];
      const samples = coalesced.length > 0 ? coalesced : [nativeEvt];

      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect, layout);
        laserActiveTipRef.current = { x: nextPt[0], y: nextPt[1] };
        if (laserStyle === 'trail' && activeLaserStrokeRef.current) {
          const pts = activeLaserStrokeRef.current;
          const prev = pts[pts.length - 1];
          if (!prev || Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]) >= 0.001) {
            pts.push(nextPt);
          }
        }
      }
      ensureLaserLoop();
      return;
    }

    if (toolMode === 'select') {
      if (activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      const pt = toNormFromClient(e.clientX, e.clientY, rect, layout);

      const drag = dragStateRef.current;
      if (drag) {
        if (drag.mode === 'resize') {
          const rx = Math.abs(pt[0] - drag.anchorX) / drag.origW;
          const ry = Math.abs(pt[1] - drag.anchorY) / drag.origH;
          drag.curScale = Math.max(0.25, Math.min(3.5, (rx + ry) / 2));
        } else {
          const clamped = clampDeltaToBBox(
            drag.baseBBox,
            pt[0] - drag.startPt[0],
            pt[1] - drag.startPt[1],
            0.005,
            layout.minNormY,
          );
          drag.curDx = clamped.dx;
          drag.curDy = clamped.dy;
        }
        redrawAll();
        drawSelectionOverlay();
        return;
      }

      const draft = selectionDraftRef.current;
      if (draft) {
        if (selectionShape === 'rect') {
          selectionDraftRef.current = [draft[0], pt];
        } else {
          const prev = draft[draft.length - 1];
          if (!prev || Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) >= 0.004) {
            draft.push(pt);
          }
        }
        drawSelectionOverlay();
      }
      return;
    }

    if (toolMode === 'eraser' && eraserMode === 'stroke') {
      if (activePointerIdRef.current !== e.pointerId || !lastEraserPtRef.current) {
        return;
      }
      e.preventDefault();
      const coalesced =
        typeof nativeEvt.getCoalescedEvents === 'function'
          ? nativeEvt.getCoalescedEvents()
          : [nativeEvt];
      const samples = coalesced.length > 0 ? coalesced : [nativeEvt];
      const radiusPx = (eraserSize * 4.5) / 2;
      const stageW = canvas.clientWidth || 1280;
      const stageH = (canvas.clientHeight || 686) * layout.bodyFrac;
      let prevPt = lastEraserPtRef.current;
      let cur = strokesLatestRef.current;
      let changed = false;

      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect, layout);
        const filtered = cur.filter(
          (st) => !doesSegmentHitStroke(prevPt, nextPt, st, radiusPx, stageW, stageH),
        );
        if (filtered.length !== cur.length) {
          cur = filtered;
          changed = true;
        }
        prevPt = nextPt;
      }
      lastEraserPtRef.current = prevPt;
      if (changed) {
        strokesLatestRef.current = cur;
        onEraseStrokes?.(cur);
      }
      return;
    }

    if (activePointerIdRef.current !== e.pointerId || !activeStrokeRef.current) {
      return;
    }
    e.preventDefault();
    const ctx = canvas.getContext('2d');
    const coalesced =
      typeof nativeEvt.getCoalescedEvents === 'function'
        ? nativeEvt.getCoalescedEvents()
        : [nativeEvt];
    const samples = coalesced.length > 0 ? coalesced : [nativeEvt];

    const stroke = activeStrokeRef.current;
    const pts = stroke.points;
    const w = canvas.width;
    const h = canvas.height;
    const bodyH = h * layout.bodyFrac;
    const offsetY = h * layout.headerFrac;
    const scale = getCanvasScale(canvas);
    const stageW = canvas.clientWidth || 1280;
    const stageBodyH = (canvas.clientHeight || 686) * layout.bodyFrac;
    const snap = lineSnapRef.current;

    if (!stroke.isEraser && snap?.snapped) {
      if (snap.snappedKind === 'line') {
        const lastSample = samples[samples.length - 1];
        const nextPt = toNormFromClient(lastSample.clientX, lastSample.clientY, rect, layout);
        snap.lastPt = nextPt;
        stroke.points = [snap.startPt, nextPt];
        redrawAll();
      }
      return;
    }

    const trackSnapMove = (nextPt: [number, number], prevPt: [number, number]) => {
      if (stroke.isEraser || !snap) return;
      snap.pathLenPx += Math.hypot(
        (nextPt[0] - prevPt[0]) * stageW,
        (nextPt[1] - prevPt[1]) * stageBodyH,
      );
      snap.lastPt = nextPt;
      const holdDriftPx = Math.hypot(
        (nextPt[0] - snap.holdPt[0]) * stageW,
        (nextPt[1] - snap.holdPt[1]) * stageBodyH,
      );
      if (holdDriftPx > LINE_SNAP_STILL_PX) {
        snap.holdPt = nextPt;
        scheduleLineSnap(stageW, stageBodyH, layout.minNormY);
      }
    };

    const nowMs = performance.now();
    const dtPerSample = Math.max(2, (nowMs - lastSampleTimeRef.current) / Math.max(1, samples.length));
    lastSampleTimeRef.current = nowMs;

    if (stroke.isHighlighter || stroke.pressures) {
      let added = false;
      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect, layout);
        const prev = pts[pts.length - 1];
        const distNorm = Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]);
        if (distNorm >= 0.0005) {
          pts.push(nextPt);
          if (stroke.pressures) {
            const distPx = Math.hypot((nextPt[0] - prev[0]) * stageW, (nextPt[1] - prev[1]) * stageBodyH);
            const prevPr = stroke.pressures[stroke.pressures.length - 1] ?? 1;
            stroke.pressures.push(getFountainPressureFactor(sample, distPx, dtPerSample, prevPr));
          }
          trackSnapMove(nextPt, prev);
          added = true;
        }
      }
      if (added) {
        redrawAll();
      }
      return;
    }

    if (ctx) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.width * scale * 4.5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * scale;
      }
      ctx.beginPath();
      const startPt = pts[pts.length - 1];
      ctx.moveTo(startPt[0] * w, startPt[1] * bodyH + offsetY);

      let added = false;
      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect, layout);
        const prev = pts[pts.length - 1];
        if (Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]) >= 0.0005) {
          pts.push(nextPt);
          trackSnapMove(nextPt, prev);
          ctx.lineTo(nextPt[0] * w, nextPt[1] * bodyH + offsetY);
          added = true;
        }
      }
      if (added) {
        ctx.stroke();
      }
      ctx.restore();
    } else {
      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect, layout);
        const prev = pts[pts.length - 1];
        if (Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]) >= 0.0005) {
          pts.push(nextPt);
          trackSnapMove(nextPt, prev);
        }
      }
    }
  };

  const finishStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore if capture was already released
    }
    const canvas = e.currentTarget;
    const layout = getStageLayout(canvas);
    clearLineSnapTimer();
    lineSnapRef.current = null;
    activePointerIdRef.current = null;
    activePointerTypeRef.current = null;
    lastEraserPtRef.current = null;
    canvas.style.touchAction = pencilOnly ? 'pan-y' : 'none';

    if (toolMode === 'laser') {
      laserActiveTipRef.current = null;
      activeLaserStrokeRef.current = null;
      if (laserStyle === 'trail' && laserStrokesRef.current.length > 0) {
        laserGroupReleasedAtRef.current = performance.now();
      }
      ensureLaserLoop();
      return;
    }

    if (toolMode === 'select') {
      const drag = dragStateRef.current;
      if (drag) {
        const { mode, curDx, curDy, anchorX, anchorY, curScale } = drag;
        dragStateRef.current = null;
        setIsDraggingSelection(false);
        if (mode === 'resize' && Math.abs(curScale - 1) > 0.015) {
          const selSet = new Set(selectedIndicesRef.current);
          const next = strokesLatestRef.current.map((st, idx) =>
            selSet.has(idx) ? scaleStroke(st, anchorX, anchorY, curScale, curScale, layout.minNormY) : st,
          );
          onReplaceStrokes?.(next);
        } else if (mode === 'move' && Math.hypot(curDx, curDy) > 0.001) {
          const selSet = new Set(selectedIndicesRef.current);
          const next = strokesLatestRef.current.map((st, idx) =>
            selSet.has(idx) ? translateStroke(st, curDx, curDy, layout.minNormY) : st,
          );
          onReplaceStrokes?.(next);
        } else {
          redrawAll();
          drawSelectionOverlay();
        }
        return;
      }

      const draft = selectionDraftRef.current;
      selectionDraftRef.current = null;
      if (draft && draft.length > 0) {
        const cur = strokesLatestRef.current;
        const p0 = draft[0];
        const pLast = draft[draft.length - 1];
        const span = Math.hypot(pLast[0] - p0[0], pLast[1] - p0[1]);

        let matched: number[] = [];
        const isSingleTap =
          (selectionShape === 'rect' && span < 0.008) ||
          (selectionShape === 'lasso' && draft.length < 4 && span < 0.012);
        if (isSingleTap) {
          // Single tap inside select mode: pick top-most stroke under tap
          const stageW = canvas.clientWidth || 1280;
          const stageH = (canvas.clientHeight || 686) * layout.bodyFrac;
          for (let i = cur.length - 1; i >= 0; i--) {
            if (!cur[i].isEraser && doesSegmentHitStroke(p0, p0, cur[i], 14, stageW, stageH)) {
              matched = [i];
              break;
            }
          }
        } else {
          for (let i = 0; i < cur.length; i++) {
            const st = cur[i];
            if (!st.isEraser && doesStrokeMatchSelection(st, selectionShape, draft)) {
              matched.push(i);
            }
          }
        }
        setSelectedIndicesSafe(matched);
        const matchedSnips =
          isSingleTap && matched.length > 0
            ? []
            : (findSnippetsInSelection?.(selectionShape, draft, isSingleTap) ?? []);
        setSelectedSnippetsSafe(matchedSnips);
      }
      drawSelectionOverlay();
      return;
    }

    const completed = activeStrokeRef.current;
    activeStrokeRef.current = null;
    if (completed && completed.points.length > 0) {
      onAddStroke(completed);
    }
  };

  const handlePointerLeave = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current === null && pencilOnly) {
      e.currentTarget.style.touchAction = 'pan-y';
    }
    if (toolMode === 'laser' && activePointerIdRef.current === null) {
      laserActiveTipRef.current = null;
      ensureLaserLoop();
    }
  };

  const approxHeaderFrac = Math.min(0.45, Math.max(0, headerHeight) / 686);
  const approxBodyFrac = Math.max(0.1, 1 - approxHeaderFrac);
  const barCenterPct = selectedBBox
    ? Math.max(18, Math.min(82, ((selectedBBox.minX + selectedBBox.maxX) / 2) * 100))
    : 50;
  const barPlaceAbove = selectedBBox ? selectedBBox.maxY > 0.84 : false;
  const barTopPct = selectedBBox
    ? barPlaceAbove
      ? Math.max(4, (selectedBBox.minY * approxBodyFrac + approxHeaderFrac) * 100 - 7)
      : Math.min(93, (selectedBBox.maxY * approxBodyFrac + approxHeaderFrac) * 100 + 2.5)
    : 50;

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerEnter={(e) => {
          if (drawEnabled && e.pointerType === 'pen') {
            lastPenAtRef.current = performance.now();
            e.currentTarget.style.touchAction = 'none';
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
        onLostPointerCapture={finishStroke}
        onPointerLeave={handlePointerLeave}
        style={
          drawEnabled
            ? {
                touchAction: pencilOnly ? 'pan-y' : 'none',
                WebkitTouchCallout: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }
            : undefined
        }
        className={`absolute inset-0 w-full h-full z-20 ${
          drawEnabled
            ? pencilOnly
              ? `pointer-events-auto touch-pan-y ${toolMode === 'select' ? 'cursor-default' : 'cursor-crosshair'}`
              : `pointer-events-auto touch-none ${toolMode === 'select' ? 'cursor-default' : 'cursor-crosshair'}`
            : 'pointer-events-none'
        }`}
      />
      <canvas
        ref={laserCanvasRef}
        className="absolute inset-0 w-full h-full z-30 pointer-events-none"
      />
      {drawEnabled && toolMode === 'select' && selectedBBox && !isDraggingSelection && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            left: `${barCenterPct}%`,
            top: `${barTopPct}%`,
            transform: 'translate(-50%, 0)',
          }}
          className="absolute z-40 flex items-center gap-1 rounded-full bg-slate-900/95 px-2.5 py-1.5 text-white shadow-xl border border-slate-700/80 whitespace-nowrap"
        >
          <span className="text-[11px] font-semibold text-sky-300 px-1.5">
            {selectedIndices.length > 0 && selectedSnippets.length > 0
              ? lang === 'th'
                ? `${selectedIndices.length} เส้น + ${selectedSnippets.length} สูตร`
                : `${selectedIndices.length} strokes + ${selectedSnippets.length} items`
              : selectedIndices.length > 0
                ? `${selectedIndices.length} ${lang === 'th' ? 'เส้น' : selectedIndices.length === 1 ? 'stroke' : 'strokes'}`
                : lang === 'th'
                  ? `${selectedSnippets.length} สูตร/ข้อความ`
                  : `${selectedSnippets.length} ${selectedSnippets.length === 1 ? 'formula' : 'formulas'}`}
          </span>
          <button
            type="button"
            onClick={handleCopySelected}
            className="rounded-full bg-sky-600 hover:bg-sky-500 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
          >
            {copiedFeedback
              ? lang === 'th'
                ? '✓ คัดลอกแล้ว'
                : '✓ Copied'
              : lang === 'th'
                ? 'คัดลอก'
                : 'Copy'}
          </button>
          {selectedIndices.length > 0 && (
            <>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700">
                {SELECT_RECOLOR_SWATCHES.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleRecolorSelected(col)}
                    title={lang === 'th' ? 'เปลี่ยนสีเส้นที่เลือก' : 'Recolor selection'}
                    aria-label={lang === 'th' ? 'เปลี่ยนสีเส้นที่เลือก' : 'Recolor selection'}
                    className="w-3.5 h-3.5 rounded-full border border-white/80 hover:scale-125 transition cursor-pointer"
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleDuplicateSelected}
                className="rounded-full bg-slate-700 hover:bg-slate-600 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {lang === 'th' ? 'ทำซ้ำ' : 'Duplicate'}
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="rounded-full bg-rose-600 hover:bg-rose-500 px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {lang === 'th' ? 'ลบ' : 'Delete'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setSelectedIndicesSafe([]);
              setSelectedSnippetsSafe([]);
              drawSelectionOverlay();
            }}
            aria-label={lang === 'th' ? 'ยกเลิกการเลือก' : 'Clear selection'}
            className="rounded-full hover:bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
