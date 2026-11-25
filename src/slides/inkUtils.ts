export type AnnotationTool = 'pen' | 'eraser' | 'laser' | 'select';
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

export interface InkStroke {
  color: string;
  width: number;
  isEraser?: boolean;
  points: Array<[number, number]>; // normalized [0..1, 0..1]
}

export function drawStrokeOnContext(
  ctx: CanvasRenderingContext2D,
  st: InkStroke,
  w: number,
  h: number,
  scale: number,
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
    ctx.strokeStyle = st.color;
    ctx.lineWidth = st.width * scale;
  }

  const pts = st.points;
  ctx.beginPath();
  if (pts.length === 1) {
    ctx.arc(pts[0][0] * w, pts[0][1] * h, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = st.isEraser ? 'rgba(0,0,0,1)' : st.color;
    ctx.fill();
  } else {
    ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
    for (let i = 1; i < pts.length - 1; i++) {
      const midX = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
      const midY = ((pts[i][1] + pts[i + 1][1]) / 2) * h;
      ctx.quadraticCurveTo(pts[i][0] * w, pts[i][1] * h, midX, midY);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last[0] * w, last[1] * h);
    ctx.stroke();
  }
  ctx.restore();
}

export function renderStrokesToDataUrl(
  strokes: InkStroke[],
  width = 1920,
  height = 1080,
): string {
  if (strokes.length === 0) return '';
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return '';

  const scale = width / 1160;
  for (const st of strokes) {
    drawStrokeOnContext(ctx, st, width, height, scale);
  }
  return offscreen.toDataURL('image/png');
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
): { dx: number; dy: number } {
  const minDx = margin - bbox.minX;
  const maxDx = 1 - margin - bbox.maxX;
  const minDy = margin - bbox.minY;
  const maxDy = 1 - margin - bbox.maxY;
  return {
    dx: minDx <= maxDx ? Math.max(minDx, Math.min(maxDx, dx)) : 0,
    dy: minDy <= maxDy ? Math.max(minDy, Math.min(maxDy, dy)) : 0,
  };
}

export function translateStroke(stroke: InkStroke, dx: number, dy: number): InkStroke {
  return {
    ...stroke,
    points: stroke.points.map(([x, y]) => [
      Math.max(0, Math.min(1, x + dx)),
      Math.max(0, Math.min(1, y + dy)),
    ]),
  };
}

export function cloneStrokesWithOffset(
  strokes: InkStroke[],
  offsetX = 0.03,
  offsetY = 0.03,
): InkStroke[] {
  const clean = strokes.filter((s) => !s.isEraser && s.points.length > 0);
  if (clean.length === 0) return [];
  const bbox = computeStrokesBBox(clean);
  let dx = offsetX;
  let dy = offsetY;
  if (bbox) {
    if (bbox.maxX + dx > 0.97 && bbox.minX > 0.05) dx = -offsetX;
    if (bbox.maxY + dy > 0.97 && bbox.minY > 0.05) dy = -offsetY;
    const clamped = clampDeltaToBBox(bbox, dx, dy, 0.01);
    dx = clamped.dx;
    dy = clamped.dy;
  }
  return clean.map((st) => translateStroke(st, dx, dy));
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
