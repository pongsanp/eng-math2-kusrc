export type AnnotationTool = 'pen' | 'highlighter' | 'eraser' | 'laser' | 'select';
export type PenStyle = 'mono' | 'fountain';
export type SnapShapeMode = 'off' | 'line' | 'smart';
export type SelectionShape = 'lasso' | 'rect';
export type EraserMode = 'partial' | 'stroke';
export type LaserStyle = 'trail' | 'dot';
export type PrintScope = 'all' | 'lec1' | 'lec2';
export type NavDirection = 'horizontal' | 'vertical';
export type ToolbarDock = 'top' | 'bottom' | 'left' | 'right';
export type SlideLang = 'th' | 'en';
export type BlankPaperStyle = 'grid' | 'lined' | 'blank';

export interface CustomBlankPage {
  id: number; // Always negative (-1, -2, ...) so it never collides with positive SlideDef IDs
  afterSlideId: number;
  order: number;
  lecture: 1 | 2;
  paperStyle: BlankPaperStyle;
  createdAt: number;
}

export interface SlideBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const SLIDE_LANG_STORAGE_KEY = 'eng_math_2_slide_lang';

export function resolveInitialSlideLang(): SlideLang {
  if (typeof window === 'undefined') return 'th';
  try {
    const param = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
    if (param === 'en') return 'en';
    if (param === 'th') return 'th';
    const saved = window.localStorage.getItem(SLIDE_LANG_STORAGE_KEY);
    if (saved === 'en') return 'en';
  } catch {
    // Ignore storage/URL parsing errors
  }
  return 'th';
}

export function persistSlideLang(lang: SlideLang): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SLIDE_LANG_STORAGE_KEY, lang);
    const url = new URL(window.location.href);
    if (lang === 'en') {
      url.searchParams.set('lang', 'en');
    } else {
      url.searchParams.delete('lang');
    }
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Ignore storage/history errors
  }
}

function distPtToSegSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 1e-8) {
    const ex = px - ax;
    const ey = py - ay;
    return ex * ex + ey * ey;
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return ex * ex + ey * ey;
}

function segmentsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const orient = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) =>
    (qx - px) * (ry - py) - (qy - py) * (rx - px);
  const o1 = orient(ax, ay, bx, by, cx, cy);
  const o2 = orient(ax, ay, bx, by, dx, dy);
  const o3 = orient(cx, cy, dx, dy, ax, ay);
  const o4 = orient(cx, cy, dx, dy, bx, by);
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  if (Math.abs(o1) < 1e-6 && Math.min(ax, bx) <= cx && cx <= Math.max(ax, bx) && Math.min(ay, by) <= cy && cy <= Math.max(ay, by)) return true;
  if (Math.abs(o2) < 1e-6 && Math.min(ax, bx) <= dx && dx <= Math.max(ax, bx) && Math.min(ay, by) <= dy && dy <= Math.max(ay, by)) return true;
  if (Math.abs(o3) < 1e-6 && Math.min(cx, dx) <= ax && ax <= Math.max(cx, dx) && Math.min(cy, dy) <= ay && ay <= Math.max(cy, dy)) return true;
  if (Math.abs(o4) < 1e-6 && Math.min(cx, dx) <= bx && bx <= Math.max(cx, dx) && Math.min(cy, dy) <= by && by <= Math.max(cy, dy)) return true;
  return false;
}

function distSegToSegSq(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): number {
  if (segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy)) return 0;
  return Math.min(
    distPtToSegSq(ax, ay, cx, cy, dx, dy),
    distPtToSegSq(bx, by, cx, cy, dx, dy),
    distPtToSegSq(cx, cy, ax, ay, bx, by),
    distPtToSegSq(dx, dy, ax, ay, bx, by),
  );
}

export function doesSegmentHitStroke(
  a: [number, number],
  b: [number, number],
  stroke: InkStroke,
  eraserRadiusPx: number,
  stageW = 1280,
  stageH = 720,
): boolean {
  if (stroke.isEraser || stroke.points.length === 0) return false;
  const r = eraserRadiusPx + stroke.width * 0.6;
  const rSq = r * r;
  const ax = a[0] * stageW;
  const ay = a[1] * stageH;
  const bx = b[0] * stageW;
  const by = b[1] * stageH;
  const pts = stroke.points;

  if (pts.length === 1) {
    return distPtToSegSq(pts[0][0] * stageW, pts[0][1] * stageH, ax, ay, bx, by) <= rSq;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const cx = pts[i][0] * stageW;
    const cy = pts[i][1] * stageH;
    const dx = pts[i + 1][0] * stageW;
    const dy = pts[i + 1][1] * stageH;
    if (distSegToSegSq(ax, ay, bx, by, cx, cy, dx, dy) <= rSq) {
      return true;
    }
  }
  return false;
}

export function isStylusTouch(touch: { touchType?: string }): boolean {
  return touch.touchType === 'stylus';
}

