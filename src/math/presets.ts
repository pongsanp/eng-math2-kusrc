import type {
  BilingualLabel,
  CylinderType,
  CylindersState,
  PlanesState,
  QuadricMode,
  QuadricsState,
  TranslatedSurfaceType,
  TranslationState,
} from '../types';

export interface PresetItem<T> {
  id: string;
  label: BilingualLabel;
  badge?: string;
  value: Partial<T>;
}

export const PLANE_PRESETS: Array<PresetItem<PlanesState>> = [
  {
    id: 'general',
    label: { th: 'ระนาบทั่วไป 3 จุดตัด', en: '3-Intercept Plane' },
    badge: '2x + 3y + 2z = 6',
    value: { a: 2, b: 3, c: 2, d: 6 },
  },
  {
    id: 'parallel-xy',
    label: { th: 'ขนานระนาบ xy (z = 2)', en: 'Parallel to xy-plane' },
    badge: 'z = 2',
    value: { a: 0, b: 0, c: 1, d: 2, showRefPlane: true },
  },
  {
    id: 'parallel-z',
    label: { th: 'ขนานแกน z (x + y = 3)', en: 'Parallel to z-axis' },
    badge: 'x + y = 3',
    value: { a: 1, b: 1, c: 0, d: 3, showRefPlane: false },
  },
  {
    id: 'origin',
    label: { th: 'ผ่านจุดกำเนิด', en: 'Through Origin' },
    badge: 'x - 2y + z = 0',
    value: { a: 1, b: -2, c: 1, d: 0, showRefPlane: false },
  },
];

export const CYLINDER_INFO: Record<
  CylinderType,
  { name: BilingualLabel; desc: BilingualLabel }
> = {
  elliptic: {
    name: { th: 'ทรงกระบอกวงรี / วงกลม', en: 'Elliptic / Circular Cylinder' },
    desc: {
      th: 'เส้นโค้งฐานเป็นวงรี (หรือวงกลมเมื่อ a = b) ยืดขนานแกนที่ตัวแปรหายไป',
      en: 'Elliptic base curve (circle if a = b) extruded parallel to the missing axis',
    },
  },
  parabolic: {
    name: { th: 'ทรงกระบอกพาราโบลา', en: 'Parabolic Cylinder' },
    desc: {
      th: 'รางพาราโบลาเกิดจากการเลื่อนพาราโบลาขนานไปตามแกนที่หายไป',
      en: 'Parabolic trough swept along the missing variable axis',
    },
  },
  hyperbolic: {
    name: { th: 'ทรงกระบอกไฮเพอร์โบลา', en: 'Hyperbolic Cylinder' },
    desc: {
      th: 'ผิว 2 แผ่นแยกจากกัน เกิดจากเส้นโค้งไฮเพอร์โบลายืดตามแกนที่หายไป',
      en: 'Two separate sheets extruded from a hyperbolic base curve',
    },
  },
  sine: {
    name: { th: 'ทรงกระบอกคลื่นไซน์', en: 'Sinusoidal Cylinder' },
    desc: {
      th: 'ตัวอย่างทรงกระบอกทั่วไป: คลื่นไซน์ในระนาบ 2 มิติยืดเป็นแผ่นคลื่น 3 มิติ',
      en: 'Generalized cylinder: 2D sine wave swept into a 3D corrugated sheet',
    },
  },
};

export const CYLINDER_PRESETS: Array<PresetItem<CylindersState>> = [
  {
    id: 'circ-z',
    label: { th: 'ทรงกระบอกกลม แกน z', en: 'Circular (z-axis)' },
    badge: 'x² + y² = 4',
    value: { type: 'elliptic', missingAxis: 'z', a: 2, b: 2, c: 0, extrusionLength: 7 },
  },
  {
    id: 'para-y',
    label: { th: 'รางพาราโบลา แกน y', en: 'Parabolic (y-axis)' },
    badge: 'z = 0.5x² - 1',
    value: { type: 'parabolic', missingAxis: 'y', a: 0.5, b: 1, c: -1, extrusionLength: 7 },
  },
  {
    id: 'hyp-x',
    label: { th: 'ไฮเพอร์โบลา แกน x', en: 'Hyperbolic (x-axis)' },
    badge: 'y²/1 - z²/1 = 1',
    value: { type: 'hyperbolic', missingAxis: 'x', hyperbolicSign: 1, a: 1.5, b: 1.5, c: 0, extrusionLength: 7 },
  },
  {
    id: 'sin-y',
    label: { th: 'แผ่นคลื่นไซน์ แกน y', en: 'Sine Sheet (y-axis)' },
    badge: 'z = 1.5 sin(1.5x)',
    value: { type: 'sine', missingAxis: 'y', a: 1.5, b: 1.5, c: 0, extrusionLength: 7 },
  },
];

