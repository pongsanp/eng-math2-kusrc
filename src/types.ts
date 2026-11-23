export type AppLang = 'th' | 'en';

export type AxisName = 'x' | 'y' | 'z';

export type ChapterId = 'ch1' | 'ch2' | 'ch3';

export type Ch1ModuleTab =
  | 'coords_vec'
  | 'arithmetic'
  | 'dot_proj'
  | 'cross_triple'
  | 'lines3d';

export type Ch3ModuleTab =
  | 'level_curves'
  | 'limits'
  | 'partials_tangent'
  | 'gradient_dir'
  | 'extrema';

export type ModuleTab = 'planes' | 'cylinders' | 'quadrics' | 'translation';

export type Vec3Tuple = [number, number, number];

export interface CoordsVecState {
  subMode: 'single_point' | 'vector';
  plotStep: 1 | 2 | 3;
  showPlaneProjections: boolean;
  p1: Vec3Tuple;
  p2: Vec3Tuple;
  showCoordBox: boolean;
  showPositionVec: boolean;
  showUnitVec: boolean;
}

export interface ArithmeticState {
  u: Vec3Tuple;
  v: Vec3Tuple;
  scalarK: number;
  operation: 'add' | 'sub' | 'scalar';
  slideProgress: number;
  showParallelogram: boolean;
}

export interface DotProjState {
  subMode: 'dot_proj' | 'dir_angles';
  u: Vec3Tuple;
  v: Vec3Tuple;
  showProjection: boolean;
  showAngleArc: boolean;
}

export interface CrossTripleState {
  subMode: 'cross' | 'triple';
  u: Vec3Tuple;
  v: Vec3Tuple;
  w: Vec3Tuple;
  reverseOrder: boolean;
  showAreaOrVolume: boolean;
}

export interface Lines3DState {
  inputMode: 'point_dir' | 'two_points';
  p0: Vec3Tuple;
  dir: Vec3Tuple;
  p2: Vec3Tuple;
  t: number;
  isAnimatingT: boolean;
  showPositionVectors: boolean;
}

export type CameraPreset = 'isometric' | 'top' | 'front' | 'side';

export type CylinderType = 'elliptic' | 'parabolic' | 'hyperbolic' | 'sine';

export type QuadricMode =
  | 'ellipsoid'
  | 'cone'
  | 'elliptic_paraboloid'
  | 'hyperbolic_paraboloid'
  | 'hyperboloid_1'
  | 'hyperboloid_2'
  | 'morph';

export type TranslatedSurfaceType =
  | 'ellipsoid'
  | 'elliptic_paraboloid'
  | 'cone'
  | 'hyperboloid_1'
  | 'elliptic_cylinder';

export interface PlanesState {
  a: number;
  b: number;
  c: number;
  d: number;
  showNormal: boolean;
  showIntercepts: boolean;
  showCoordTraces: boolean;
}

export interface CylindersState {
  type: CylinderType;
  missingAxis: AxisName;
  hyperbolicSign: 1 | -1;
  a: number;
  b: number;
  c: number;
  extrusionLength: number;
  isAnimatingExtrusion: boolean;
  showGeneratingCurve: boolean;
  showRulings: boolean;
}

export interface QuadricsState {
  mode: QuadricMode;
  symmetryAxis: AxisName;
  paraboloidSign: 1 | -1;
  a: number;
  b: number;
  c: number;
  morphD: number;
  slicingEnabled: boolean;
  slicePlane: AxisName;
  sliceK: number;
}

export interface TranslationState {
  surfaceType: TranslatedSurfaceType;
  paraboloidSign: 1 | -1;
  x0: number;
  y0: number;
  z0: number;
  a: number;
  b: number;
  c: number;
  showGhost: boolean;
  showShiftedAxes: boolean;
  quizMode: boolean;
  quizRevealed: boolean;
}

export interface ViewerSettings {
  darkMode: boolean;
  presentationMode: boolean;
  wireframe: boolean;
  transparent: boolean;
  showGrid: boolean;
  autoRotate: boolean;
}

export interface BilingualLabel {
  th: string;
  en: string;
}

export interface TraceResult {
  classification: BilingualLabel;
  equationLatex: string;
  hAxisLabel: string;
  vAxisLabel: string;
  curves2D: Array<Array<[number, number]>>;
  points2D: Array<[number, number]>;
  curves3D: Array<Array<[number, number, number]>>;
  points3D: Array<[number, number, number]>;
}

// Chapter 3: Limits & Partial Derivatives of Multivariable Functions
export type Ch3FuncId =
  | 'gaussian'
  | 'paraboloid'
  | 'paraboloid_down'
  | 'saddle'
  | 'waves'
  | 'dome';

export type Ch3LimitFuncId = 'xy_over_r2' | 'x2y_over_x4y2' | 'sinc_r2';

export type Ch3ExtremaPresetId =
  | 'cubic_saddle_min'
  | 'quartic_two_mins'
  | 'double_peak';

export interface Ch3LevelCurvesState {
  funcId: 'gaussian' | 'paraboloid' | 'saddle' | 'waves' | 'dome';
  scaleA: number;
  sliceK: number;
  showSlicePlane: boolean;
  showContoursOnFloor: boolean;
}

export interface Ch3LimitsState {
  funcId: Ch3LimitFuncId;
  pathType: 'line' | 'parabola';
  pathParam: number;
  approachT: number;
  isAnimatingApproach: boolean;
}

export interface Ch3PartialsState {
  funcId: 'paraboloid_down' | 'saddle' | 'gaussian' | 'waves';
  x0: number;
  y0: number;
  showSliceX: boolean;
  showSliceY: boolean;
  showTangentPlane: boolean;
  dx: number;
  dy: number;
}

export interface Ch3GradientState {
  funcId: 'gaussian' | 'paraboloid_down' | 'saddle' | 'waves';
  x0: number;
  y0: number;
  thetaDeg: number;
  showGradient: boolean;
  showDirectionalTangent: boolean;
  showLevelCurve: boolean;
}

export interface Ch3ExtremaState {
  subMode: 'quadratic_test' | 'multi_critical';
  quadA: number;
  quadB: number;
  quadC: number;
  presetFunc: Ch3ExtremaPresetId;
}