export function resolveSwipeDirection(
  dx: number,
  dy: number,
  navDirection: NavDirection,
  minDistance = 55,
): 'next' | 'prev' | null {
  if (navDirection === 'horizontal') {
    if (Math.abs(dx) >= minDistance && Math.abs(dx) > Math.abs(dy) * 1.3) {
      return dx < 0 ? 'next' : 'prev';
    }
    return null;
  }
  if (Math.abs(dy) >= minDistance && Math.abs(dy) > Math.abs(dx) * 1.3) {
    return dy < 0 ? 'next' : 'prev';
  }
  return null;
}

export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null;
}

/** Detect common in-app WebViews (LINE, Facebook, Instagram, TikTok, etc.) where window.print() is often blocked. */
export function detectInAppBrowser(userAgent?: string, lang: SlideLang = 'th'): InAppBrowserInfo {
  const ua = userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  if (!ua) return { isInApp: false, appName: null };
  if (/\bLine\//i.test(ua)) return { isInApp: true, appName: 'LINE' };
  if (/FBAN|FBAV|FB_IAB|Messenger/i.test(ua)) {
    return { isInApp: true, appName: 'Facebook / Messenger' };
  }
  if (/Instagram/i.test(ua)) return { isInApp: true, appName: 'Instagram' };
  if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) return { isInApp: true, appName: 'TikTok' };
  if (/Discord/i.test(ua)) return { isInApp: true, appName: 'Discord' };
  if (/MicroMessenger/i.test(ua)) return { isInApp: true, appName: 'WeChat' };
  if (/; wv\)/i.test(ua)) {
    return { isInApp: true, appName: lang === 'en' ? 'an in-app browser' : 'เบราว์เซอร์ในแอป' };
  }
  return { isInApp: false, appName: null };
}

export const LASER_HOLD_MS = 900;
export const LASER_FADE_MS = 600;

export function drawLaserStrokePath(
  ctx: CanvasRenderingContext2D,
  pts: Array<[number, number]>,
  w: number,
  h: number,
  dpr: number,
  alpha: number,
  offsetY = 0,
): void {
  if (pts.length === 0 || alpha <= 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const toY = (ny: number) => ny * h + offsetY;
  const trace = () => {
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.moveTo(pts[0][0] * w, toY(pts[0][1]));
      ctx.lineTo(pts[0][0] * w + 0.01, toY(pts[0][1]) + 0.01);
      return;
    }
    ctx.moveTo(pts[0][0] * w, toY(pts[0][1]));
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
      const midY = toY((pts[i][1] + pts[i + 1][1]) / 2);
      ctx.quadraticCurveTo(pts[i][0] * w, toY(pts[i][1]), midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] * w, toY(last[1]));
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

export function drawLaserTip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dpr: number,
): void {
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

export interface SlideSnippet {
  id: string;
  x: number; // normalized [0..0.9]
  y: number; // normalized [-headerRatio..0.95] (0..1 = body)
  w: number; // normalized width fraction [0.2..0.9]
  kind: 'formula' | 'card' | 'prompt';
  label?: string;
  latex?: string;
  text?: string;
  tone?: 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export interface InkStroke {
  color: string;
  width: number;
  isEraser?: boolean;
  isHighlighter?: boolean;
  sharp?: boolean; // Crisp straight segments / closed rings without quadratic corner rounding
  pressures?: number[]; // normalized width multiplier per point (Fountain pen)
  points: Array<[number, number]>; // normalized: x in [0..1], y in [-headerRatio..1] (0..1 = body)
}

export interface RenderedInkExport {
  dataUrl: string;
  topExtendRatio: number;
}

export function drawStrokeOnContext(
  ctx: CanvasRenderingContext2D,
  st: InkStroke,
  w: number,
  h: number,
  scale: number,
  offsetY = 0,
): void {
  if (st.points.length === 0) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (st.isEraser) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = st.width * scale * 4.5;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = st.isHighlighter ? 0.34 : 1;
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.width * scale;
  }

  const pts = st.points;
  const toY = (ny: number) => ny * h + offsetY;

  if (pts.length === 1) {
    const p0Mult = st.pressures?.[0] ?? 1;
    ctx.beginPath();
    ctx.arc(pts[0][0] * w, toY(pts[0][1]), (ctx.lineWidth * p0Mult) / 2, 0, Math.PI * 2);
    ctx.fillStyle = st.isEraser ? 'rgba(0,0,0,1)' : st.color;
    ctx.fill();
    ctx.restore();
    return;
  }

  // Variable-width tapered rendering when fountain-pen pressure samples are present
  if (
    !st.isEraser &&
    !st.isHighlighter &&
    st.pressures &&
    st.pressures.length === pts.length
  ) {
    const pr = st.pressures;
    let prevMidX = pts[0][0] * w;
    let prevMidY = toY(pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const nextX =
        i < pts.length - 1 ? ((pts[i][0] + pts[i + 1][0]) / 2) * w : pts[i][0] * w;
      const nextY =
        i < pts.length - 1
          ? toY((pts[i][1] + pts[i + 1][1]) / 2)
          : toY(pts[i][1]);
      const avgP = (pr[i - 1] + pr[i]) / 2;
      ctx.lineWidth = Math.max(0.9 * scale, st.width * scale * avgP);
      ctx.beginPath();
      ctx.moveTo(prevMidX, prevMidY);
      if (i < pts.length - 1) {
        ctx.quadraticCurveTo(pts[i][0] * w, toY(pts[i][1]), nextX, nextY);
      } else {
        ctx.lineTo(nextX, nextY);
      }
      ctx.stroke();
      prevMidX = nextX;
      prevMidY = nextY;
    }
    ctx.restore();
    return;
  }

  if (st.sharp && pts.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * w, toY(pts[0][1]));
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0] * w, toY(pts[i][1]));
    }
    const last = pts[pts.length - 1];
    if (
      pts.length >= 4 &&
      Math.hypot(pts[0][0] - last[0], pts[0][1] - last[1]) < 1e-4
    ) {
      ctx.closePath();
    }
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, toY(pts[0][1]));
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
    const midY = toY((pts[i][1] + pts[i + 1][1]) / 2);
    ctx.quadraticCurveTo(pts[i][0] * w, toY(pts[i][1]), midX, midY);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0] * w, toY(last[1]));
  ctx.stroke();
  ctx.restore();
}

