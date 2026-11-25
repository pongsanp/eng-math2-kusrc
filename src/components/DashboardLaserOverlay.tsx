import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  LASER_FADE_MS,
  LASER_HOLD_MS,
  drawLaserStrokePath,
  drawLaserTip,
  type LaserStyle,
} from '../slides/inkUtils';
import type { AppLang } from '../types';

interface DashboardLaserOverlayProps {
  active: boolean;
  laserStyle: LaserStyle;
  onChangeStyle: (style: LaserStyle) => void;
  onClose: () => void;
  lang: AppLang;
}

export function DashboardLaserOverlay({
  active,
  laserStyle,
  onChangeStyle,
  onClose,
  lang,
}: DashboardLaserOverlayProps) {
  const isEn = lang === 'en';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const strokesRef = useRef<Array<Array<[number, number]>>>([]);
  const activeStrokeRef = useRef<Array<[number, number]> | null>(null);
  const releasedAtRef = useRef<number | null>(null);
  const activeTipRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const getScale = (canvas: HTMLCanvasElement) =>
    canvas.width / Math.max(1, canvas.clientWidth || 1000);

  const ensureLoop = useCallback(() => {
    if (rafRef.current !== null) return;

    function tick() {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = null;
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = null;
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const dpr = getScale(canvas);
      const now = performance.now();

      ctx.clearRect(0, 0, w, h);

      let groupAlpha = 0;
      if (strokesRef.current.length > 0) {
        const releasedAt = releasedAtRef.current;
        if (releasedAt === null) {
          groupAlpha = 1;
        } else {
          const elapsed = now - releasedAt;
          if (elapsed <= LASER_HOLD_MS) {
            groupAlpha = 1;
          } else if (elapsed < LASER_HOLD_MS + LASER_FADE_MS) {
            groupAlpha = 1 - (elapsed - LASER_HOLD_MS) / LASER_FADE_MS;
          } else {
            strokesRef.current = [];
            releasedAtRef.current = null;
            groupAlpha = 0;
          }
        }
      }

      if (groupAlpha > 0) {
        for (const strokePts of strokesRef.current) {
          drawLaserStrokePath(ctx, strokePts, w, h, dpr, groupAlpha);
        }
      }

      const tip = activeTipRef.current;
      if (tip) {
        drawLaserTip(ctx, tip.x * w, tip.y * h, dpr);
      }

      if (tip !== null || strokesRef.current.length > 0) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    }

    rafRef.current = window.requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const syncSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.max(100, parent.clientWidth);
      const ph = Math.max(100, parent.clientHeight);
      const cw = Math.round(pw * dpr);
      const ch = Math.round(ph * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      activePointerIdRef.current = null;
      strokesRef.current = [];
      activeStrokeRef.current = null;
      releasedAtRef.current = null;
      activeTipRef.current = null;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [active, laserStyle]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  if (!active) return null;

  const toNorm = (clientX: number, clientY: number, rect: DOMRect): [number, number] => [
    Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1))),
    Math.max(0, Math.min(1, (clientY - rect.top) / (rect.height || 1))),
  ];

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    const canvas = e.currentTarget;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture failure
    }
    const pt = toNorm(e.clientX, e.clientY, canvas.getBoundingClientRect());
    activePointerIdRef.current = e.pointerId;
    activeTipRef.current = { x: pt[0], y: pt[1] };
    if (laserStyle === 'trail') {
      const nextStroke: Array<[number, number]> = [pt];
      strokesRef.current.push(nextStroke);
      activeStrokeRef.current = nextStroke;
      releasedAtRef.current = null;
    }
    ensureLoop();
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (activePointerIdRef.current === null) {
      if (e.pointerType === 'pen' || e.pointerType === 'mouse') {
        const hoverPt = toNorm(e.clientX, e.clientY, rect);
        activeTipRef.current = { x: hoverPt[0], y: hoverPt[1] };
        ensureLoop();
      }
      return;
    }
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    const nativeEvt = e.nativeEvent as PointerEvent;
    const coalesced =
      typeof nativeEvt.getCoalescedEvents === 'function'
        ? nativeEvt.getCoalescedEvents()
        : [nativeEvt];
    const samples = coalesced.length > 0 ? coalesced : [nativeEvt];
    for (const s of samples) {
      const nextPt = toNorm(s.clientX, s.clientY, rect);
      activeTipRef.current = { x: nextPt[0], y: nextPt[1] };
      if (laserStyle === 'trail' && activeStrokeRef.current) {
        const pts = activeStrokeRef.current;
        const prev = pts[pts.length - 1];
        if (!prev || Math.hypot(nextPt[0] - prev[0], nextPt[1] - prev[1]) >= 0.001) {
          pts.push(nextPt);
        }
      }
    }
    ensureLoop();
  };

  const finishPointer = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    activePointerIdRef.current = null;
    activeTipRef.current = null;
    activeStrokeRef.current = null;
    if (laserStyle === 'trail' && strokesRef.current.length > 0) {
      releasedAtRef.current = performance.now();
    }
    ensureLoop();
  };

  const handlePointerLeave = () => {
    if (activePointerIdRef.current === null) {
      activeTipRef.current = null;
      ensureLoop();
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onPointerLeave={handlePointerLeave}
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        className="absolute inset-0 w-full h-full z-30 pointer-events-auto cursor-crosshair"
      />
      {/* Floating Laser Mode Pill inside 3D Viewport */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex items-center gap-1 rounded-2xl border border-red-200 dark:border-red-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl p-1 text-xs font-bold"
      >
        <span className="flex items-center gap-1.5 px-2 text-red-600 dark:text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="hidden sm:inline">{isEn ? 'Laser Active' : 'โหมดเลเซอร์'}</span>
        </span>
        <button
          type="button"
          onClick={() => onChangeStyle('trail')}
          className={`px-2 py-1 rounded-xl transition ${
            laserStyle === 'trail'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/50'
          }`}
        >
          {isEn ? 'Trail' : 'เส้นจาง'}
        </button>
        <button
          type="button"
          onClick={() => onChangeStyle('dot')}
          className={`px-2 py-1 rounded-xl transition ${
            laserStyle === 'dot'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/50'
          }`}
        >
          {isEn ? 'Dot' : 'จุดชี้'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        >
          {isEn ? 'Done' : 'ปิด'}
        </button>
      </div>
    </>
  );
}
