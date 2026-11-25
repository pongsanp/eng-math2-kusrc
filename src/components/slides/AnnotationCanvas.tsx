import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  clampDeltaToBBox,
  cloneStrokesWithOffset,
  computeStrokesBBox,
  doesSegmentHitStroke,
  doesStrokeMatchSelection,
  drawStrokeOnContext,
  isStylusTouch,
  translateStroke,
  type AnnotationTool,
  type EraserMode,
  type InkStroke,
  type LaserStyle,
  type SelectionShape,
  type SlideBBox,
} from '../../slides/inkUtils';

export type { InkStroke };

interface AnnotationCanvasProps {
  strokes: InkStroke[];
  drawEnabled: boolean;
  pencilOnly: boolean;
  penColor: string;
  penWidth: number;
  eraserSize?: number;
  eraserMode?: EraserMode;
  toolMode: AnnotationTool;
  selectionShape?: SelectionShape;
  laserStyle: LaserStyle;
  zoom?: number;
  lang?: 'th' | 'en';
  selectTrigger?: { indices: number[]; seq: number } | null;
  onAddStroke: (stroke: InkStroke) => void;
  onEraseStrokes?: (remainingStrokes: InkStroke[]) => void;
  onReplaceStrokes?: (nextStrokes: InkStroke[]) => void;
  onCopyStrokes?: (copied: InkStroke[]) => void;
}

const LASER_HOLD_MS = 900;
const LASER_FADE_MS = 600;