export function renderStrokesToDataUrl(
  strokes: InkStroke[],
  width = 1920,
  height = 1080,
): string {
  return renderStrokesForExport(strokes, width, height).dataUrl;
}

export function renderStrokesForExport(
  strokes: InkStroke[],
  width = 1920,
  bodyHeight = 1080,
): RenderedInkExport {
  if (strokes.length === 0) return { dataUrl: '', topExtendRatio: 0 };
  let minY = 0;
  for (const st of strokes) {
    if (st.isEraser) continue;
    for (const pt of st.points) {
      if (pt[1] < minY) minY = pt[1];
    }
  }
  const topExtendRatio = minY < -0.002 ? Math.min(0.45, Math.max(0.05, -minY + 0.03)) : 0;
  const extraTopPx = Math.round(topExtendRatio * bodyHeight);

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = bodyHeight + extraTopPx;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return { dataUrl: '', topExtendRatio: 0 };

  const scale = width / 1160;
  for (const st of strokes) {
    drawStrokeOnContext(ctx, st, width, bodyHeight, scale, extraTopPx);
  }
  return {
    dataUrl: offscreen.toDataURL('image/png'),
    topExtendRatio: extraTopPx / bodyHeight,
  };
}

export function computeStrokesBBox(strokes: InkStroke[]): SlideBBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let found = false;

  for (const st of strokes) {
    if (st.isEraser) continue;
    for (const pt of st.points) {
      found = true;
      if (pt[0] < minX) minX = pt[0];
      if (pt[1] < minY) minY = pt[1];
      if (pt[0] > maxX) maxX = pt[0];
      if (pt[1] > maxY) maxY = pt[1];
    }
  }
  return found ? { minX, minY, maxX, maxY } : null;
}

export function isPointInPolygon(
  pt: [number, number],
  poly: Array<[number, number]>,
): boolean {
  if (poly.length < 3) return false;
  const [px, py] = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersects =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi || 1e-12) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function doesStrokeMatchSelection(
  stroke: InkStroke,
  shape: SelectionShape,
  selectionPoints: Array<[number, number]>,
): boolean {
  if (stroke.isEraser || stroke.points.length === 0 || selectionPoints.length < 2) {
    return false;
  }

  let insideCount = 0;
  if (shape === 'rect') {
    const start = selectionPoints[0];
    const end = selectionPoints[selectionPoints.length - 1];
    const minX = Math.min(start[0], end[0]);
    const maxX = Math.max(start[0], end[0]);
    const minY = Math.min(start[1], end[1]);
    const maxY = Math.max(start[1], end[1]);
    if (maxX - minX < 0.005 && maxY - minY < 0.005) return false;
    for (const pt of stroke.points) {
      if (pt[0] >= minX && pt[0] <= maxX && pt[1] >= minY && pt[1] <= maxY) {
        insideCount++;
      }
    }
  } else {
    if (selectionPoints.length < 3) return false;
    for (const pt of stroke.points) {
      if (isPointInPolygon(pt, selectionPoints)) {
        insideCount++;
      }
    }
  }

  const threshold =
    stroke.points.length <= 2 ? 1 : Math.max(1, Math.ceil(stroke.points.length * 0.4));
  return insideCount >= threshold;
}

export function clampDeltaToBBox(
  bbox: SlideBBox,
  dx: number,
  dy: number,
  margin = 0.005,
  minY = 0,
): { dx: number; dy: number } {
  const minDx = margin - bbox.minX;
  const maxDx = 1 - margin - bbox.maxX;
  const minDy = minY + margin - bbox.minY;
  const maxDy = 1 - margin - bbox.maxY;
  return {
    dx: minDx <= maxDx ? Math.max(minDx, Math.min(maxDx, dx)) : 0,
    dy: minDy <= maxDy ? Math.max(minDy, Math.min(maxDy, dy)) : 0,
  };
}

