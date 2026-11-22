export type AnnotationTool = 'pen' | 'eraser' | 'laser';
export type LaserStyle = 'trail' | 'dot';
export type PrintScope = 'all' | 'lec1' | 'lec2';

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