export const QUADRIC_INFO: Record<
  QuadricMode,
  { name: BilingualLabel; summary: BilingualLabel }
> = {
  ellipsoid: {
    name: { th: 'ทรงรี (Ellipsoid)', en: 'Ellipsoid' },
    summary: {
      th: 'ทุกเทอมกำลังสองเป็นบวก; รอยตัดทุกแนวเป็นวงรี (ทรงกลมเมื่อ a = b = c)',
      en: 'All squared terms positive; all traces are ellipses (sphere when a = b = c)',
    },
  },
  cone: {
    name: { th: 'กรวยเชิงวงรี (Elliptic Cone)', en: 'Elliptic Cone' },
    summary: {
      th: 'กรวยสองยอดชนกันที่จุดกำเนิด; รอยตัดขวางเป็นวงรี/จุด และตามแกนเป็นเส้นตรงตัดกัน',
      en: 'Double cone meeting at origin; cross-sections are ellipses/point or intersecting lines',
    },
  },
  elliptic_paraboloid: {
    name: { th: 'พาราโบลอยด์เชิงวงรี', en: 'Elliptic Paraboloid' },
    summary: {
      th: 'รูปถ้วยหงายตามแกนสมมาตร; รอยตัดขวางเป็นวงรี รอยตัดตามแกนเป็นพาราโบลา',
      en: 'Bowl opening along symmetry axis; elliptical cross-sections, parabolic axial traces',
    },
  },
  hyperbolic_paraboloid: {
    name: { th: 'พาราโบลอยด์เชิงไฮเพอร์โบลา (อานม้า)', en: 'Hyperbolic Paraboloid (Saddle)' },
    summary: {
      th: 'รูปทรงอานม้า (จุดอานม้าที่ (0,0,0)); รอยตัดขวางเป็นไฮเพอร์โบลาและเส้นตรงตัดกัน',
      en: 'Classic saddle shape; cross-sections give hyperbolas and two intersecting lines at k=0',
    },
  },
  hyperboloid_1: {
    name: { th: 'ไฮเพอร์โบลอยด์ชนิด 1 ชิ้น', en: 'Hyperboloid of One Sheet' },
    summary: {
      th: 'รูปทรงหอคอยหล่อเย็นต่อเนื่องเป็นชิ้นเดียว มีสัมประสิทธิ์ลบ 1 ตัว',
      en: 'Connected cooling-tower shape; one negative squared term, two positive',
    },
  },
  hyperboloid_2: {
    name: { th: 'ไฮเพอร์โบลอยด์ชนิด 2 ชิ้น', en: 'Hyperboloid of Two Sheets' },
    summary: {
      th: 'สองถ้วยแยกจากกันตามแกนสมมาตร มีสัมประสิทธิ์ลบ 2 ตัว (ไม่มีรอยตัดช่วง |k| < c)',
      en: 'Two separated bowls along symmetry axis; gap with no trace for |k| < c',
    },
  },
  morph: {
    name: { th: 'โหมดแปรรูปต่อเนื่อง (Morph)', en: 'Morph: 1-Sheet ↔ Cone ↔ 2-Sheet' },
    summary: {
      th: 'เลื่อนค่า d จากบวก → 0 → ลบ เพื่อดูการเปลี่ยนรูปจาก 1 ชิ้น → กรวย → 2 ชิ้นแบบต่อเนื่อง',
      en: 'Slide d from positive → 0 → negative to watch 1-sheet morph through Cone into 2-sheet',
    },
  },
};