function drawLaserStrokePath(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  w: number,
  h: number,
  dpr: number,
  alpha: number,
): void {
  if (pts.length === 0 || alpha <= 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const trace = () => {
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
      ctx.lineTo(pts[0][0] * w + 0.01, pts[0][1] * h + 0.01);
      return;
    }
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
      const midY = ((pts[i][1] + pts[i + 1][1]) / 2) * h;
      ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] * w, last[1] * h);
  };

  ctx.strokeStyle = `rgba(239, 68, 68, ${(0.35 * alpha).toFixed(3)})`;
  ctx.lineWidth = 14 * dpr;
  trace();
  ctx.stroke();

  ctx.strokeStyle = `rgba(239, 68, 68, ${(0.92 * alpha).toFixed(3)})`;
  ctx.lineWidth = 6 * dpr;
  trace();
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 255, 255, ${(0.9 * alpha).toFixed(3)})`;
  ctx.lineWidth = 2.4 * dpr;
  trace();
  ctx.stroke();

  ctx.restore();
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
  eraserSize = 6,
  eraserMode = 'partial',
  toolMode,
  selectionShape = 'lasso',
  laserStyle,
  zoom = 1,
  lang = 'th',
  selectTrigger = null,
  onAddStroke,
  onEraseStrokes,
  onReplaceStrokes,
  onCopyStrokes,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerTypeRef = useRef<string | null>(null);
  const lastEraserPtRef = useRef<[number, number] | null>(null);
  const strokesLatestRef = useRef<InkStroke[]>(strokes);

  const [userSelection, setUserSelection] = useState<{
    indices: number[];
    contextKey: string;
    ackTriggerSeq?: number;
  } | null>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const selectedIndicesRef = useRef<number[]>([]);
  const selectionDraftRef = useRef<Array<[number, number]> | null>(null);
  const dragStateRef = useRef<{
    startPt: [number, number];
    curDx: number;
    curDy: number;
    baseBBox: SlideBBox;
  } | null>(null);
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

  useEffect(() => {
    strokesLatestRef.current = strokes;
  }, [strokes]);

  useEffect(() => {
    selectedIndicesRef.current = selectedIndices;
  }, [selectedIndices]);

  const laserStrokesRef = useRef<Array<Array<[number, number]>>>([]);
  const activeLaserStrokeRef = useRef<Array<[number, number]> | null>(null);
  const laserGroupReleasedAtRef = useRef<number | null>(null);
  const laserActiveTipRef = useRef<{ x: number; y: number } | null>(null);
  const laserRafRef = useRef<number | null>(null);

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = getCanvasScale(canvas);
    ctx.clearRect(0, 0, w, h);

    const drag = dragStateRef.current;
    const selSet = drag ? new Set(selectedIndicesRef.current) : null;

    for (let i = 0; i < strokes.length; i++) {
      const st = strokes[i];
      if (drag && selSet && selSet.has(i)) {
        drawStrokeOnContext(ctx, translateStroke(st, drag.curDx, drag.curDy), w, h, scale);
      } else {
        drawStrokeOnContext(ctx, st, w, h, scale);
      }
    }
    if (activeStrokeRef.current) {
      drawStrokeOnContext(ctx, activeStrokeRef.current, w, h, scale);
    }
  }, [strokes]);

  const drawSelectionOverlay = useCallback(() => {
    const overlay = laserCanvasRef.current;
    if (!overlay || toolMode !== 'select') return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const w = overlay.width;
    const h = overlay.height;
    const scale = getCanvasScale(overlay);
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
        const ry = Math.min(p0[1], p1[1]) * h;
        const rw = Math.abs(p1[0] - p0[0]) * w;
        const rh = Math.abs(p1[1] - p0[1]) * h;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (draft.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(draft[0][0] * w, draft[0][1] * h);
        for (let i = 1; i < draft.length; i++) {
          ctx.lineTo(draft[i][0] * w, draft[i][1] * h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    if (selectedIndices.length === 0) return;
    const chosen = selectedIndices.map((idx) => strokesLatestRef.current[idx]).filter(Boolean);
    const bbox = computeStrokesBBox(chosen);
    if (!bbox) return;

    const dx = dragStateRef.current?.curDx ?? 0;
    const dy = dragStateRef.current?.curDy ?? 0;
    const padX = 8 * scale;
    const padY = 8 * scale;
    const x1 = (bbox.minX + dx) * w - padX;
    const y1 = (bbox.minY + dy) * h - padY;
    const bw = Math.max(12 * scale, (bbox.maxX - bbox.minX) * w + padX * 2);
    const bh = Math.max(12 * scale, (bbox.maxY - bbox.minY) * h + padY * 2);

    ctx.save();
    ctx.fillStyle = 'rgba(14, 165, 233, 0.06)';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([7 * scale, 4 * scale]);
    ctx.fillRect(x1, y1, bw, bh);
    ctx.strokeRect(x1, y1, bw, bh);

    // Subtle corner handles
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.6 * scale;
    const hs = 6 * scale;
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
  }, [drawEnabled, selectedIndices, selectionShape, toolMode]);

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
          drawLaserStrokePath(ctx, strokePts, w, h, dpr, groupAlpha);
        }
      }

      const tip = laserActiveTipRef.current;
      if (tip) {
        const cx = tip.x * w;
        const cy = tip.y * h;
        const haloRadius = 22 * dpr;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloRadius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.55)');
        grad.addColorStop(0.55, 'rgba(239, 68, 68, 0.22)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 8.5 * dpr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 3.8 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (tip !== null || laserStrokesRef.current.length > 0) {
        laserRafRef.current = window.requestAnimationFrame(tickLaser);
      } else {
        laserRafRef.current = null;
      }
    }

    laserRafRef.current = window.requestAnimationFrame(tickLaser);
  }, []);

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
    }
  }, [drawEnabled, toolMode, laserStyle]);

  useEffect(() => {
    return () => {
      if (laserRafRef.current !== null) {
        window.cancelAnimationFrame(laserRafRef.current);
        laserRafRef.current = null;
      }
      if (copiedTimerRef.current !== null) {
        window.clearTimeout(copiedTimerRef.current);
      }
    };
  }, []);

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
      if (first && isStylusTouch(first as Touch & { touchType?: string })) {
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
  }, [drawEnabled, drawSelectionOverlay, pencilOnly, redrawAll]);

  const toNormFromClient = (clientX: number, clientY: number, rect: DOMRect): [number, number] => {
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / (rect.height || 1)));
    return [x, y];
  };

  const selectedBBox = useMemo(() => {
    if (!drawEnabled || toolMode !== 'select' || selectedIndices.length === 0) return null;
    const chosen = selectedIndices.map((idx) => strokes[idx]).filter(Boolean);
    return computeStrokesBBox(chosen);
  }, [drawEnabled, selectedIndices, strokes, toolMode]);

  const handleCopySelected = () => {
    const chosen = selectedIndicesRef.current
      .map((idx) => strokesLatestRef.current[idx])
      .filter((st): st is InkStroke => Boolean(st && !st.isEraser));
    if (chosen.length === 0) return;
    onCopyStrokes?.(chosen);
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
    const clones = cloneStrokesWithOffset(chosen, 0.03, 0.03);
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

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawEnabled) return;
    if (pencilOnly && e.pointerType === 'touch') return;
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;

    e.preventDefault();
    const canvas = e.currentTarget;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Safari may reject capture on rapid stylus re-entry
    }

    const rect = canvas.getBoundingClientRect();
    const pt = toNormFromClient(e.clientX, e.clientY, rect);
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
        const padX = 12 / (canvas.clientWidth || 1280);
        const padY = 12 / (canvas.clientHeight || 720);
        if (
          bbox &&
          pt[0] >= bbox.minX - padX &&
          pt[0] <= bbox.maxX + padX &&
          pt[1] >= bbox.minY - padY &&
          pt[1] <= bbox.maxY + padY
        ) {
          dragStateRef.current = {
            startPt: pt,
            curDx: 0,
            curDy: 0,
            baseBBox: bbox,
          };
          setIsDraggingSelection(true);
          drawSelectionOverlay();
          return;
        }
      }

      setSelectedIndicesSafe([]);
      selectionDraftRef.current = selectionShape === 'rect' ? [pt, pt] : [pt];
      drawSelectionOverlay();
      return;
    }

    if (toolMode === 'eraser' && eraserMode === 'stroke') {
      lastEraserPtRef.current = pt;
      const radiusPx = (eraserSize * 4.5) / 2;
      const stageW = canvas.clientWidth || 1280;
      const stageH = canvas.clientHeight || 600;
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

    const stroke: InkStroke = {
      color: penColor,
      width: toolMode === 'eraser' ? eraserSize : penWidth,
      isEraser: toolMode === 'eraser',
      points: [pt],
    };
    activeStrokeRef.current = stroke;

    // Draw initial dot immediately without redrawing prior strokes
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawStrokeOnContext(ctx, stroke, canvas.width, canvas.height, getCanvasScale(canvas));
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawEnabled) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const nativeEvt = e.nativeEvent as PointerEvent;

    if (toolMode === 'laser') {
      // Hovering Apple Pencil above screen updates the glowing laser dot
      if (activePointerIdRef.current === null) {
        if (e.pointerType === 'pen') {
          const hoverPt = toNormFromClient(e.clientX, e.clientY, rect);
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
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect);
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
      const pt = toNormFromClient(e.clientX, e.clientY, rect);

      const drag = dragStateRef.current;
      if (drag) {
        const clamped = clampDeltaToBBox(
          drag.baseBBox,
          pt[0] - drag.startPt[0],
          pt[1] - drag.startPt[1],
        );
        drag.curDx = clamped.dx;
        drag.curDy = clamped.dy;
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
      const stageH = canvas.clientHeight || 600;
      let prevPt = lastEraserPtRef.current;
      let cur = strokesLatestRef.current;
      let changed = false;

      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect);
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
    const scale = getCanvasScale(canvas);

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
      ctx.moveTo(startPt[0] * w, startPt[1] * h);

      let added = false;
      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect);
        const prev = pts[pts.length - 1];
        if (Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]) >= 0.0005) {
          pts.push(nextPt);
          ctx.lineTo(nextPt[0] * w, nextPt[1] * h);
          added = true;
        }
      }
      if (added) {
        ctx.stroke();
      }
      ctx.restore();
    } else {
      for (const sample of samples) {
        const nextPt = toNormFromClient(sample.clientX, sample.clientY, rect);
        const prev = pts[pts.length - 1];
        if (Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]) >= 0.0005) {
          pts.push(nextPt);
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
    activePointerIdRef.current = null;
    activePointerTypeRef.current = null;
    lastEraserPtRef.current = null;

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
        const { curDx, curDy } = drag;
        dragStateRef.current = null;
        setIsDraggingSelection(false);
        if (Math.hypot(curDx, curDy) > 0.001) {
          const selSet = new Set(selectedIndicesRef.current);
          const next = strokesLatestRef.current.map((st, idx) =>
            selSet.has(idx) ? translateStroke(st, curDx, curDy) : st,
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
        if (selectionShape === 'rect' && span < 0.008) {
          // Single tap inside select mode: pick top-most stroke under tap
          const stageW = canvas.clientWidth || 1280;
          const stageH = canvas.clientHeight || 720;
          for (let i = cur.length - 1; i >= 0; i--) {
            if (!cur[i].isEraser && doesSegmentHitStroke(p0, p0, cur[i], 14, stageW, stageH)) {
              matched = [i];
              break;
            }
          }
        } else if (selectionShape === 'lasso' && draft.length < 4 && span < 0.012) {
          const stageW = canvas.clientWidth || 1280;
          const stageH = canvas.clientHeight || 720;
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

  const handlePointerLeave = () => {
    if (toolMode === 'laser' && activePointerIdRef.current === null) {
      laserActiveTipRef.current = null;
      ensureLaserLoop();
    }
  };

  const barCenterPct = selectedBBox
    ? Math.max(18, Math.min(82, ((selectedBBox.minX + selectedBBox.maxX) / 2) * 100))
    : 50;
  const barPlaceAbove = selectedBBox ? selectedBBox.maxY > 0.84 : false;
  const barTopPct = selectedBBox
    ? barPlaceAbove
      ? Math.max(6, selectedBBox.minY * 100 - 7)
      : Math.min(93, selectedBBox.maxY * 100 + 2.5)
    : 50;

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
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
            {selectedIndices.length} {lang === 'th' ? 'เส้น' : selectedIndices.length === 1 ? 'stroke' : 'strokes'}
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
          <button
            type="button"
            onClick={() => {
              setSelectedIndicesSafe([]);
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
