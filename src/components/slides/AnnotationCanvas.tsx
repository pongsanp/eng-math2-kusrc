import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  doesSegmentHitStroke,
  drawStrokeOnContext,
  isStylusTouch,
  type AnnotationTool,
  type EraserMode,
  type InkStroke,
  type LaserStyle,
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
  laserStyle: LaserStyle;
  onAddStroke: (stroke: InkStroke) => void;
  onEraseStrokes?: (remainingStrokes: InkStroke[]) => void;
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

export function AnnotationCanvas({
  strokes,
  drawEnabled,
  pencilOnly,
  penColor,
  penWidth,
  eraserSize = 6,
  eraserMode = 'partial',
  toolMode,
  laserStyle,
  onAddStroke,
  onEraseStrokes,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStrokeRef = useRef<InkStroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastEraserPtRef = useRef<[number, number] | null>(null);
  const strokesLatestRef = useRef<InkStroke[]>(strokes);

  useEffect(() => {
    strokesLatestRef.current = strokes;
  }, [strokes]);

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, w, h);

    for (const st of strokes) {
      drawStrokeOnContext(ctx, st, w, h, dpr);
    }
    if (activeStrokeRef.current) {
      drawStrokeOnContext(ctx, activeStrokeRef.current, w, h, dpr);
    }
  }, [strokes]);

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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.max(100, Math.round(parent.clientWidth * dpr));
      const ch = Math.max(100, Math.round(parent.clientHeight * dpr));
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
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [redrawAll]);

  useEffect(() => {
    redrawAll();
  }, [redrawAll]);

  // Clear laser loop and reset laser state when overlay turns off, tool switches, or laser style changes
  useEffect(() => {
    if (laserRafRef.current !== null) {
      window.cancelAnimationFrame(laserRafRef.current);
      laserRafRef.current = null;
    }
    laserStrokesRef.current = [];
    activeLaserStrokeRef.current = null;
    laserGroupReleasedAtRef.current = null;
    laserActiveTipRef.current = null;

    const laserCanvas = laserCanvasRef.current;
    const lctx = laserCanvas?.getContext('2d');
    if (laserCanvas && lctx) {
      lctx.clearRect(0, 0, laserCanvas.width, laserCanvas.height);
    }

    if (!drawEnabled) {
      activePointerIdRef.current = null;
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
    };
  }, []);

  // Prevent iOS/iPadOS Safari from intercepting Apple Pencil (or finger when !pencilOnly) for scroll or callout,
  // while leaving finger touches free to scroll slide body vertically when pencilOnly palm-rejection is enabled.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !drawEnabled) return;
    const preventStylusOrFingerDraw = (e: Event) => {
      if (!pencilOnly) {
        e.preventDefault();
        return;
      }
      const te = e as TouchEvent;
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
  }, [drawEnabled, pencilOnly]);

  const toNormFromClient = (clientX: number, clientY: number, rect: DOMRect): [number, number] => {
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1)));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / (rect.height || 1)));
    return [x, y];
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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      drawStrokeOnContext(ctx, stroke, canvas.width, canvas.height, dpr);
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    if (ctx) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.width * dpr * 4.5;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * dpr;
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
    activePointerIdRef.current = null;
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
              ? 'pointer-events-auto touch-pan-y cursor-crosshair'
              : 'pointer-events-auto touch-none cursor-crosshair'
            : 'pointer-events-none'
        }`}
      />
      <canvas
        ref={laserCanvasRef}
        className="absolute inset-0 w-full h-full z-30 pointer-events-none"
      />
    </>
  );
}