export function scaleStroke(
  stroke: InkStroke,
  anchorX: number,
  anchorY: number,
  scaleX: number,
  scaleY: number,
  minY = -0.5,
): InkStroke {
  const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
  const nextWidth =
    Math.round(Math.max(1, Math.min(36, stroke.width * Math.max(0.65, Math.min(1.85, avgScale)))) * 10) /
    10;
  return {
    ...stroke,
    width: nextWidth,
    points: stroke.points.map(([x, y]) => [
      Math.max(0, Math.min(1, anchorX + (x - anchorX) * scaleX)),
      Math.max(minY, Math.min(1, anchorY + (y - anchorY) * scaleY)),
    ]),
  };
}

export function recolorStroke(stroke: InkStroke, color: string): InkStroke {
  return stroke.isEraser ? stroke : { ...stroke, color };
}

function rdpSimplifyPx(pts: Array<[number, number]>, eps: number): Array<[number, number]> {
  if (pts.length <= 2) return pts.slice();
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const abx = bx - ax;
  const aby = by - ay;
  const abLen = Math.hypot(abx, aby);
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i];
    const d =
      abLen < 1e-6
        ? Math.hypot(px - ax, py - ay)
        : Math.abs(abx * (ay - py) - (ax - px) * aby) / abLen;
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }
  if (maxDist > eps) {
    const left = rdpSimplifyPx(pts.slice(0, maxIdx + 1), eps);
    const right = rdpSimplifyPx(pts.slice(maxIdx), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [pts[0], pts[pts.length - 1]];
}

export interface SnapShapeResult {
  kind: 'line' | 'circle' | 'ellipse' | 'rect' | 'triangle' | 'arrow';
  points: Array<[number, number]>;
}

function resampleClosedPolylinePx(
  closedPts: Array<[number, number]>,
  count: number,
): Array<[number, number]> {
  if (closedPts.length < 2 || count < 3) return closedPts;
  const cumLen: number[] = [0];
  for (let i = 1; i < closedPts.length; i++) {
    cumLen.push(
      cumLen[i - 1] +
        Math.hypot(closedPts[i][0] - closedPts[i - 1][0], closedPts[i][1] - closedPts[i - 1][1]),
    );
  }
  const totalLen = cumLen[cumLen.length - 1];
  if (totalLen <= 1e-3) return closedPts;

  const out: Array<[number, number]> = [];
  let segIdx = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / count) * totalLen;
    while (segIdx < cumLen.length - 2 && cumLen[segIdx + 1] < target) {
      segIdx++;
    }
    const segStart = cumLen[segIdx];
    const segLen = Math.max(1e-6, cumLen[segIdx + 1] - segStart);
    const t = Math.max(0, Math.min(1, (target - segStart) / segLen));
    const p0 = closedPts[segIdx];
    const p1 = closedPts[segIdx + 1];
    out.push([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]);
  }
  return out;
}

function polygonSignedAreaPx(ringPts: Array<[number, number]>): number {
  let sum = 0;
  const n = ringPts.length;
  for (let i = 0; i < n; i++) {
    const a = ringPts[i];
    const b = ringPts[(i + 1) % n];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum) * 0.5;
}

function meanDistToClosedPolygon(
  samples: Array<[number, number]>,
  verts: Array<[number, number]>,
): number {
  if (samples.length === 0 || verts.length < 3) return Infinity;
  let sum = 0;
  for (const [px, py] of samples) {
    let bestSq = Infinity;
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      const dSq = distPtToSegSq(px, py, a[0], a[1], b[0], b[1]);
      if (dSq < bestSq) bestSq = dSq;
    }
    sum += Math.sqrt(bestSq);
  }
  return sum / samples.length;
}

