export type AnnotationTool = 'pen' | 'eraser' | 'laser';
export type EraserMode = 'partial' | 'stroke';
export type LaserStyle = 'trail' | 'dot';
export type PrintScope = 'all' | 'lec1' | 'lec2';
export type NavDirection = 'horizontal' | 'vertical';
export type ToolbarDock = 'top' | 'bottom' | 'left' | 'right';

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