export const QUADRIC_PRESETS: Array<PresetItem<QuadricsState>> = [
  {
    id: 'sphere',
    label: { th: 'ทรงกลม r = 2.5', en: 'Sphere r = 2.5' },
    value: { mode: 'ellipsoid', a: 2.5, b: 2.5, c: 2.5, symmetryAxis: 'z' },
  },
  {
    id: 'ellipsoid',
    label: { th: 'ทรงรีมาตรฐาน', en: 'Standard Ellipsoid' },
    value: { mode: 'ellipsoid', a: 3, b: 2, c: 1.5, symmetryAxis: 'z' },
  },
  {
    id: 'bowl',
    label: { th: 'ถ้วยพาราโบลอยด์ (+z)', en: 'Paraboloid Bowl (+z)' },
    value: { mode: 'elliptic_paraboloid', a: 1.5, b: 1.5, c: 2, paraboloidSign: 1, symmetryAxis: 'z' },
  },
  {
    id: 'bowl-down',
    label: { th: 'พาราโบลอยด์คว่ำ (-z)', en: 'Inverted Paraboloid (-z)' },
    value: { mode: 'elliptic_paraboloid', a: 1, b: 1, c: 2, paraboloidSign: -1, symmetryAxis: 'z' },
  },
  {
    id: 'saddle',
    label: { th: 'อานม้า (Saddle)', en: 'Hyperbolic Saddle' },
    value: { mode: 'hyperbolic_paraboloid', a: 1.5, b: 1.5, c: 2, paraboloidSign: 1, symmetryAxis: 'z' },
  },
  {
    id: 'h1',
    label: { th: '1 ชิ้น (หอหล่อเย็น)', en: '1-Sheet Tower' },
    value: { mode: 'hyperboloid_1', a: 1.5, b: 1.5, c: 2, symmetryAxis: 'z' },
  },
  {
    id: 'h2',
    label: { th: '2 ชิ้น (ตามแกน y)', en: '2-Sheet (y-axis)' },
    value: { mode: 'hyperboloid_2', a: 1.5, b: 1.5, c: 1.5, symmetryAxis: 'y' },
  },
  {
    id: 'morph-demo',
    label: { th: 'สาธิตแปรรูป d', en: 'Morph Demo' },
    value: { mode: 'morph', a: 1.5, b: 1.5, c: 1.5, morphD: 1, symmetryAxis: 'z' },
  },
];

export const TRANSLATION_SURFACE_NAMES: Record<TranslatedSurfaceType, BilingualLabel> = {
  ellipsoid: { th: 'ทรงรี (Ellipsoid)', en: 'Ellipsoid' },
  elliptic_paraboloid: { th: 'พาราโบลอยด์เชิงวงรี', en: 'Elliptic Paraboloid' },
  cone: { th: 'กรวยเชิงวงรี (Cone)', en: 'Elliptic Cone' },
  hyperboloid_1: { th: 'ไฮเพอร์โบลอยด์ 1 ชิ้น', en: 'Hyperboloid (1-Sheet)' },
  hyperboloid_2: { th: 'ไฮเพอร์โบลอยด์ 2 ชิ้น', en: 'Hyperboloid (2-Sheet)' },
  elliptic_cylinder: { th: 'ทรงกระบอกวงรี', en: 'Elliptic Cylinder' },
};

export const TRANSLATION_PRESETS: Array<PresetItem<TranslationState>> = [
  {
    id: 'ellipsoid-shift',
    label: { th: 'ทรงรีศูนย์กลาง (2, -1, 1)', en: 'Shifted Ellipsoid' },
    value: { surfaceType: 'ellipsoid', symmetryAxis: 'z', x0: 2, y0: -1, z0: 1, a: 2, b: 1.5, c: 1 },
  },
  {
    id: 'paraboloid-shift',
    label: { th: 'พาราโบลอยด์ยอด (-1, 2, -1.5)', en: 'Shifted Paraboloid' },
    value: { surfaceType: 'elliptic_paraboloid', symmetryAxis: 'z', paraboloidSign: 1, x0: -1, y0: 2, z0: -1.5, a: 1.5, b: 1, c: 1 },
  },
  {
    id: 'cone-shift',
    label: { th: 'กรวยเชิงวงรี (1.5, 1.5, -1)', en: 'Shifted Cone' },
    value: { surfaceType: 'cone', symmetryAxis: 'z', x0: 1.5, y0: 1.5, z0: -1, a: 1, b: 1.5, c: 1.5 },
  },
  {
    id: 'h1-shift',
    label: { th: "1 ชิ้น ศูนย์กลาง (-1, 1.5, 0.5)", en: 'Shifted 1-Sheet' },
    value: { surfaceType: 'hyperboloid_1', symmetryAxis: 'y', x0: -1, y0: 1.5, z0: 0.5, a: 1.5, b: 1.5, c: 1.5 },
  },
  {
    id: 'h2-shift',
    label: { th: "2 ชิ้น แกน x O'(-1, 1, 1.5)", en: 'Shifted 2-Sheet (x-axis)' },
    value: { surfaceType: 'hyperboloid_2', symmetryAxis: 'x', x0: -1, y0: 1, z0: 1.5, a: 1.5, b: 1.5, c: 1.5 },
  },
  {
    id: 'cyl-shift',
    label: { th: 'ทรงกระบอกแกน (2, 1.5, 0)', en: 'Shifted Cylinder' },
    value: { surfaceType: 'elliptic_cylinder', symmetryAxis: 'z', x0: 2, y0: 1.5, z0: 0, a: 1.5, b: 1, c: 1 },
  },
];