function extractOptimalTriAndQuad(
  pts: Array<[number, number]>,
  cx: number,
  cy: number,
  diag: number,
): {
  triVerts: Array<[number, number]> | null;
  triErr: number;
  quadVerts: Array<[number, number]> | null;
  quadErr: number;
} {
  if (pts.length < 6) {
    return { triVerts: null, triErr: Infinity, quadVerts: null, quadErr: Infinity };
  }
  // Anchor start at the vertex farthest from centroid (guaranteed true corner on polygons)
  let farIdx = 0;
  let maxDistSq = -1;
  for (let i = 0; i < pts.length; i++) {
    const dx = pts[i][0] - cx;
    const dy = pts[i][1] - cy;
    const dSq = dx * dx + dy * dy;
    if (dSq > maxDistSq) {
      maxDistSq = dSq;
      farIdx = i;
    }
  }
  const rotated = [...pts.slice(farIdx), ...pts.slice(0, farIdx), pts[farIdx]];
  const candidates = rdpSimplifyPx(rotated, Math.max(4, diag * 0.032));
  const ring = candidates.slice(0, -1);
  if (ring.length < 3) {
    return { triVerts: null, triErr: Infinity, quadVerts: null, quadErr: Infinity };
  }

  // Merge any duplicate near-start/end point
  if (
    ring.length > 3 &&
    Math.hypot(ring[ring.length - 1][0] - ring[0][0], ring[ring.length - 1][1] - ring[0][1]) <
      Math.max(14, diag * 0.08)
  ) {
    ring.pop();
  }

  let quadVerts: Array<[number, number]> | null =
    ring.length === 4 ? ring.map((p) => [p[0], p[1]]) : null;

  // Iteratively prune the least significant corner (Visvalingam-Whyatt area) down to 4 then 3
  const working = ring.map((p) => [p[0], p[1]] as [number, number]);
  while (working.length > 3) {
    let minArea = Infinity;
    let dropIdx = 0;
    const n = working.length;
    for (let i = 0; i < n; i++) {
      const prev = working[(i - 1 + n) % n];
      const curr = working[i];
      const next = working[(i + 1) % n];
      const area = Math.abs(
        (curr[0] - prev[0]) * (next[1] - prev[1]) - (curr[1] - prev[1]) * (next[0] - prev[0]),
      );
      if (area < minArea) {
        minArea = area;
        dropIdx = i;
      }
    }
    working.splice(dropIdx, 1);
    if (working.length === 4 && !quadVerts) {
      quadVerts = working.map((p) => [p[0], p[1]]);
    }
  }

  const triVerts = working.length === 3 ? working : null;
  const quadErr = quadVerts ? meanDistToClosedPolygon(pts, quadVerts) / Math.max(12, diag) : Infinity;
  const triErr = triVerts ? meanDistToClosedPolygon(pts, triVerts) / Math.max(12, diag) : Infinity;
  return { triVerts, triErr, quadVerts, quadErr };
}

function minInteriorAngleDeg(verts: Array<[number, number]>): number {
  let minDeg = 180;
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const prev = verts[(i - 1 + n) % n];
    const curr = verts[i];
    const next = verts[(i + 1) % n];
    const ax = prev[0] - curr[0];
    const ay = prev[1] - curr[1];
    const bx = next[0] - curr[0];
    const by = next[1] - curr[1];
    const len = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (len <= 1e-4) return 0;
    const cosVal = Math.max(-1, Math.min(1, (ax * bx + ay * by) / len));
    const deg = (Math.acos(cosVal) * 180) / Math.PI;
    if (deg < minDeg) minDeg = deg;
  }
  return minDeg;
}

function buildOrthogonalRectIfClose(
  quadVerts: Array<[number, number]>,
  pts: Array<[number, number]>,
  diag: number,
): Array<[number, number]> {
  let totalDev = 0;
  for (let i = 0; i < 4; i++) {
    const prev = quadVerts[(i + 3) % 4];
    const curr = quadVerts[i];
    const next = quadVerts[(i + 1) % 4];
    const ax = prev[0] - curr[0];
    const ay = prev[1] - curr[1];
    const bx = next[0] - curr[0];
    const by = next[1] - curr[1];
    const len = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (len <= 1e-4) return quadVerts;
    const deg = (Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / len))) * 180) / Math.PI;
    totalDev += Math.abs(deg - 90);
  }
  const avgDev = totalDev / 4;
  if (avgDev > 18) {
    // Preserve non-rectangular quad (e.g. trapezoid / parallelogram / rotated diamond)
    return quadVerts;
  }

  // Dominant edge orientation weighted by edge length
  let sumCos4 = 0;
  let sumSin4 = 0;
  for (let i = 0; i < 4; i++) {
    const a = quadVerts[i];
    const b = quadVerts[(i + 1) % 4];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    sumCos4 += len * Math.cos(4 * ang);
    sumSin4 += len * Math.sin(4 * ang);
  }
  let rectAngle = 0.25 * Math.atan2(sumSin4, sumCos4);
  // Snap near-axis rectangles cleanly to horizontal/vertical (within +-11 deg)
  const degMod90 = (((rectAngle * 180) / Math.PI) % 90 + 90) % 90;
  if (degMod90 < 11 || degMod90 > 79) {
    rectAngle = 0;
  }

  const ux = Math.cos(rectAngle);
  const uy = Math.sin(rectAngle);
  const vx = -uy;
  const vy = ux;
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  for (const [px, py] of pts) {
    const u = px * ux + py * uy;
    const v = px * vx + py * vy;
    if (u < minU) minU = u;
    if (u > maxU) maxU = u;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }
  if (maxU - minU < Math.max(12, diag * 0.12) || maxV - minV < Math.max(12, diag * 0.12)) {
    return quadVerts;
  }
  const corner = (u: number, v: number): [number, number] => [u * ux + v * vx, u * uy + v * vy];
  return [
    corner(minU, minV),
    corner(maxU, minV),
    corner(maxU, maxV),
    corner(minU, maxV),
  ];
}

/**
 * Recognizes geometric primitives (line, arrow, circle, ellipse, triangle, rectangle)
 * from a single normalized stroke when held still at the end.
 */
