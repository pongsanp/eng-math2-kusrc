import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import {
  LASER_FADE_MS,
  LASER_HOLD_MS,
  drawLaserStrokePath,
  drawLaserTip,
  isStylusTouch,
  type LaserStyle,
} from '../slides/inkUtils';
import type { AppLang } from '../types';

interface DashboardLaserOverlayProps {
  active: boolean;
  laserStyle: LaserStyle;
  pencilOnly: boolean;
  containerRef: RefObject<HTMLElement | null>;
  onChangeStyle: (style: LaserStyle) => void;
  onTogglePencilOnly: () => void;
  onClose: () => void;
  lang: AppLang;
}

function isInteractiveControlTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'button, input, a, label, [data-dashboard-laser-pill="true"], [data-banner-drag="true"]',
    ),
  );
}

export function DashboardLaserOverlay({
  active,
  laserStyle,
  pencilOnly,
  containerRef,
  onChangeStyle,
  onTogglePencilOnly,
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

  const toNorm = useCallback((clientX: number, clientY: number, rect: DOMRect): [number, number] => [
    Math.max(0, Math.min(1, (clientX - rect.left) / (rect.width || 1))),
    Math.max(0, Math.min(1, (clientY - rect.top) / (rect.height || 1))),
  ], []);

  const beginLaser = useCallback(
    (pointerId: number, clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pt = toNorm(clientX, clientY, canvas.getBoundingClientRect());
      activePointerIdRef.current = pointerId;
      activeTipRef.current = { x: pt[0], y: pt[1] };
      if (laserStyle === 'trail') {
        const nextStroke: Array<[number, number]> = [pt];
        strokesRef.current.push(nextStroke);
        activeStrokeRef.current = nextStroke;
        releasedAtRef.current = null;
      }
      ensureLoop();
    },
    [ensureLoop, laserStyle, toNorm],
  );

  const moveLaser = useCallback(
    (nativeEvt: PointerEvent, pointerId: number, pointerType: string, clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (activePointerIdRef.current === null) {
        if (pointerType === 'pen') {
          const hoverPt = toNorm(clientX, clientY, rect);
          activeTipRef.current = { x: hoverPt[0], y: hoverPt[1] };
          ensureLoop();
        }
        return;
      }
      if (activePointerIdRef.current !== pointerId) return;
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
    },
    [ensureLoop, laserStyle, toNorm],
  );

  const endLaser = useCallback(
    (pointerId: number) => {
      if (activePointerIdRef.current !== pointerId) return;
      activePointerIdRef.current = null;
      activeTipRef.current = null;
      activeStrokeRef.current = null;
      if (laserStyle === 'trail' && strokesRef.current.length > 0) {
        releasedAtRef.current = performance.now();
      }
      ensureLoop();
    },
    [ensureLoop, laserStyle],
  );

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
  }, [active, laserStyle, pencilOnly]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // In Pencil Only mode, let finger touches pass directly through to 3D OrbitControls & banners,
  // while capturing Apple Pencil / mouse laser gestures at the 3D container boundary.
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !pencilOnly || !container) return;

    let lastPenAt = 0;

    const onPointerDownCap = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (e.pointerType === 'pen') lastPenAt = performance.now();
      if (isInteractiveControlTarget(e.target)) return;
      if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      beginLaser(e.pointerId, e.clientX, e.clientY);
    };

    const onPointerMoveCap = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (e.pointerType === 'pen') lastPenAt = performance.now();
      if (activePointerIdRef.current === null && isInteractiveControlTarget(e.target)) {
        if (activeTipRef.current !== null) {
          activeTipRef.current = null;
          ensureLoop();
        }
        return;
      }
      if (activePointerIdRef.current === e.pointerId) {
        e.preventDefault();
        e.stopPropagation();
      }
      moveLaser(e, e.pointerId, e.pointerType, e.clientX, e.clientY);
    };

    const onPointerEndCap = (e: PointerEvent) => {
      if (e.pointerType === 'pen') lastPenAt = performance.now();
      if (activePointerIdRef.current === e.pointerId) {
        e.preventDefault();
        e.stopPropagation();
      }
      endLaser(e.pointerId);
    };

    const onPointerLeaveCap = () => {
      if (activePointerIdRef.current === null && activeTipRef.current !== null) {
        activeTipRef.current = null;
        ensureLoop();
      }
    };

    const onTouchCap = (e: TouchEvent) => {
      if (isInteractiveControlTarget(e.target)) return;
      const first = (e.touches?.[0] ?? e.changedTouches?.[0]) as
        | (Touch & { touchType?: string })
        | undefined;
      if (
        activePointerIdRef.current !== null ||
        performance.now() - lastPenAt < 350 ||
        (first && isStylusTouch(first))
      ) {
        e.preventDefault();
      }
    };

    container.addEventListener('pointerdown', onPointerDownCap, true);
    container.addEventListener('pointermove', onPointerMoveCap, true);
    container.addEventListener('pointerup', onPointerEndCap, true);
    container.addEventListener('pointercancel', onPointerEndCap, true);
    container.addEventListener('pointerleave', onPointerLeaveCap);
    container.addEventListener('touchstart', onTouchCap, { capture: true, passive: false });
    container.addEventListener('touchmove', onTouchCap, { capture: true, passive: false });

    return () => {
      container.removeEventListener('pointerdown', onPointerDownCap, true);
      container.removeEventListener('pointermove', onPointerMoveCap, true);
      container.removeEventListener('pointerup', onPointerEndCap, true);
      container.removeEventListener('pointercancel', onPointerEndCap, true);
      container.removeEventListener('pointerleave', onPointerLeaveCap);
      container.removeEventListener('touchstart', onTouchCap, true);
      container.removeEventListener('touchmove', onTouchCap, true);
    };
  }, [active, beginLaser, containerRef, endLaser, ensureLoop, moveLaser, pencilOnly]);

  if (!active) return null;

  const handleCanvasPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pencilOnly) return;
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore pointer capture failure
    }
    beginLaser(e.pointerId, e.clientX, e.clientY);
  };

  const handleCanvasPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pencilOnly) return;
    if (activePointerIdRef.current === e.pointerId) {
      e.preventDefault();
    }
    moveLaser(e.nativeEvent as PointerEvent, e.pointerId, e.pointerType, e.clientX, e.clientY);
  };

  const finishCanvasPointer = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (pencilOnly) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    endLaser(e.pointerId);
  };

  const handleCanvasPointerLeave = () => {
    if (activePointerIdRef.current === null) {
      activeTipRef.current = null;
      ensureLoop();
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={finishCanvasPointer}
        onPointerCancel={finishCanvasPointer}
        onPointerLeave={handleCanvasPointerLeave}
        style={{
          touchAction: pencilOnly ? 'auto' : 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        className={`absolute inset-0 w-full h-full z-30 ${
          pencilOnly ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
        }`}
      />
      {/* Floating Laser Mode Pill inside 3D Viewport */}
      <div
        data-dashboard-laser-pill="true"
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-40 flex flex-wrap items-center gap-1 rounded-2xl border border-red-200 dark:border-red-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl p-1 text-xs font-bold"
      >
        <span className="flex items-center gap-1.5 px-2 text-red-600 dark:text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="hidden sm:inline">{isEn ? 'Laser' : 'เลเซอร์'}</span>
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
          onClick={onTogglePencilOnly}
          title={
            pencilOnly
              ? isEn
                ? 'Pencil/Mouse points laser; finger still orbits & zooms 3D'
                : 'Apple Pencil/เมาส์ ชี้เลเซอร์ — นิ้วหมุน/ซูมกราฟ 3D ได้พร้อมกัน'
              : isEn
                ? 'Allow finger touch to point laser (locks 3D orbit)'
                : 'อนุญาตให้นิ้วชี้เลเซอร์แทนการหมุน 3D'
          }
          className={`px-2 py-1 rounded-xl border transition ${
            pencilOnly
              ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {pencilOnly
            ? isEn
              ? 'Pencil Only'
              : 'เฉพาะปากกา'
            : isEn
              ? 'Touch Laser'
              : 'นิ้วชี้ได้'}
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