export function recognizeHoldSnapShape(
  points: Array<[number, number]>,
  stageW: number,
  stageBodyH: number,
  mode: SnapShapeMode,
  minNormY = -0.45,
): SnapShapeResult | null {
  if (mode === 'off' || points.length < 2) return null;

  const toNorm = (px: number, py: number): [number, number] => [
    Math.max(0, Math.min(1, px / stageW)),
    Math.max(minNormY, Math.min(1, py / stageBodyH)),
  ];

  const rawPx = points.map(([nx, ny]) => [nx * stageW, ny * stageBodyH] as [number, number]);
  let rawMinX = Infinity;
  let rawMinY = Infinity;
  let rawMaxX = -Infinity;
  let rawMaxY = -Infinity;
  let rawPathLen = 0;
  for (let i = 0; i < rawPx.length; i++) {
    const [x, y] = rawPx[i];
    if (x < rawMinX) rawMinX = x;
    if (y < rawMinY) rawMinY = y;
    if (x > rawMaxX) rawMaxX = x;
    if (y > rawMaxY) rawMaxY = y;
    if (i > 0) rawPathLen += Math.hypot(x - rawPx[i - 1][0], y - rawPx[i - 1][1]);
  }
  if (rawPathLen < 34) return null;

  const rawStart = rawPx[0];
  const rawEnd = rawPx[rawPx.length - 1];
  const rawDirectSpan = Math.hypot(rawEnd[0] - rawStart[0], rawEnd[1] - rawStart[1]);

  if (mode === 'line') {
    if (rawDirectSpan < 24) return null;
    return { kind: 'line', points: [points[0], points[points.length - 1]] };
  }

  // Trim slight overshoot past start if user drew ~370-420 degrees around a loop
  const rawDiag = Math.hypot(rawMaxX - rawMinX, rawMaxY - rawMinY);
  let pxPts = rawPx;
  if (rawPx.length >= 14 && rawDiag >= 24) {
    let bestIdx = -1;
    let bestDist = Infinity;
    const scanStart = Math.floor(rawPx.length * 0.65);
    for (let i = scanStart; i < rawPx.length; i++) {
      const d = Math.hypot(rawPx[i][0] - rawStart[0], rawPx[i][1] - rawStart[1]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (
      bestIdx >= scanStart &&
      bestIdx < rawPx.length - 2 &&
      bestDist < Math.max(24, rawDiag * 0.18)
    ) {
      let trimmedLen = 0;
      for (let i = 1; i <= bestIdx; i++) {
        trimmedLen += Math.hypot(
          rawPx[i][0] - rawPx[i - 1][0],
          rawPx[i][1] - rawPx[i - 1][1],
        );
      }
      if (trimmedLen >= Math.max(48, rawDiag * 1.8)) {
        pxPts = rawPx.slice(0, bestIdx + 1);
      }
    }
  }

  let pathLen = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pxPts.length; i++) {
    const [x, y] = pxPts[i];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (i > 0) {
      pathLen += Math.hypot(x - pxPts[i - 1][0], y - pxPts[i - 1][1]);
    }
  }

  const startPx = pxPts[0];
  const endPx = pxPts[pxPts.length - 1];
  const directSpan = Math.hypot(endPx[0] - startPx[0], endPx[1] - startPx[1]);
  const diag = Math.hypot(maxX - minX, maxY - minY);

  // 1. Closed shape detection (Circle / Ellipse / Triangle / Rectangle)
  if (
    diag >= 24 &&
    pathLen >= Math.max(48, diag * 1.8) &&
    directSpan <= Math.max(58, diag * 0.45)
  ) {
    const closedInput: Array<[number, number]> = [...pxPts, pxPts[0]];
    const samples = resampleClosedPolylinePx(closedInput, 96);

    let cx = 0;
    let cy = 0;
    for (const [x, y] of samples) {
      cx += x;
      cy += y;
    }
    cx /= samples.length;
    cy /= samples.length;

    const polyArea = polygonSignedAreaPx(samples);
    let closedPerim = pathLen + directSpan;
    if (closedPerim <= 1e-3) closedPerim = 1;
    const isoperimetricQ = (4 * Math.PI * polyArea) / (closedPerim * closedPerim);

    // 2x2 PCA covariance for true orientation (supports tilted ellipses & rectangles)
    let cxx = 0;
    let cyy = 0;
    let cxy = 0;
    for (const [px, py] of samples) {
      const dx = px - cx;
      const dy = py - cy;
      cxx += dx * dx;
      cyy += dy * dy;
      cxy += dx * dy;
    }
    cxx /= samples.length;
    cyy /= samples.length;
    cxy /= samples.length;

    let theta = 0.5 * Math.atan2(2 * cxy, cxx - cyy);
    const trace = cxx + cyy;
    const detTerm = Math.sqrt(Math.max(0, (cxx - cyy) * (cxx - cyy) + 4 * cxy * cxy));
    const lambda1 = Math.max(16, (trace + detTerm) * 0.5);
    const lambda2 = Math.max(16, (trace - detTerm) * 0.5);

    const aCov = Math.sqrt(2 * lambda1);
    const bCov = Math.sqrt(2 * lambda2);

    const ux = Math.cos(theta);
    const uy = Math.sin(theta);
    const vx = -uy;
    const vy = ux;
    const uCoords: number[] = [];
    const vCoords: number[] = [];
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [px, py] of samples) {
      const dx = px - cx;
      const dy = py - cy;
      const u = dx * ux + dy * uy;
      const v = dx * vx + dy * vy;
      uCoords.push(u);
      vCoords.push(v);
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const obbW = Math.max(8, maxU - minU);
    const obbH = Math.max(8, maxV - minV);
    const fillRatio = polyArea / (obbW * obbH);

    // Measure ellipse radial error against blended covariance + OBB semi-axes (accurate for skinny ellipses too)
    const aFit = 0.5 * aCov + 0.5 * (obbW * 0.5);
    const bFit = 0.5 * bCov + 0.5 * (obbH * 0.5);
    const midU = (minU + maxU) * 0.5;
    const midV = (minV + maxV) * 0.5;
    const cOffU = 0.5 * midU;
    const cOffV = 0.5 * midV;
    let radSqErrSum = 0;
    for (let i = 0; i < samples.length; i++) {
      const rNorm = Math.hypot((uCoords[i] - cOffU) / aFit, (vCoords[i] - cOffV) / bFit);
      const diff = rNorm - 1;
      radSqErrSum += diff * diff;
    }
    const rmsRadErr = Math.sqrt(radSqErrSum / samples.length);

    // Optimal corner extraction for Triangle & Rectangle
    const { triVerts, triErr, quadVerts, quadErr } = extractOptimalTriAndQuad(
      samples,
      cx,
      cy,
      diag,
    );

    // 1a. Triangle check (only when contour truly has 3 straight edges & low fillRatio)
    if (
      triVerts &&
      triErr < 0.056 &&
      triErr < rmsRadErr * 0.78 &&
      fillRatio < 0.75 &&
      polyArea > diag * diag * 0.08 &&
      minInteriorAngleDeg(triVerts) > 15
    ) {
      const tri = [...triVerts, triVerts[0]].map(([x, y]) => toNorm(x, y));
      return { kind: 'triangle', points: tri };
    }

    // 1b. Rectangle / Quad check (beats circle/ellipse when corners & straight edges dominate over smooth ellipse fit)
    if (
      quadVerts &&
      quadErr < 0.055 &&
      quadErr < rmsRadErr * 0.8 &&
      (fillRatio >= 0.84 || (quadErr < rmsRadErr * 0.6 && fillRatio < 0.68)) &&
      minInteriorAngleDeg(quadVerts) > 25
    ) {
      const snappedQuad = buildOrthogonalRectIfClose(quadVerts, samples, diag);
      const quad = [...snappedQuad, snappedQuad[0]].map(([x, y]) => toNorm(x, y));
      return { kind: 'rect', points: quad };
    }

    // 1c. Circle / Ellipse check (immune to teardrop start/end jitter via PCA + resampling)
    if (rmsRadErr < 0.19 && isoperimetricQ > 0.52) {
      const aspect = Math.min(aFit, bFit) / Math.max(aFit, bFit);
      const isCircle = aspect >= 0.82;

      const fitCx = cx + cOffU * ux + cOffV * vx;
      const fitCy = cy + cOffU * uy + cOffV * vy;

      // Snap nearly-horizontal / vertical ellipse axis cleanly to 0 / 90 deg
      const degMod90 = (((theta * 180) / Math.PI) % 90 + 90) % 90;
      if (!isCircle && (degMod90 < 12 || degMod90 > 78)) {
        const nearestRight = Math.round(theta / (Math.PI / 2)) * (Math.PI / 2);
        theta = nearestRight;
      }

      const erx = isCircle ? (aFit + bFit) * 0.5 : aFit;
      const ery = isCircle ? (aFit + bFit) * 0.5 : bFit;
      const cosT = isCircle ? 1 : Math.cos(theta);
      const sinT = isCircle ? 0 : Math.sin(theta);
      const steps = 72;
      const ring: Array<[number, number]> = [];
      for (let i = 0; i <= steps; i++) {
        const phi = (i / steps) * Math.PI * 2;
        const lx = Math.cos(phi) * erx;
        const ly = Math.sin(phi) * ery;
        ring.push(toNorm(fitCx + lx * cosT - ly * sinT, fitCy + lx * sinT + ly * cosT));
      }
      return { kind: isCircle ? 'circle' : 'ellipse', points: ring };
    }
  }

  // 2. One-stroke Arrow detection: shaft start -> tip, then sharp fold-back arrowhead
  if (pxPts.length >= 6) {
    let tipIdx = -1;
    let maxDist = 0;
    for (let i = Math.floor(pxPts.length * 0.4); i < pxPts.length - 1; i++) {
      const d = Math.hypot(pxPts[i][0] - startPx[0], pxPts[i][1] - startPx[1]);
      if (d > maxDist) {
        maxDist = d;
        tipIdx = i;
      }
    }
    if (tipIdx > 0 && maxDist >= 42) {
      let hookLen = 0;
      for (let i = tipIdx + 1; i < pxPts.length; i++) {
        hookLen += Math.hypot(pxPts[i][0] - pxPts[i - 1][0], pxPts[i][1] - pxPts[i - 1][1]);
      }
      const tipPx = pxPts[tipIdx];
      const tipToEnd = Math.hypot(endPx[0] - tipPx[0], endPx[1] - tipPx[1]);
      const ux = (tipPx[0] - startPx[0]) / maxDist;
      const uy = (tipPx[1] - startPx[1]) / maxDist;
      const endDeltaLen = Math.max(1, tipToEnd);
      const backDot =
        ((endPx[0] - tipPx[0]) * ux + (endPx[1] - tipPx[1]) * uy) / endDeltaLen;

      if (
        hookLen >= 16 &&
        hookLen <= maxDist * 0.65 &&
        tipToEnd >= 12 &&
        tipToEnd <= Math.max(48, maxDist * 0.38) &&
        backDot < -0.25
      ) {
        const headLen = Math.max(16, Math.min(34, maxDist * 0.22));
        const wingSpread = headLen * 0.56;
        const nx = -uy;
        const ny = ux;
        const wing1: [number, number] = [
          tipPx[0] - ux * headLen + nx * wingSpread,
          tipPx[1] - uy * headLen + ny * wingSpread,
        ];
        const wing2: [number, number] = [
          tipPx[0] - ux * headLen - nx * wingSpread,
          tipPx[1] - uy * headLen - ny * wingSpread,
        ];
        return {
          kind: 'arrow',
          points: [
            toNorm(startPx[0], startPx[1]),
            toNorm(tipPx[0], tipPx[1]),
            toNorm(wing1[0], wing1[1]),
            toNorm(tipPx[0], tipPx[1]),
            toNorm(wing2[0], wing2[1]),
          ],
        };
      }
    }
  }

  // 3. Fallback: crisp Straight Line
  if (directSpan < 24) return null;
  return { kind: 'line', points: [points[0], points[points.length - 1]] };
}

export function translateStroke(
  stroke: InkStroke,
  dx: number,
  dy: number,
  minY = -0.5,
): InkStroke {
  return {
    ...stroke,
    points: stroke.points.map(([x, y]) => [
      Math.max(0, Math.min(1, x + dx)),
      Math.max(minY, Math.min(1, y + dy)),
    ]),
  };
}

export function cloneStrokesWithOffset(
  strokes: InkStroke[],
  offsetX = 0.03,
  offsetY = 0.03,
  minY = 0,
): InkStroke[] {
  const clean = strokes.filter((s) => !s.isEraser && s.points.length > 0);
  if (clean.length === 0) return [];
  const bbox = computeStrokesBBox(clean);
  const effMinY = bbox ? Math.min(minY, bbox.minY - 0.005) : minY;
  let dx = offsetX;
  let dy = offsetY;
  if (bbox) {
    if (bbox.maxX + dx > 0.97 && bbox.minX > 0.05) dx = -offsetX;
    if (bbox.maxY + dy > 0.97 && bbox.minY > effMinY + 0.05) dy = -offsetY;
    const clamped = clampDeltaToBBox(bbox, dx, dy, 0.01, effMinY);
    dx = clamped.dx;
    dy = clamped.dy;
  }
  return clean.map((st) => translateStroke(st, dx, dy, effMinY));
}

export type OrderedDeckEntry<T extends { id: number; lecture: 1 | 2 }> =
  | { kind: 'builtin'; slide: T; id: number; lecture: 1 | 2 }
  | { kind: 'blank'; page: CustomBlankPage; id: number; lecture: 1 | 2; blankIndexAfterSlide: number };

export function buildOrderedDeckEntries<T extends { id: number; lecture: 1 | 2 }>(
  slides: readonly T[],
  customPages: readonly CustomBlankPage[],
): Array<OrderedDeckEntry<T>> {
  const byAfter = new Map<number, CustomBlankPage[]>();
  for (const cp of customPages) {
    const arr = byAfter.get(cp.afterSlideId);
    if (arr) {
      arr.push(cp);
    } else {
      byAfter.set(cp.afterSlideId, [cp]);
    }
  }
  for (const list of byAfter.values()) {
    list.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || b.id - a.id);
  }

  const emittedIds = new Set<number>();
  const result: Array<OrderedDeckEntry<T>> = [];

  for (const s of slides) {
    result.push({ kind: 'builtin', slide: s, id: s.id, lecture: s.lecture });
    const attached = byAfter.get(s.id);
    if (attached) {
      attached.forEach((p, idx) => {
        emittedIds.add(p.id);
        result.push({
          kind: 'blank',
          page: p,
          id: p.id,
          lecture: s.lecture,
          blankIndexAfterSlide: idx + 1,
        });
      });
    }
  }

  // Fallback for any custom page whose anchor slide is no longer visible
  const orphans = customPages
    .filter((p) => !emittedIds.has(p.id))
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
  for (const p of orphans) {
    result.push({
      kind: 'blank',
      page: p,
      id: p.id,
      lecture: p.lecture,
      blankIndexAfterSlide: 1,
    });
  }

  return result;
}
