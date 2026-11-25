import type {
  ArithmeticState,
  CoordsVecState,
  CrossTripleState,
  DotProjState,
  Lines3DState,
} from '../types';

export type Ch1DashboardTarget =
  | { tab: 'coords_vec'; patch?: Partial<CoordsVecState> }
  | { tab: 'arithmetic'; patch?: Partial<ArithmeticState> }
  | { tab: 'dot_proj'; patch?: Partial<DotProjState> }
  | { tab: 'cross_triple'; patch?: Partial<CrossTripleState> }
  | { tab: 'lines3d'; patch?: Partial<Lines3DState> };

export type SlideEmbed3DKind =
  | 'plot_point'
  | 'arithmetic'
  | 'dir_angles'
  | 'projection'
  | 'cross'
  | 'triple'
  | 'line3d';

export interface SlideFormulaBlock {
  label?: string;
  latex: string;
  tone?: 'sky' | 'emerald' | 'amber' | 'rose' | 'slate';
}

export interface SlideSectionCard {
  heading: string;
  bullets?: string[];
  formulas?: SlideFormulaBlock[];
  formulaCols?: 1 | 2;
  note?: string;
}

export interface SlideCustomVector {
  vec: [number, number, number];
  origin?: [number, number, number];
  color: string;
  label?: string;
  opacity?: number;
}

export interface SlideCustomPoint {
  pos: [number, number, number];
  color: string;
  label?: string;
}

export interface SlideCustomLine {
  point: [number, number, number];
  dir: [number, number, number];
  color: string;
  label?: string;
  labelEn?: string;
}

export interface SlideExampleScene3D {
  vectors?: SlideCustomVector[];
  points?: SlideCustomPoint[];
  lines?: SlideCustomLine[];
  triangle?: [[number, number, number], [number, number, number], [number, number, number]];
  showAngle?: boolean;
  angleLabel?: string;
  showRightAngle?: boolean;
  showParallelepiped?: boolean;
  hintTh?: string;
  hintEn?: string;
}

export interface SlideExampleItem {
  label?: string;
  labelEn?: string;
  promptTh: string;
  promptEn?: string;
  promptLatex?: string;
  promptLatexEn?: string;
  scene3D?: SlideExampleScene3D;
  isExamDrill?: boolean;
}

export interface SlideDef {
  id: number;
  lecture: 1 | 2;
  kind: 'cover' | 'concept' | 'example' | 'summary';
  tagTh: string;
  tagEn: string;
  badgeEn?: string;
  badgeEnPublic?: string;
  titleTh: string;
  titleEn: string;
  tagThPublic?: string;
  titleThPublic?: string;
  titleEnPublic?: string;
  isExamDrill?: boolean;
  subtitle?: string;
  subtitleEn?: string;
  cards?: SlideSectionCard[];
  cardsEn?: SlideSectionCard[];
  embed3D?: SlideEmbed3DKind;
  embedHintTh?: string;
  embedHintEn?: string;
  examples?: SlideExampleItem[];
  writeHeightHint?: 'compact' | 'tall';
}

export const SHOW_EXAM_DRILLS = false;

export const CH1_SLIDES: SlideDef[] = [
  // ==================== LECTURE 1 (Slides 1 - 18) ====================
  {
    id: 1,
    lecture: 1,
    kind: 'cover',
    tagTh: 'รายวิชา 01417168',
    tagEn: 'Engineering Mathematics II',
    badgeEn: 'Course 01417168',
    titleTh: 'บทที่ 1: เวกเตอร์ในปริภูมิสามมิติ',
    titleEn: 'Chapter 1: Vectors and the Geometry of Space',
    subtitle: 'ผศ.ดร.พงษ์สัญ ประกฤตศรี • คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์ วิทยาเขตศรีราชา',
    subtitleEn: 'Pongsan Prakitsri, Faculty of Science at Sriracha, Kasetsart University Sriracha Campus',
    cards: [
      {
        heading: 'แผนการเรียนบทที่ 1 (2 คาบเรียน • 38 หน้า)',
        bullets: [
          'คาบที่ 1 (หน้า 1–18): ระบบพิกัด 3 มิติ, เวกเตอร์, การดำเนินการ, ขนาด, เวกเตอร์หนึ่งหน่วย, ผลคูณจุด (Dot Product), มุมทิศทาง + โจทย์แนวข้อสอบ',
          'คาบที่ 2 (หน้า 19–38): การฉายเชิงตั้งฉาก (Projection), ผลคูณไขว้ (Cross Product), พื้นที่, ผลคูณ 3 เวกเตอร์, สมการเส้นตรง 3 มิติ + โจทย์แนวข้อสอบ',
        ],
      },
      {
        heading: 'วิธีใช้งานสไลด์นี้ในการเรียนการสอน',
        bullets: [
          'หน้าเนื้อหาที่มีกล่อง 3 มิติ: ใช้นิ้วหรือเมาส์หมุนดูทิศทางและปรับค่าได้ทันทีกลางหน้าสไลด์',
          'หน้าโจทย์ตัวอย่าง & แนวข้อสอบ: เว้นกระดานจุดสำหรับเขียนสดด้วย Apple Pencil (รองรับกันฝ่ามือ + เลเซอร์ 2 แบบ) และ Export PDF รวมลายมือแจกนิสิตได้ทันที',
        ],
        note: 'สื่อการสอนแบบ Interactive 3D • สัญญาอนุญาต CC BY-NC 4.0 (เพื่อการศึกษา ห้ามใช้เชิงพาณิชย์)',
      },
    ],
    cardsEn: [
      {
        heading: 'Chapter 1 Lesson Plan (2 Lectures • 38 Slides)',
        bullets: [
          'Lecture 1 (Slides 1–18): 3D coordinate system, vectors, vector operations, magnitude, unit vectors, dot product, direction angles + exam drills',
          'Lecture 2 (Slides 19–38): Orthogonal projection, cross product, area, scalar triple product, lines in 3D space + exam drills',
        ],
      },
      {
        heading: 'How to Use These Interactive Slides',
        bullets: [
          'Concept & example slides with 3D viewports: drag with your finger or mouse to orbit and adjust parameters directly on the slide',
          'Example & drill slides: dot-grid workspace for live Apple Pencil annotation (with palm rejection + 2 laser modes) and instant PDF export with notes',
        ],
        note: 'Interactive 3D Lecture Slides • Licensed under CC BY-NC 4.0 (Attribution-NonCommercial)',
      },
    ],
  },
  {
    id: 2,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.1',
    tagEn: '3D Coordinate System',
    badgeEn: 'Lecture 1 • Section 1.1',
    titleTh: 'ระบบพิกัดฉาก 3 มิติและการพล็อตจุด',
    titleEn: '3D Rectangular Coordinates & Plotting Points',
    embed3D: 'plot_point',
    embedHintTh: 'ทดลองกด ขั้น 1 → ขั้น 2 → ขั้น 3 และหมุนดูอัฐภาคใน 3 มิติ',
    embedHintEn: 'Try Step 1 → Step 2 → Step 3 and orbit the 3D octants',
    cards: [
      {
        heading: 'แกนพิกัดระบบมือขวา (Right-Handed System)',
        bullets: [
          'แกน $x$ (สีแดง): พุ่งเข้าหาผู้มอง, แกน $y$ (สีเขียว): ไปทางขวา, แกน $z$ (สีน้ำเงิน): ชี้ขึ้นด้านบน',
          'ระนาบพิกัด 3 ระนาบ ($xy, xz, yz$) แบ่งปริภูมิออกเป็น 8 อัฐภาค (Octants I–VIII)',
        ],
      },
      {
        heading: 'วิธีพล็อตจุด $P(x, y, z)$ ทีละขั้น',
        bullets: [
          'ขั้น 1: เริ่มจากจุดกำเนิด $(0,0,0)$ เดินตามแกน $x$ ไปที่ $(x, 0, 0)$',
          'ขั้น 2: เลื่อนขนานแกน $y$ บนระนาบ $xy$ ไปที่ $(x, y, 0)$',
          'ขั้น 3: ยกขึ้น ($z > 0$) หรือลง ($z < 0$) ขนานแกน $z$ ถึงจุด $P(x, y, z)$',
        ],
        formulas: [
          {
            label: 'ระยะห่างจากจุดกำเนิด',
            latex: 'd(O, P) = \\sqrt{x^2 + y^2 + z^2}',
            tone: 'sky',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Right-Handed Coordinate System',
        bullets: [
          '$x$-axis (red): toward the viewer; $y$-axis (green): to the right; $z$-axis (blue): upward',
          'The three coordinate planes ($xy$-, $xz$-, and $yz$-planes) divide space into 8 octants (Octants I–VIII)',
        ],
      },
      {
        heading: 'Step-by-Step Plotting of $P(x, y, z)$',
        bullets: [
          'Step 1: Start at the origin $(0,0,0)$ and move along the $x$-axis to $(x, 0, 0)$',
          'Step 2: Move parallel to the $y$-axis in the $xy$-plane to $(x, y, 0)$',
          'Step 3: Move upward ($z > 0$) or downward ($z < 0$) parallel to the $z$-axis to $P(x, y, z)$',
        ],
        formulas: [
          {
            label: 'Distance from the Origin',
            latex: 'd(O, P) = \\sqrt{x^2 + y^2 + z^2}',
            tone: 'sky',
          },
        ],
      },
    ],
  },
  {
    id: 3,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.2',
    tagEn: 'Scalars & Vectors',
    badgeEn: 'Lecture 1 • Section 1.2',
    titleTh: 'ความหมายของสเกลาร์และเวกเตอร์',
    titleEn: 'Geometric Vectors & Equivalence',
    cards: [
      {
        heading: 'ปริมาณสเกลาร์ vs ปริมาณเวกเตอร์',
        bullets: [
          'ปริมาณสเกลาร์ (Scalar): มีเฉพาะขนาด เช่น พื้นที่ ปริมาตร อุณหภูมิ',
          'ปริมาณเวกเตอร์ (Vector): มีทั้งขนาดและทิศทาง เช่น ความเร็ว แรง การกระจัด',
          'เวกเตอร์จากจุดเริ่มต้น $A$ ไปยังจุดสิ้นสุด $B$ เขียนแทนด้วย $\\overrightarrow{AB}$',
        ],
      },
      {
        heading: 'นิยามพื้นฐานสำคัญ',
        bullets: [
          'เวกเตอร์สมมูล (Equivalent Vectors): มีขนาดเท่ากันและทิศทางเดียวกัน (แม้จุดเริ่มต้นต่างกัน) เขียนแทนด้วย $\\vec{u} = \\vec{v}$',
          'เวกเตอร์ศูนย์ (Zero Vector, $\\vec{0}$): จุดเริ่มต้นและจุดสิ้นสุดเป็นจุดเดียวกัน (ขนาดเป็น $0$)',
          'เวกเตอร์ขนาน (Parallel Vectors): $\\vec{u}$ ขนานกับ $\\vec{v}$ เมื่อ $\\vec{v} = k\\vec{u}$ สำหรับบางสเกลาร์ $k \\neq 0$',
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Scalar vs. Vector Quantities',
        bullets: [
          'Scalar Quantity: described by magnitude alone (e.g., area, volume, temperature)',
          'Vector Quantity: has both magnitude and direction (e.g., velocity, force, displacement)',
          'The directed line segment from initial point $A$ to terminal point $B$ is denoted $\\overrightarrow{AB}$',
        ],
      },
      {
        heading: 'Fundamental Definitions',
        bullets: [
          'Equivalent (Equal) Vectors: have the same magnitude and direction (regardless of initial point), written $\\vec{u} = \\vec{v}$',
          'Zero Vector ($\\vec{0}$): initial and terminal points coincide (magnitude $0$)',
          'Parallel Vectors: $\\vec{u}$ is parallel to $\\vec{v}$ if $\\vec{v} = k\\vec{u}$ for some nonzero scalar $k \\neq 0$',
        ],
      },
    ],
  },
  {
    id: 4,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.3',
    tagEn: 'Vector Arithmetic (Geometry)',
    badgeEn: 'Lecture 1 • Section 1.3',
    titleTh: 'การบวก ลบ และคูณสเกลาร์เชิงเรขาคณิต',
    titleEn: 'Head-to-Tail, Parallelogram & Scaling',
    embed3D: 'arithmetic',
    embedHintTh: 'เลื่อนสไลเดอร์เพื่อดูการย้ายหางของ v ไปต่อหัวของ u แบบต่อหัว-หาง',
    embedHintEn: 'Drag the slider to translate the tail of v to the tip of u (head-to-tail)',
    cards: [
      {
        heading: 'การบวกเวกเตอร์ ($\\vec{u} + \\vec{v}$)',
        bullets: [
          'วิธีต่อหัว-หาง (Head-to-Tail): เลื่อนจุดเริ่มต้นของ $\\vec{v}$ มาต่อที่จุดสิ้นสุดของ $\\vec{u}$ ผลลัพธ์ลากจากหาง $\\vec{u}$ ไปหัว $\\vec{v}$',
          'กฎสี่เหลี่ยมด้านขนาน (Parallelogram Law): ให้หางร่วมกัน ผลบวกคือเส้นทแยงมุม',
        ],
      },
      {
        heading: 'การลบและคูณด้วยสเกลาร์',
        bullets: [
          'เวกเตอร์ลบ: $\\vec{u} - \\vec{v} = \\vec{u} + (-\\vec{v})$ โดย $-\\vec{v}$ มีขนาดเท่าเดิมแต่ทิศตรงข้าม',
          'การคูณสเกลาร์ $k\\vec{u}$: ถ้า $k > 0$ ทิศเดิม, ถ้า $k < 0$ ทิศตรงข้าม, ขนาดเปลี่ยนเป็น $|k|$ เท่า',
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Vector Addition ($\\vec{u} + \\vec{v}$)',
        bullets: [
          'Head-to-Tail (Triangle) Law: translate the initial point of $\\vec{v}$ to the terminal point of $\\vec{u}$; the sum runs from the tail of $\\vec{u}$ to the tip of $\\vec{v}$',
          'Parallelogram Law: place tails together; the sum $\\vec{u} + \\vec{v}$ is the main diagonal',
        ],
      },
      {
        heading: 'Vector Subtraction & Scalar Multiplication',
        bullets: [
          'Vector Difference: $\\vec{u} - \\vec{v} = \\vec{u} + (-\\vec{v})$, where $-\\vec{v}$ has the same magnitude as $\\vec{v}$ and opposite direction',
          'Scalar Multiple $k\\vec{u}$: same direction if $k > 0$, opposite direction if $k < 0$, with magnitude $|k|\\|\\vec{u}\\|$',
        ],
      },
    ],
  },
  {
    id: 5,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.4',
    tagEn: 'Component Form',
    badgeEn: 'Lecture 1 • Section 1.4',
    titleTh: 'เวกเตอร์ในรูปส่วนประกอบและทฤษฎีบท 1–2',
    titleEn: 'Vectors in Component Form (Theorems 1 & 2)',
    cards: [
      {
        heading: 'เวกเตอร์ตำแหน่ง (Position Vector)',
        bullets: [
          'เวกเตอร์ $\\vec{u}$ ที่มีจุดเริ่มต้นที่ $(0,0,0)$ และจุดสิ้นสุดที่ $(x_1, y_1, z_1)$ เขียนในรูปส่วนประกอบได้ว่า:',
        ],
        formulas: [
          {
            latex: '\\vec{u} = \\langle x_1, y_1, z_1 \\rangle',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'ทฤษฎีบท 1: การดำเนินการด้วยส่วนประกอบ',
        formulas: [
          {
            label: 'ให้ u = ⟨u₁, u₂, u₃⟩ และ v = ⟨v₁, v₂, v₃⟩',
            latex: '\\vec{u} \\pm \\vec{v} = \\langle u_1 \\pm v_1,\\; u_2 \\pm v_2,\\; u_3 \\pm v_3 \\rangle, \\qquad k\\vec{u} = \\langle ku_1, ku_2, ku_3 \\rangle',
            tone: 'emerald',
          },
        ],
      },
      {
        heading: 'ทฤษฎีบท 2: เวกเตอร์ระหว่างจุด 2 จุด',
        formulas: [
          {
            label: 'ให้ A(x₁, y₁, z₁) และ B(x₂, y₂, z₂)',
            latex: '\\overrightarrow{AB} = \\langle x_2 - x_1,\\; y_2 - y_1,\\; z_2 - z_1 \\rangle',
            tone: 'amber',
          },
        ],
        note: 'จำง่าย: จุดปลาย − จุดต้น (Terminal − Initial)',
      },
    ],
    cardsEn: [
      {
        heading: 'Position Vector',
        bullets: [
          'A vector $\\vec{u}$ with initial point at the origin $(0,0,0)$ and terminal point $(x_1, y_1, z_1)$ in component form is:',
        ],
        formulas: [
          {
            latex: '\\vec{u} = \\langle x_1, y_1, z_1 \\rangle',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'Theorem 1: Componentwise Operations',
        formulas: [
          {
            label: 'Let u = ⟨u₁, u₂, u₃⟩ and v = ⟨v₁, v₂, v₃⟩',
            latex: '\\vec{u} \\pm \\vec{v} = \\langle u_1 \\pm v_1,\\; u_2 \\pm v_2,\\; u_3 \\pm v_3 \\rangle, \\qquad k\\vec{u} = \\langle ku_1, ku_2, ku_3 \\rangle',
            tone: 'emerald',
          },
        ],
      },
      {
        heading: 'Theorem 2: Vector Between Two Points',
        formulas: [
          {
            label: 'Given A(x₁, y₁, z₁) and B(x₂, y₂, z₂)',
            latex: '\\overrightarrow{AB} = \\langle x_2 - x_1,\\; y_2 - y_1,\\; z_2 - z_1 \\rangle',
            tone: 'amber',
          },
        ],
        note: 'Key rule: Terminal point − Initial point',
      },
    ],
  },
  {
    id: 6,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 1',
    tagEn: 'Example 1 (Sheet p. 2)',
    badgeEn: 'Lecture 1 • Example 1',
    titleTh: 'ตัวอย่าง: การหาส่วนประกอบของเวกเตอร์ระหว่างจุด',
    titleEn: 'Example 1: Component Form Between Points',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $A(1, 2, 3),\\; B(4, -2, 1)$ และ $C(-3, 7, 2)$ จงหาเวกเตอร์ต่อไปนี้',
        promptEn: 'Given $A(1, 2, 3),\\; B(4, -2, 1)$, and $C(-3, 7, 2)$, find the following vectors:',
        promptLatex: '\\overrightarrow{AB},\\quad \\overrightarrow{AC},\\quad \\text{และ}\\quad \\overrightarrow{BA}',
        promptLatexEn: '\\overrightarrow{AB},\\quad \\overrightarrow{AC},\\quad \\text{and}\\quad \\overrightarrow{BA}',
        scene3D: {
          points: [
            { pos: [1, 2, 3], color: '#0f172a', label: 'A' },
            { pos: [4, -2, 1], color: '#0284c7', label: 'B' },
            { pos: [-3, 7, 2], color: '#059669', label: 'C' },
          ],
          vectors: [
            { origin: [1, 2, 3], vec: [3, -4, -2], color: '#0284c7', label: 'AB' },
            { origin: [1, 2, 3], vec: [-4, 5, -1], color: '#059669', label: 'AC' },
          ],
          hintTh: 'หมุนดูจุด A, B, C และเวกเตอร์ AB, AC ใน 3 มิติ',
          hintEn: 'Orbit to inspect points A, B, C and vectors AB, AC in 3D',
        },
      },
    ],
  },
  {
    id: 7,
    lecture: 1,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 1 • แนวข้อสอบ 1.4',
    tagEn: 'Exam Drill: Position Vectors & Linear Eq.',
    badgeEn: 'Lecture 1 • Exam Drill 1.4',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดยอดสี่เหลี่ยมด้านขนานและสมการเวกเตอร์',
    titleEn: 'Exam Drill: Parallelogram Vertices & Vector Equations',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh:
          'ให้จุด $A(1, -2, 3),\\; B(3, 1, 0)$ และ $C(2, 4, -1)$ เป็นจุดยอด $3$ จุดเรียงตามลำดับของรูปสี่เหลี่ยมด้านขนาน $ABCD$ จงหาพิกัดของจุดยอด $D$',
        promptEn:
          'Given three consecutive vertices $A(1, -2, 3),\\; B(3, 1, 0)$, and $C(2, 4, -1)$ of parallelogram $ABCD$, find the coordinates of vertex $D$.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh:
          'ให้ $\\vec{u} = \\langle 2, -1, 3 \\rangle$ และ $\\vec{v} = \\langle 0, 2, -2 \\rangle$ จงหาเวกเตอร์ $\\vec{w}$ ที่สอดคล้องสมการ $2\\vec{u} - 3\\vec{w} = \\vec{v} + \\vec{w}$',
        promptEn:
          'Let $\\vec{u} = \\langle 2, -1, 3 \\rangle$ and $\\vec{v} = \\langle 0, 2, -2 \\rangle$. Find the vector $\\vec{w}$ satisfying $2\\vec{u} - 3\\vec{w} = \\vec{v} + \\vec{w}$.',
      },
    ],
  },
  {
    id: 8,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • ทฤษฎีบท 3',
    tagEn: 'Properties of Vector Operations',
    badgeEn: 'Lecture 1 • Theorem 3',
    titleTh: 'สมบัติพีชคณิตของเวกเตอร์ (ทฤษฎีบท 3)',
    titleEn: 'Algebraic Properties of Vectors (Theorem 3)',
    cards: [
      {
        heading: 'สมบัติการบวก (ให้ $\\vec{u}, \\vec{v}, \\vec{w}$ เป็นเวกเตอร์ใน 3 มิติ)',
        formulaCols: 2,
        formulas: [
          { label: '1. สลับที่การบวก', latex: '\\vec{u} + \\vec{v} = \\vec{v} + \\vec{u}' },
          { label: '2. เปลี่ยนหมู่การบวก', latex: '(\\vec{u} + \\vec{v}) + \\vec{w} = \\vec{u} + (\\vec{v} + \\vec{w})' },
          { label: '3. เอกลักษณ์การบวก', latex: '\\vec{u} + \\vec{0} = \\vec{u} = \\vec{0} + \\vec{u}' },
          { label: '4. ตัวผกผันการบวก', latex: '\\vec{u} + (-\\vec{u}) = \\vec{0}' },
        ],
      },
      {
        heading: 'สมบัติการคูณด้วยสเกลาร์ ($a, b$ เป็นสเกลาร์)',
        formulaCols: 2,
        formulas: [
          { label: '5. เปลี่ยนหมู่สเกลาร์', latex: 'a(b\\vec{u}) = (ab)\\vec{u}', tone: 'sky' },
          { label: '6. แจกแจงบนเวกเตอร์', latex: 'a(\\vec{u} + \\vec{v}) = a\\vec{u} + a\\vec{v}', tone: 'sky' },
          { label: '7. แจกแจงบนสเกลาร์', latex: '(a + b)\\vec{u} = a\\vec{u} + b\\vec{u}', tone: 'sky' },
          { label: '8. เอกลักษณ์สเกลาร์', latex: '1\\vec{u} = \\vec{u}', tone: 'sky' },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Addition Properties (for vectors $\\vec{u}, \\vec{v}, \\vec{w}$ in $\\mathbb{R}^3$)',
        formulaCols: 2,
        formulas: [
          { label: '1. Commutative', latex: '\\vec{u} + \\vec{v} = \\vec{v} + \\vec{u}' },
          { label: '2. Associative', latex: '(\\vec{u} + \\vec{v}) + \\vec{w} = \\vec{u} + (\\vec{v} + \\vec{w})' },
          { label: '3. Additive Identity', latex: '\\vec{u} + \\vec{0} = \\vec{u} = \\vec{0} + \\vec{u}' },
          { label: '4. Additive Inverse', latex: '\\vec{u} + (-\\vec{u}) = \\vec{0}' },
        ],
      },
      {
        heading: 'Scalar Multiplication Properties ($a, b \\in \\mathbb{R}$)',
        formulaCols: 2,
        formulas: [
          { label: '5. Scalar Associativity', latex: 'a(b\\vec{u}) = (ab)\\vec{u}', tone: 'sky' },
          { label: '6. Distributive (Vector)', latex: 'a(\\vec{u} + \\vec{v}) = a\\vec{u} + a\\vec{v}', tone: 'sky' },
          { label: '7. Distributive (Scalar)', latex: '(a + b)\\vec{u} = a\\vec{u} + b\\vec{u}', tone: 'sky' },
          { label: '8. Multiplicative Identity', latex: '1\\vec{u} = \\vec{u}', tone: 'sky' },
        ],
      },
    ],
  },
  {
    id: 9,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.5',
    tagEn: 'Magnitude / Length',
    badgeEn: 'Lecture 1 • Section 1.5',
    titleTh: 'ขนาดของเวกเตอร์ (Magnitude / Norm)',
    titleEn: 'Magnitude (Norm) of a Vector in 3D Space',
    cards: [
      {
        heading: 'นิยามขนาดของเวกเตอร์ $\\vec{u} = \\langle u_1, u_2, u_3 \\rangle$',
        formulas: [
          {
            label: 'เขียนแทนด้วย ||u||',
            latex: '\\|\\vec{u}\\| = \\sqrt{u_1^2 + u_2^2 + u_3^2}',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'สมบัติขนาดเมื่อคูณด้วยสเกลาร์ $k$',
        formulas: [
          {
            latex: '\\|k\\vec{u}\\| = \\sqrt{(ku_1)^2 + (ku_2)^2 + (ku_3)^2} = \\sqrt{k^2(u_1^2 + u_2^2 + u_3^2)} = |k|\\,\\|\\vec{u}\\|',
            tone: 'emerald',
          },
        ],
        note: 'ระวัง: ต้องใส่ค่าสัมบูรณ์ |k| เสมอ เช่น ||-3v|| = |-3| ||v|| = 3||v||',
      },
    ],
    cardsEn: [
      {
        heading: 'Definition of Magnitude for $\\vec{u} = \\langle u_1, u_2, u_3 \\rangle$',
        formulas: [
          {
            label: 'Denoted by ||u||',
            latex: '\\|\\vec{u}\\| = \\sqrt{u_1^2 + u_2^2 + u_3^2}',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'Scaling Property for Any Scalar $k$',
        formulas: [
          {
            latex: '\\|k\\vec{u}\\| = \\sqrt{(ku_1)^2 + (ku_2)^2 + (ku_3)^2} = \\sqrt{k^2(u_1^2 + u_2^2 + u_3^2)} = |k|\\,\\|\\vec{u}\\|',
            tone: 'emerald',
          },
        ],
        note: 'Caution: Always include absolute value |k|, e.g., ||-3v|| = |-3| ||v|| = 3||v||',
      },
    ],
  },
  {
    id: 10,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 2',
    tagEn: 'Example 2 (Sheet p. 3)',
    badgeEn: 'Lecture 1 • Example 2',
    titleTh: 'ตัวอย่าง: การหาขนาดของเวกเตอร์',
    titleEn: 'Example 2: Computing Vector Magnitude',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        labelEn: 'Part (1)',
        promptTh: 'ให้ $\\vec{v} = \\langle 2, -2, 1 \\rangle$ จงหา $\\|\\vec{v}\\|$',
        promptEn: 'Given $\\vec{v} = \\langle 2, -2, 1 \\rangle$, find $\\|\\vec{v}\\|$.',
        scene3D: {
          vectors: [{ vec: [2, -2, 1], color: '#0284c7', label: 'v = ⟨2,-2,1⟩' }],
          hintTh: 'หมุนดูความยาวของ v = ⟨2, -2, 1⟩ จากจุดกำเนิด',
          hintEn: 'Orbit to inspect the length of v = ⟨2, -2, 1⟩ from the origin',
        },
      },
      {
        label: 'ข้อย่อย 2',
        labelEn: 'Part (2)',
        promptTh: 'ให้ $\\vec{u} = \\langle 1, -4, 2 \\rangle$ และ $\\vec{v} = \\langle -2, 3, 1 \\rangle$ จงหา $\\|\\vec{u}\\|$ และ $\\|-3\\vec{v}\\|$',
        promptEn: 'Given $\\vec{u} = \\langle 1, -4, 2 \\rangle$ and $\\vec{v} = \\langle -2, 3, 1 \\rangle$, find $\\|\\vec{u}\\|$ and $\\|-3\\vec{v}\\|$.',
        scene3D: {
          vectors: [
            { vec: [1, -4, 2], color: '#0284c7', label: 'u' },
            { vec: [-2, 3, 1], color: '#059669', label: 'v' },
            { vec: [6, -9, -3], color: '#e11d48', label: '-3v', opacity: 0.78 },
          ],
          hintTh: 'หมุนเทียบขนาด u, v และ -3v (ย่อสเกลพอดีแกน)',
          hintEn: 'Compare magnitudes of u, v, and -3v (scaled to fit axes)',
        },
      },
    ],
  },
  {
    id: 11,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.6',
    tagEn: 'Unit Vectors & Standard Basis',
    badgeEn: 'Lecture 1 • Section 1.6',
    titleTh: 'เวกเตอร์หนึ่งหน่วยและเวกเตอร์ฐานมาตรฐาน',
    titleEn: 'Unit Vectors & Standard Basis i, j, k',
    cards: [
      {
        heading: 'เวกเตอร์หนึ่งหน่วย (Unit Vector) & ฐานมาตรฐาน',
        bullets: [
          'เวกเตอร์หนึ่งหน่วย คือ เวกเตอร์ที่มีขนาดเท่ากับ $1$ ($\\|\\vec{u}\\| = 1$)',
          'เวกเตอร์ฐานมาตรฐานใน 3 มิติ:',
        ],
        formulas: [
          {
            latex: '\\vec{i} = \\langle 1,0,0 \\rangle,\\quad \\vec{j} = \\langle 0,1,0 \\rangle,\\quad \\vec{k} = \\langle 0,0,1 \\rangle',
            tone: 'sky',
          },
          {
            label: 'การเขียนเวกเตอร์ในรูป i, j, k',
            latex: '\\langle a, b, c \\rangle = a\\langle 1,0,0 \\rangle + b\\langle 0,1,0 \\rangle + c\\langle 0,0,1 \\rangle = a\\vec{i} + b\\vec{j} + c\\vec{k}',
          },
        ],
      },
      {
        heading: 'การสร้างเวกเตอร์หนึ่งหน่วยจาก $\\vec{u} \\neq \\vec{0}$ (Normalization)',
        formulaCols: 2,
        formulas: [
          {
            label: 'ขนาด 1 หน่วย ทิศทางเดียวกับ u',
            latex: '\\hat{u} = \\frac{\\vec{u}}{\\|\\vec{u}\\|} = \\frac{1}{\\|\\vec{u}\\|}\\vec{u}',
            tone: 'emerald',
          },
          {
            label: 'ขนาด 1 หน่วย ทิศทางตรงข้ามกับ u',
            latex: '-\\hat{u} = -\\frac{\\vec{u}}{\\|\\vec{u}\\|}',
            tone: 'rose',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Unit Vector & Standard Basis Vectors',
        bullets: [
          'A unit vector is a vector of magnitude $1$ ($\\|\\vec{u}\\| = 1$)',
          'Standard basis vectors in $\\mathbb{R}^3$:',
        ],
        formulas: [
          {
            latex: '\\vec{i} = \\langle 1,0,0 \\rangle,\\quad \\vec{j} = \\langle 0,1,0 \\rangle,\\quad \\vec{k} = \\langle 0,0,1 \\rangle',
            tone: 'sky',
          },
          {
            label: 'Writing a vector in terms of i, j, k',
            latex: '\\langle a, b, c \\rangle = a\\langle 1,0,0 \\rangle + b\\langle 0,1,0 \\rangle + c\\langle 0,0,1 \\rangle = a\\vec{i} + b\\vec{j} + c\\vec{k}',
          },
        ],
      },
      {
        heading: 'Unit Vector in the Direction of $\\vec{u} \\neq \\vec{0}$ (Normalization)',
        formulaCols: 2,
        formulas: [
          {
            label: 'Unit length, same direction as u',
            latex: '\\hat{u} = \\frac{\\vec{u}}{\\|\\vec{u}\\|} = \\frac{1}{\\|\\vec{u}\\|}\\vec{u}',
            tone: 'emerald',
          },
          {
            label: 'Unit length, opposite direction to u',
            latex: '-\\hat{u} = -\\frac{\\vec{u}}{\\|\\vec{u}\\|}',
            tone: 'rose',
          },
        ],
      },
    ],
  },
  {
    id: 12,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 3',
    tagEn: 'Example 3 (Sheet p. 4)',
    badgeEn: 'Lecture 1 • Example 3',
    titleTh: 'ตัวอย่าง: การสร้างเวกเตอร์หนึ่งหน่วยและปรับขนาด',
    titleEn: 'Example 3: Unit Vector & Scaling to Target Length',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = \\langle 1, -4, 2 \\rangle$ จงหา (1) เวกเตอร์หนึ่งหน่วยที่มีทิศทางเดียวกับ $\\vec{u}$ และ (2) เวกเตอร์ขนาด $7$ หน่วยที่มีทิศตรงข้ามกับ $\\vec{u}$',
        promptEn: 'Given $\\vec{u} = \\langle 1, -4, 2 \\rangle$, find (1) a unit vector in the same direction as $\\vec{u}$, and (2) a vector of length $7$ in the opposite direction to $\\vec{u}$.',
        scene3D: {
          vectors: [
            { vec: [1, -4, 2], color: '#93c5fd', label: 'u = ⟨1,-4,2⟩', opacity: 0.65 },
            { vec: [0.218, -0.873, 0.436], color: '#1d4ed8', label: 'û' },
            { vec: [-0.218, 0.873, -0.436], color: '#be123c', label: '-û' },
          ],
          hintTh: 'u สีอ่อน (ตัวใหญ่), û น้ำเงินเข้ม, -û แดงเข้ม',
          hintEn: 'u (light blue), û (dark blue unit vector), -û (crimson opposite unit)',
        },
      },
    ],
  },
  {
    id: 13,
    lecture: 1,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 1 • แนวข้อสอบ 1.5–1.6',
    tagEn: 'Exam Drill: Magnitude & Unit Vectors',
    badgeEn: 'Lecture 1 • Exam Drill 1.5–1.6',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: หาตัวแปรจากขนาดและปรับขนาดเวกเตอร์',
    titleEn: 'Exam Drill: Scalar Parameters & Scaling Vectors',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh: 'จงหาค่า $k$ ทั้งหมดที่ทำให้เวกเตอร์ $\\vec{v} = \\langle k, 2, 2k \\rangle$ มีขนาดเท่ากับ $7$ หน่วย',
        promptEn: 'Find all values of $k$ such that the vector $\\vec{v} = \\langle k, 2, 2k \\rangle$ has magnitude $7$.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh:
          'จงหาเวกเตอร์ $\\vec{w}$ ที่มีขนาด $10$ หน่วย และมีทิศทางตรงข้ามกับ $\\overrightarrow{PQ}$ เมื่อ $P(1, 2, -1)$ และ $Q(4, -2, -1)$',
        promptEn:
          'Find a vector $\\vec{w}$ of length $10$ in the direction opposite to $\\overrightarrow{PQ}$, where $P(1, 2, -1)$ and $Q(4, -2, -1)$.',
      },
    ],
  },
  {
    id: 14,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.7',
    tagEn: 'Dot Product & Angle',
    badgeEn: 'Lecture 1 • Section 1.7',
    titleTh: 'ผลคูณเชิงสเกลาร์ / ผลคูณจุด (Dot Product)',
    titleEn: 'Dot Product, Angle Between Vectors & Properties',
    cards: [
      {
        heading: 'นิยามและทฤษฎีบท 4 (มุมระหว่างเวกเตอร์ $0 \\le \\theta \\le \\pi$)',
        formulas: [
          {
            label: 'สูตรคำนวณจากส่วนประกอบ (ได้สเกลาร์)',
            latex: '\\vec{u} \\cdot \\vec{v} = u_1 v_1 + u_2 v_2 + u_3 v_3',
            tone: 'sky',
          },
          {
            label: 'ความสัมพันธ์กับมุม θ',
            latex: '\\vec{u} \\cdot \\vec{v} = \\|\\vec{u}\\|\\|\\vec{v}\\|\\cos\\theta \\implies \\theta = \\arccos\\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{u}\\|\\|\\vec{v}\\|}\\right)',
            tone: 'emerald',
          },
        ],
      },
      {
        heading: 'การจำแนกมุมและสมบัติ (ทฤษฎีบท 5)',
        bullets: [
          '$\\vec{u}\\cdot\\vec{v} > 0 \\iff \\theta$ เป็นมุมแหลม; $\\quad \\vec{u}\\cdot\\vec{v} < 0 \\iff \\theta$ เป็นมุมป้าน',
          'เวกเตอร์ไม่เป็นศูนย์ $\\vec{u},\\vec{v}$ ตั้งฉากกัน (Orthogonal) $\\iff \\vec{u}\\cdot\\vec{v} = 0$',
          '$\\vec{u}\\cdot\\vec{v} = \\vec{v}\\cdot\\vec{u}, \\quad \\vec{u}\\cdot(\\vec{v}+\\vec{w}) = \\vec{u}\\cdot\\vec{v} + \\vec{u}\\cdot\\vec{w}, \\quad \\vec{u}\\cdot\\vec{u} = \\|\\vec{u}\\|^2$',
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Definition & Theorem 4 (Angle $0 \\le \\theta \\le \\pi$)',
        formulas: [
          {
            label: 'Componentwise Formula (Scalar Output)',
            latex: '\\vec{u} \\cdot \\vec{v} = u_1 v_1 + u_2 v_2 + u_3 v_3',
            tone: 'sky',
          },
          {
            label: 'Angle Between Two Nonzero Vectors',
            latex: '\\vec{u} \\cdot \\vec{v} = \\|\\vec{u}\\|\\|\\vec{v}\\|\\cos\\theta \\implies \\theta = \\arccos\\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{u}\\|\\|\\vec{v}\\|}\\right)',
            tone: 'emerald',
          },
        ],
      },
      {
        heading: 'Angle Classification & Properties (Theorem 5)',
        bullets: [
          '$\\vec{u}\\cdot\\vec{v} > 0 \\iff \\theta$ is acute; $\\quad \\vec{u}\\cdot\\vec{v} < 0 \\iff \\theta$ is obtuse',
          'Nonzero vectors $\\vec{u},\\vec{v}$ are orthogonal (perpendicular) $\\iff \\vec{u}\\cdot\\vec{v} = 0$',
          '$\\vec{u}\\cdot\\vec{v} = \\vec{v}\\cdot\\vec{u}, \\quad \\vec{u}\\cdot(\\vec{v}+\\vec{w}) = \\vec{u}\\cdot\\vec{v} + \\vec{u}\\cdot\\vec{w}, \\quad \\vec{u}\\cdot\\vec{u} = \\|\\vec{u}\\|^2$',
        ],
      },
    ],
  },
  {
    id: 15,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 4',
    tagEn: 'Example 4 (Sheet p. 5–6)',
    badgeEn: 'Lecture 1 • Example 4',
    titleTh: 'ตัวอย่าง: การหาผลคูณจุด มุม และการตรวจสอบตั้งฉาก',
    titleEn: 'Example 4: Dot Product, Angle & Orthogonality Check',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        labelEn: 'Part (1)',
        promptTh: 'ให้ $\\vec{u} = \\langle -1, 2, 1 \\rangle$ และ $\\vec{v} = \\langle -2, 1, -1 \\rangle$ จงหา $\\vec{u}\\cdot\\vec{v}$ และมุม $\\theta$ ระหว่าง $\\vec{u}$ และ $\\vec{v}$',
        promptEn: 'Given $\\vec{u} = \\langle -1, 2, 1 \\rangle$ and $\\vec{v} = \\langle -2, 1, -1 \\rangle$, find $\\vec{u}\\cdot\\vec{v}$ and the angle $\\theta$ between $\\vec{u}$ and $\\vec{v}$.',
        scene3D: {
          vectors: [
            { vec: [-1, 2, 1], color: '#0284c7', label: 'u' },
            { vec: [-2, 1, -1], color: '#059669', label: 'v' },
          ],
          showAngle: true,
          angleLabel: 'θ',
          hintTh: 'หมุนดูมุม θ ระหว่าง u และ v ใน 3 มิติ',
          hintEn: 'Orbit to inspect the angle θ between u and v in 3D',
        },
      },
      {
        label: 'ข้อย่อย 2',
        labelEn: 'Part (2)',
        promptTh: 'จงแสดงว่าเวกเตอร์ $2\\vec{i} + 2\\vec{j} - \\vec{k}$ ตั้งฉากกับเวกเตอร์ $5\\vec{i} - 4\\vec{j} + 2\\vec{k}$',
        promptEn: 'Show that the vector $2\\vec{i} + 2\\vec{j} - \\vec{k}$ is orthogonal to $5\\vec{i} - 4\\vec{j} + 2\\vec{k}$.',
        scene3D: {
          vectors: [
            { vec: [2, 2, -1], color: '#0284c7', label: 'a = ⟨2,2,-1⟩' },
            { vec: [5, -4, 2], color: '#d97706', label: 'b = ⟨5,-4,2⟩' },
          ],
          showRightAngle: true,
          hintTh: 'หมุนเช็กมุมฉาก (90°) ระหว่างเวกเตอร์ทั้งสอง',
          hintEn: 'Orbit to verify the right angle (90°) between both vectors',
        },
      },
    ],
  },
  {
    id: 16,
    lecture: 1,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 1 • แนวข้อสอบ 1.7',
    tagEn: 'Exam Drill: Dot Product & Orthogonality',
    badgeEn: 'Lecture 1 • Exam Drill 1.7',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: ผลคูณจุด เงื่อนไขตั้งฉาก และสมบัติพีชคณิต',
    titleEn: 'Exam Drill: Orthogonality & Dot Product Expansion',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh:
          'ให้ $\\vec{u} = \\langle k, -1, 2 \\rangle$ และ $\\vec{v} = \\langle k, 3, -k \\rangle$ จงหาค่า $k$ ทั้งหมดที่ทำให้ $\\vec{u}$ ตั้งฉากกับ $\\vec{v}$',
        promptEn:
          'Let $\\vec{u} = \\langle k, -1, 2 \\rangle$ and $\\vec{v} = \\langle k, 3, -k \\rangle$. Find all values of $k$ for which $\\vec{u}$ is orthogonal to $\\vec{v}$.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh:
          'กำหนดให้ $\\|\\vec{u}\\| = 3,\\; \\|\\vec{v}\\| = 4$ และมุมระหว่าง $\\vec{u}$ กับ $\\vec{v}$ คือ $60^\\circ$ จงหาค่า $(2\\vec{u} - \\vec{v})\\cdot(\\vec{u} + 3\\vec{v})$ และ $\\|\\vec{u} + \\vec{v}\\|$',
        promptEn:
          'Given $\\|\\vec{u}\\| = 3,\\; \\|\\vec{v}\\| = 4$, and the angle between $\\vec{u}$ and $\\vec{v}$ is $60^\\circ$, evaluate $(2\\vec{u} - \\vec{v})\\cdot(\\vec{u} + 3\\vec{v})$ and $\\|\\vec{u} + \\vec{v}\\|$.',
      },
    ],
  },
  {
    id: 17,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • เสริมจากผลคูณจุด',
    tagEn: 'Direction Angles & Cosines',
    badgeEn: 'Lecture 1 • Extension',
    titleTh: 'มุมบอกทิศทาง (Direction Angles α, β, γ)',
    titleEn: 'Direction Angles & Direction Cosines (α, β, γ)',
    embed3D: 'dir_angles',
    embedHintTh: 'หมุนดูมุม α (แดง), β (เขียว), γ (น้ำเงิน) ที่เวกเตอร์ทำกับแกน +x, +y, +z',
    embedHintEn: 'Orbit to view α (red), β (green), and γ (blue) with the +x, +y, +z axes',
    cards: [
      {
        heading: 'นิยามมุมบอกทิศทาง ($0 \\le \\alpha, \\beta, \\gamma \\le \\pi$)',
        bullets: [
          '$\\alpha$ คือ มุมระหว่างเวกเตอร์ $\\vec{u}$ กับแกน $+x$ ($\\vec{i}$)',
          '$\\beta$ คือ มุมระหว่างเวกเตอร์ $\\vec{u}$ กับแกน $+y$ ($\\vec{j}$)',
          '$\\gamma$ คือ มุมระหว่างเวกเตอร์ $\\vec{u}$ กับแกน $+z$ ($\\vec{k}$)',
        ],
      },
      {
        heading: 'โคไซน์แสดงทิศทาง (Direction Cosines)',
        formulas: [
          {
            latex: '\\cos\\alpha = \\frac{u_1}{\\|\\vec{u}\\|},\\quad \\cos\\beta = \\frac{u_2}{\\|\\vec{u}\\|},\\quad \\cos\\gamma = \\frac{u_3}{\\|\\vec{u}\\|}',
            tone: 'sky',
          },
          {
            label: 'เอกลักษณ์สำคัญ',
            latex: '\\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1',
            tone: 'emerald',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Definition of Direction Angles ($0 \\le \\alpha, \\beta, \\gamma \\le \\pi$)',
        bullets: [
          '$\\alpha$ is the angle between $\\vec{u}$ and the positive $x$-axis ($\\vec{i}$)',
          '$\\beta$ is the angle between $\\vec{u}$ and the positive $y$-axis ($\\vec{j}$)',
          '$\\gamma$ is the angle between $\\vec{u}$ and the positive $z$-axis ($\\vec{k}$)',
        ],
      },
      {
        heading: 'Direction Cosines',
        formulas: [
          {
            latex: '\\cos\\alpha = \\frac{u_1}{\\|\\vec{u}\\|},\\quad \\cos\\beta = \\frac{u_2}{\\|\\vec{u}\\|},\\quad \\cos\\gamma = \\frac{u_3}{\\|\\vec{u}\\|}',
            tone: 'sky',
          },
          {
            label: 'Fundamental Identity',
            latex: '\\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1',
            tone: 'emerald',
          },
        ],
      },
    ],
  },
  {
    id: 18,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • แนวข้อสอบมุมทิศทาง',
    tagThPublic: 'คาบที่ 1 • ตัวอย่างมุมทิศทาง',
    tagEn: 'Direction Angles & Cosines',
    badgeEn: 'Lecture 1 • Exam Drill',
    badgeEnPublic: 'Lecture 1 • Example',
    titleTh: 'ตัวอย่าง & แนวข้อสอบ: โคไซน์และมุมบอกทิศทาง (α, β, γ)',
    titleThPublic: 'ตัวอย่าง: โคไซน์และมุมบอกทิศทาง (α, β, γ)',
    titleEn: 'Example & Drill: Direction Cosines and Angles',
    titleEnPublic: 'Example: Computing Direction Cosines and Angles',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        labelEn: 'Part (1)',
        promptTh:
          'จงหาโคไซน์แสดงทิศทาง ($\\cos\\alpha, \\cos\\beta, \\cos\\gamma$) และมุมบอกทิศทางของเวกเตอร์ $\\vec{u} = \\langle 1, \\sqrt{2}, 1 \\rangle$',
        promptEn:
          'Find the direction cosines ($\\cos\\alpha, \\cos\\beta, \\cos\\gamma$) and direction angles of $\\vec{u} = \\langle 1, \\sqrt{2}, 1 \\rangle$.',
        scene3D: {
          vectors: [{ vec: [1, 1.4142, 1], color: '#0284c7', label: 'u = ⟨1,√2,1⟩' }],
          hintTh: 'หมุนดูมุม α, β, γ ของ u กับแกน +x, +y, +z',
          hintEn: 'Orbit to observe angles α, β, γ of u with +x, +y, +z axes',
        },
      },
      {
        label: 'แนวข้อสอบ',
        labelEn: 'Exam Drill',
        isExamDrill: true,
        promptTh:
          'เวกเตอร์หนึ่งหน่วย $\\hat{u}$ ทำมุม $\\alpha = 60^\\circ$ กับแกน $+x$ และทำมุม $\\beta = 45^\\circ$ กับแกน $+y$ จงหาค่ามุม $\\gamma$ ที่เป็นไปได้ทั้งหมด และเขียน $\\hat{u}$ ในรูปส่วนประกอบ',
        promptEn:
          'A unit vector $\\hat{u}$ makes angles $\\alpha = 60^\\circ$ with the $+x$-axis and $\\beta = 45^\\circ$ with the $+y$-axis. Find all possible angles $\\gamma$ and write $\\hat{u}$ in component form.',
      },
    ],
  },

  // ==================== LECTURE 2 (Slides 19 - 37) ====================
  {
    id: 19,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.8',
    tagEn: 'Orthogonal Projection',
    badgeEn: 'Lecture 2 • Section 1.8',
    titleTh: 'การฉายเชิงตั้งฉากของเวกเตอร์ (Projection)',
    titleEn: 'Orthogonal Vector Projection of u onto v',
    embed3D: 'projection',
    embedHintTh: 'สังเกตเงาฉายสีทองของ u ลงบนแนวของ v พร้อมมุมฉากสีแดง',
    embedHintEn: 'Observe the gold orthogonal projection of u onto v with the red right angle',
    cards: [
      {
        heading: 'ความหมายเชิงเรขาคณิตของเวกเตอร์ฉาย',
        bullets: [
          '$\\operatorname{Proj}_{\\vec{v}} \\vec{u}$ คือ เวกเตอร์ฉายเชิงตั้งฉากของเวกเตอร์ $\\vec{u}$ ลงบนแนวของเวกเตอร์ $\\vec{v}$',
          'กรณีมุมแหลม ($0 < \\theta < \\frac{\\pi}{2}$): มีขนาด $\\|\\vec{u}\\|\\cos\\theta = \\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|}$ และทิศเดียวกับ $\\vec{v}$',
          'กรณีมุมป้าน ($\\frac{\\pi}{2} < \\theta \\le \\pi$): ค่า $\\vec{u}\\cdot\\vec{v} < 0$ ทำให้ทิศกลับตรงข้าม $\\vec{v}$ โดยอัตโนมัติ (ใช้สูตรเดียวกันได้)',
        ],
      },
      {
        heading: 'สูตรเวกเตอร์ฉายเชิงตั้งฉาก',
        formulas: [
          {
            latex: '\\operatorname{Proj}_{\\vec{v}} \\vec{u} = \\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|}\\right)\\frac{\\vec{v}}{\\|\\vec{v}\\|} = \\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|^2}\\right)\\vec{v}',
            tone: 'amber',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Geometric Meaning of Vector Projection',
        bullets: [
          '$\\operatorname{Proj}_{\\vec{v}} \\vec{u}$ is the orthogonal projection of $\\vec{u}$ onto the line along $\\vec{v}$',
          'Acute angle ($0 < \\theta < \\frac{\\pi}{2}$): scalar projection $\\|\\vec{u}\\|\\cos\\theta = \\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|}$, in the same direction as $\\vec{v}$',
          'Obtuse angle ($\\frac{\\pi}{2} < \\theta \\le \\pi$): $\\vec{u}\\cdot\\vec{v} < 0$ automatically reverses direction opposite to $\\vec{v}$',
        ],
      },
      {
        heading: 'Orthogonal Projection Formula',
        formulas: [
          {
            latex: '\\operatorname{Proj}_{\\vec{v}} \\vec{u} = \\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|}\\right)\\frac{\\vec{v}}{\\|\\vec{v}\\|} = \\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|^2}\\right)\\vec{v}',
            tone: 'amber',
          },
        ],
      },
    ],
  },
  {
    id: 20,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 5',
    tagEn: 'Example 5 (Sheet p. 7)',
    badgeEn: 'Lecture 2 • Example 5',
    titleTh: 'ตัวอย่าง: การหาเวกเตอร์ฉายเชิงตั้งฉาก',
    titleEn: 'Example 5: Computing Orthogonal Projections',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = 2\\vec{i} + 3\\vec{j} - \\vec{k}$ และ $\\vec{v} = -\\vec{i} + \\vec{j} - 2\\vec{k}$ จงหา',
        promptEn: 'Given $\\vec{u} = 2\\vec{i} + 3\\vec{j} - \\vec{k}$ and $\\vec{v} = -\\vec{i} + \\vec{j} - 2\\vec{k}$, find:',
        promptLatex: '\\operatorname{Proj}_{\\vec{v}} \\vec{u} \\quad \\text{และ} \\quad \\operatorname{Proj}_{\\vec{u}} \\vec{v}',
        promptLatexEn: '\\operatorname{Proj}_{\\vec{v}} \\vec{u} \\quad \\text{and} \\quad \\operatorname{Proj}_{\\vec{u}} \\vec{v}',
        scene3D: {
          vectors: [
            { vec: [2, 3, -1], color: '#0284c7', label: 'u' },
            { vec: [-1, 1, -2], color: '#059669', label: 'v' },
          ],
          showAngle: true,
          angleLabel: 'θ',
          hintTh: 'หมุนดูแนวการฉายระหว่าง u และ v ใน 3 มิติ',
          hintEn: 'Orbit to compare the projection directions between u and v in 3D',
        },
      },
    ],
  },
  {
    id: 21,
    lecture: 2,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 2 • แนวข้อสอบ 1.8',
    tagEn: 'Exam Drill: Orthogonal Decomposition & Work',
    badgeEn: 'Lecture 2 • Exam Drill 1.8',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: แยกเวกเตอร์ขนาน–ตั้งฉาก และงานของแรง',
    titleEn: 'Exam Drill: Orthogonal Decomposition & Work',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh:
          'ให้ $\\vec{u} = \\langle 4, 5, 2 \\rangle$ และ $\\vec{v} = \\langle 1, 2, 2 \\rangle$ จงเขียน $\\vec{u} = \\vec{w}_1 + \\vec{w}_2$ โดยที่ $\\vec{w}_1$ ขนานกับ $\\vec{v}$ และ $\\vec{w}_2$ ตั้งฉากกับ $\\vec{v}$',
        promptEn:
          'Given $\\vec{u} = \\langle 4, 5, 2 \\rangle$ and $\\vec{v} = \\langle 1, 2, 2 \\rangle$, decompose $\\vec{u} = \\vec{w}_1 + \\vec{w}_2$ where $\\vec{w}_1$ is parallel to $\\vec{v}$ and $\\vec{w}_2$ is orthogonal to $\\vec{v}$.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh:
          'แรงคงตัว $\\vec{F} = 4\\vec{i} - 2\\vec{j} + 5\\vec{k}$ นิวตัน เลื่อนวัตถุจาก $A(1, 0, -2)$ ไป $B(3, 2, -1)$ (เมตร) จงหาขนาดแรงฉายตามแนวเคลื่อนที่ และงาน $W = \\vec{F}\\cdot\\overrightarrow{AB}$',
        promptEn:
          'A constant force $\\vec{F} = 4\\vec{i} - 2\\vec{j} + 5\\vec{k}$ N moves an object from $A(1, 0, -2)$ to $B(3, 2, -1)$ (in meters). Find the scalar force component along $\\overrightarrow{AB}$ and the work done $W = \\vec{F}\\cdot\\overrightarrow{AB}$.',
      },
    ],
  },
  {
    id: 22,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.9',
    tagEn: 'Cross Product',
    badgeEn: 'Lecture 2 • Section 1.9',
    titleTh: 'ผลคูณเชิงเวกเตอร์ / ผลคูณไขว้ (Cross Product)',
    titleEn: 'Cross Product, Determinant & Right-Hand Rule',
    embed3D: 'cross',
    embedHintTh: 'กดปุ่มสลับ u × v ↔ v × u เพื่อสังเกตทิศทางตรงข้ามตามกฎมือขวา',
    embedHintEn: 'Toggle u × v ↔ v × u to observe opposite directions via the right-hand rule',
    cards: [
      {
        heading: 'แนวคิดและนิยามด้วยดีเทอร์มิแนนต์ $3\\times 3$',
        bullets: [
          'ผลลัพธ์ของ $\\vec{u}\\times\\vec{v}$ เป็นเวกเตอร์ที่ตั้งฉากกับทั้ง $\\vec{u}$ และ $\\vec{v}$ ตามกฎมือขวา',
        ],
        formulas: [
          {
            latex: '\\vec{u}\\times\\vec{v} = \\begin{vmatrix} \\vec{i} & \\vec{j} & \\vec{k} \\\\ u_1 & u_2 & u_3 \\\\ v_1 & v_2 & v_3 \\end{vmatrix} = \\begin{vmatrix} u_2 & u_3 \\\\ v_2 & v_3 \\end{vmatrix}\\vec{i} - \\begin{vmatrix} u_1 & u_3 \\\\ v_1 & v_3 \\end{vmatrix}\\vec{j} + \\begin{vmatrix} u_1 & u_2 \\\\ v_1 & v_2 \\end{vmatrix}\\vec{k}',
            tone: 'rose',
          },
        ],
      },
      {
        heading: 'สมบัติสำคัญ (ทฤษฎีบท 6)',
        bullets: [
          '$\\vec{u}\\times\\vec{v} = -(\\vec{v}\\times\\vec{u})$ (ไม่มีสมบัติสลับที่) • $\\vec{u}\\times\\vec{u} = \\vec{0},\\; \\vec{u}\\times\\vec{0} = \\vec{0}$',
          '$\\vec{i}\\times\\vec{j} = \\vec{k},\\; \\vec{j}\\times\\vec{k} = \\vec{i},\\; \\vec{k}\\times\\vec{i} = \\vec{j}$ (ไม่เปลี่ยนหมู่: $\\vec{i}\\times(\\vec{i}\\times\\vec{j}) = -\\vec{j} \\neq (\\vec{i}\\times\\vec{i})\\times\\vec{j} = \\vec{0}$)',
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Definition via $3\\times 3$ Determinant',
        bullets: [
          'The cross product $\\vec{u}\\times\\vec{v}$ is a vector orthogonal to both $\\vec{u}$ and $\\vec{v}$, following the right-hand rule',
        ],
        formulas: [
          {
            latex: '\\vec{u}\\times\\vec{v} = \\begin{vmatrix} \\vec{i} & \\vec{j} & \\vec{k} \\\\ u_1 & u_2 & u_3 \\\\ v_1 & v_2 & v_3 \\end{vmatrix} = \\begin{vmatrix} u_2 & u_3 \\\\ v_2 & v_3 \\end{vmatrix}\\vec{i} - \\begin{vmatrix} u_1 & u_3 \\\\ v_1 & v_3 \\end{vmatrix}\\vec{j} + \\begin{vmatrix} u_1 & u_2 \\\\ v_1 & v_2 \\end{vmatrix}\\vec{k}',
            tone: 'rose',
          },
        ],
      },
      {
        heading: 'Key Algebraic Properties (Theorem 6)',
        bullets: [
          '$\\vec{u}\\times\\vec{v} = -(\\vec{v}\\times\\vec{u})$ (anticommutative) • $\\vec{u}\\times\\vec{u} = \\vec{0},\\; \\vec{u}\\times\\vec{0} = \\vec{0}$',
          '$\\vec{i}\\times\\vec{j} = \\vec{k},\\; \\vec{j}\\times\\vec{k} = \\vec{i},\\; \\vec{k}\\times\\vec{i} = \\vec{j}$ (not associative: $\\vec{i}\\times(\\vec{i}\\times\\vec{j}) = -\\vec{j} \\neq (\\vec{i}\\times\\vec{i})\\times\\vec{j} = \\vec{0}$)',
        ],
      },
    ],
  },
  {
    id: 23,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 6 (Cross 1)',
    tagEn: 'Example 6 (Sheet p. 8)',
    badgeEn: 'Lecture 2 • Example 6',
    titleTh: 'ตัวอย่าง: การคำนวณผลคูณไขว้',
    titleEn: 'Example 6: Computing a Cross Product',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = \\langle 2, -1, 3 \\rangle$ และ $\\vec{v} = \\langle -4, 2, 1 \\rangle$ จงหา $\\vec{u}\\times\\vec{v}$',
        promptEn: 'Given $\\vec{u} = \\langle 2, -1, 3 \\rangle$ and $\\vec{v} = \\langle -4, 2, 1 \\rangle$, compute $\\vec{u}\\times\\vec{v}$.',
        scene3D: {
          vectors: [
            { vec: [2, -1, 3], color: '#0284c7', label: 'u' },
            { vec: [-4, 2, 1], color: '#059669', label: 'v' },
          ],
          hintTh: 'หมุนดูระนาบของ u และ v เพื่อใช้กฎมือขวา',
          hintEn: 'Orbit to inspect the plane spanned by u and v (right-hand rule)',
        },
      },
    ],
  },
  {
    id: 24,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบ Cross Product (2)',
    tagThPublic: 'คาบที่ 2 • ตัวอย่าง Cross Product (2)',
    tagEn: 'Unit Normal & Algebra',
    badgeEn: 'Lecture 2 • Cross Product Drill',
    badgeEnPublic: 'Lecture 2 • Cross Product Example',
    titleTh: 'ตัวอย่าง & แนวข้อสอบ: เวกเตอร์ตั้งฉากหนึ่งหน่วยและสมบัติผลคูณไขว้',
    titleThPublic: 'ตัวอย่าง: เวกเตอร์ตั้งฉากหนึ่งหน่วย',
    titleEn: 'Example & Drill: Unit Orthogonal Vectors',
    titleEnPublic: 'Example: Unit Orthogonal Vectors',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        labelEn: 'Part (1)',
        promptTh: 'จงหาเวกเตอร์หนึ่งหน่วยทั้งหมดที่ตั้งฉากกับทั้ง $\\vec{u} = \\langle 1, -2, 2 \\rangle$ และ $\\vec{v} = \\langle 2, -1, -2 \\rangle$',
        promptEn: 'Find all unit vectors orthogonal to both $\\vec{u} = \\langle 1, -2, 2 \\rangle$ and $\\vec{v} = \\langle 2, -1, -2 \\rangle$.',
        scene3D: {
          vectors: [
            { vec: [1, -2, 2], color: '#93c5fd', label: 'u', opacity: 0.68 },
            { vec: [2, -1, -2], color: '#6ee7b7', label: 'v', opacity: 0.68 },
            { vec: [0.667, 0.667, 0.333], color: '#1d4ed8', label: 'n̂' },
            { vec: [-0.667, -0.667, -0.333], color: '#be123c', label: '-n̂' },
          ],
          hintTh: 'u, v สีอ่อน (ตัวใหญ่) • ±n̂ สีเข้ม (หนึ่งหน่วยตั้งฉาก)',
          hintEn: 'u, v (light vectors) • ±n̂ (dark unit normal vectors)',
        },
      },
      {
        label: 'แนวข้อสอบ',
        labelEn: 'Exam Drill',
        isExamDrill: true,
        promptTh:
          'กำหนดให้ $\\vec{u}\\times\\vec{v} = \\langle 2, -3, 1 \\rangle$ จงหาค่าของ $(2\\vec{u} + 3\\vec{v})\\times(\\vec{u} - \\vec{v})$ โดยใช้สมบัติของผลคูณไขว้',
        promptEn:
          'Given $\\vec{u}\\times\\vec{v} = \\langle 2, -3, 1 \\rangle$, find $(2\\vec{u} + 3\\vec{v})\\times(\\vec{u} - \\vec{v})$ using algebraic properties of the cross product.',
      },
    ],
  },
  {
    id: 25,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • ทฤษฎีบท 7 & พื้นที่',
    tagEn: 'Area & Parallel Condition',
    badgeEn: 'Lecture 2 • Theorem 7 & Area',
    titleTh: 'สมบัติตั้งฉาก พื้นที่รูปเรขาคณิต และเงื่อนไขขนาน',
    titleEn: 'Orthogonality, Area & Parallelism Condition',
    cards: [
      {
        heading: 'ทฤษฎีบท 7 & ขนาดของผลคูณไขว้',
        formulas: [
          {
            label: 'ตั้งฉากทั้ง u และ v',
            latex: '\\vec{u}\\cdot(\\vec{u}\\times\\vec{v}) = 0 \\quad \\text{และ} \\quad \\vec{v}\\cdot(\\vec{u}\\times\\vec{v}) = 0',
          },
          {
            label: 'ขนาดกับมุม θ',
            latex: '\\|\\vec{u}\\times\\vec{v}\\| = \\|\\vec{u}\\|\\|\\vec{v}\\|\\sin\\theta',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'พื้นที่รูปสี่เหลี่ยมด้านขนาน สามเหลี่ยม และเงื่อนไขขนาน',
        formulas: [
          {
            label: 'พื้นที่สี่เหลี่ยมด้านขนาน / สามเหลี่ยม ABC',
            latex: 'A_{\\square} = \\|\\vec{u}\\times\\vec{v}\\|, \\qquad A_{\\triangle ABC} = \\frac{1}{2}\\left\\|\\overrightarrow{AB}\\times\\overrightarrow{AC}\\right\\|',
            tone: 'emerald',
          },
          {
            label: 'เงื่อนไขขนาน (u ≠ 0, v ≠ 0)',
            latex: '\\vec{u}\\times\\vec{v} = \\vec{0} \\iff \\vec{u} \\text{ ขนานกับ } \\vec{v}',
            tone: 'amber',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Theorem 7 & Magnitude of Cross Product',
        formulas: [
          {
            label: 'Orthogonal to both u and v',
            latex: '\\vec{u}\\cdot(\\vec{u}\\times\\vec{v}) = 0 \\quad \\text{and} \\quad \\vec{v}\\cdot(\\vec{u}\\times\\vec{v}) = 0',
          },
          {
            label: 'Magnitude and angle θ',
            latex: '\\|\\vec{u}\\times\\vec{v}\\| = \\|\\vec{u}\\|\\|\\vec{v}\\|\\sin\\theta',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'Parallelogram/Triangle Area & Parallelism',
        formulas: [
          {
            label: 'Area of Parallelogram / Triangle ABC',
            latex: 'A_{\\square} = \\|\\vec{u}\\times\\vec{v}\\|, \\qquad A_{\\triangle ABC} = \\frac{1}{2}\\left\\|\\overrightarrow{AB}\\times\\overrightarrow{AC}\\right\\|',
            tone: 'emerald',
          },
          {
            label: 'Parallel Condition (u ≠ 0, v ≠ 0)',
            latex: '\\vec{u}\\times\\vec{v} = \\vec{0} \\iff \\vec{u} \\text{ is parallel to } \\vec{v}',
            tone: 'amber',
          },
        ],
      },
    ],
  },
  {
    id: 26,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 7 (Cross 3)',
    tagEn: 'Example 7 (Sheet p. 9)',
    badgeEn: 'Lecture 2 • Example 7',
    titleTh: 'ตัวอย่าง: การหาพื้นที่สามเหลี่ยมในปริภูมิ 3 มิติ',
    titleEn: 'Example 7: Area of Triangle ABC in 3D Space',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้จุด $A(2, 2, 0),\\; B(0, 1, 2)$ และ $C(4, 0, 3)$ จงหาพื้นที่ของสามเหลี่ยม $ABC$',
        promptEn: 'Given vertices $A(2, 2, 0),\\; B(0, 1, 2)$, and $C(4, 0, 3)$, find the area of triangle $ABC$.',
        scene3D: {
          points: [
            { pos: [2, 2, 0], color: '#0f172a', label: 'A' },
            { pos: [0, 1, 2], color: '#0284c7', label: 'B' },
            { pos: [4, 0, 3], color: '#059669', label: 'C' },
          ],
          vectors: [
            { origin: [2, 2, 0], vec: [-2, -1, 2], color: '#0284c7', label: 'AB' },
            { origin: [2, 2, 0], vec: [2, -2, 3], color: '#059669', label: 'AC' },
          ],
          triangle: [
            [2, 2, 0],
            [0, 1, 2],
            [4, 0, 3],
          ],
          hintTh: 'หมุนดูรูปสามเหลี่ยม ABC และเวกเตอร์ด้านประชิด AB, AC',
          hintEn: 'Orbit to inspect triangle ABC and adjacent vectors AB, AC',
        },
      },
    ],
  },
  {
    id: 27,
    lecture: 2,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 2 • แนวข้อสอบ Cross Product (4)',
    tagEn: 'Exam Drill: Triangle Height & Parallelism',
    badgeEn: 'Lecture 2 • Exam Drill',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: พื้นที่ ความสูงสามเหลี่ยม และเงื่อนไขขนาน',
    titleEn: 'Exam Drill: Triangle Altitude & Parallel Vectors',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh:
          'ให้สามเหลี่ยมมีจุดยอด $P(1, 0, 2),\\; Q(3, 1, 0)$ และ $R(4, 3, 2)$ จงหา (1) พื้นที่สามเหลี่ยม $PQR$ และ (2) ความสูงของสามเหลี่ยมเมื่อใช้ด้าน $PQ$ เป็นฐาน',
        promptEn:
          'A triangle has vertices $P(1, 0, 2),\\; Q(3, 1, 0)$, and $R(4, 3, 2)$. Find (1) the area of $\\triangle PQR$, and (2) the altitude of the triangle using side $PQ$ as the base.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh: 'จงหาค่า $a$ และ $b$ ที่ทำให้เวกเตอร์ $\\vec{u} = \\langle 2, a, -3 \\rangle$ และ $\\vec{v} = \\langle -4, 6, b \\rangle$ ขนานกัน',
        promptEn: 'Find the values of $a$ and $b$ such that $\\vec{u} = \\langle 2, a, -3 \\rangle$ and $\\vec{v} = \\langle -4, 6, b \\rangle$ are parallel.',
      },
    ],
  },
  {
    id: 28,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.10',
    tagEn: 'Scalar Triple Product',
    badgeEn: 'Lecture 2 • Section 1.10',
    titleTh: 'ผลคูณเชิงสเกลาร์ของ 3 เวกเตอร์ & ปริมาตรกล่อง',
    titleEn: 'Scalar Triple Product & Volume of Parallelepiped',
    embed3D: 'triple',
    embedHintTh: 'หมุนดูกล่องทรงสี่เหลี่ยมด้านขนานและทดสอบกรณีอยู่บนระนาบเดียวกัน (V = 0)',
    embedHintEn: 'Orbit the parallelepiped and test the coplanar case (V = 0)',
    cards: [
      {
        heading: 'บทนิยาม & ทฤษฎีบท 8',
        formulas: [
          {
            latex: '\\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) = \\begin{vmatrix} u_1 & u_2 & u_3 \\\\ v_1 & v_2 & v_3 \\\\ w_1 & w_2 & w_3 \\end{vmatrix}',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'ความหมายเชิงเรขาคณิต: ปริมาตรทรงสี่เหลี่ยมด้านขนาน',
        bullets: [
          'ปริมาตรทรงสี่เหลี่ยมด้านขนาน (Parallelepiped): $V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})|$',
          'ทั้ง 3 เวกเตอร์อยู่บนระนาบเดียวกัน (Coplanar) $\\iff \\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) = 0$',
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Definition & Theorem 8',
        formulas: [
          {
            latex: '\\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) = \\begin{vmatrix} u_1 & u_2 & u_3 \\\\ v_1 & v_2 & v_3 \\\\ w_1 & w_2 & w_3 \\end{vmatrix}',
            tone: 'sky',
          },
        ],
      },
      {
        heading: 'Geometric Meaning: Volume of a Parallelepiped',
        bullets: [
          'Volume of the parallelepiped determined by $\\vec{u}, \\vec{v}, \\vec{w}$: $V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})|$',
          'The three vectors are coplanar $\\iff \\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) = 0$',
        ],
      },
    ],
  },
  {
    id: 29,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 8',
    tagEn: 'Example 8 (Sheet p. 10)',
    badgeEn: 'Lecture 2 • Example 8',
    titleTh: 'ตัวอย่าง: ผลคูณเชิงสเกลาร์ของ 3 เวกเตอร์และปริมาตรกล่อง',
    titleEn: 'Example 8: Scalar Triple Product & Parallelepiped Volume',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = \\langle 2, -1, 3 \\rangle,\\; \\vec{v} = \\langle 3, -2, -5 \\rangle$ และ $\\vec{w} = \\langle -1, 4, -4 \\rangle$ จงหา',
        promptEn: 'Given $\\vec{u} = \\langle 2, -1, 3 \\rangle,\\; \\vec{v} = \\langle 3, -2, -5 \\rangle$, and $\\vec{w} = \\langle -1, 4, -4 \\rangle$, find:',
        promptLatex: '\\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) \\quad \\text{และปริมาตรทรงสี่เหลี่ยมด้านขนาน } V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})|',
        promptLatexEn: '\\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) \\quad \\text{and the parallelepiped volume } V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})|',
        scene3D: {
          vectors: [
            { vec: [2, -1, 3], color: '#0284c7', label: 'u' },
            { vec: [3, -2, -5], color: '#059669', label: 'v' },
            { vec: [-1, 4, -4], color: '#d97706', label: 'w' },
          ],
          showParallelepiped: true,
          hintTh: 'หมุนดูกล่องทรงสี่เหลี่ยมด้านขนานที่สร้างจาก u, v, w',
          hintEn: 'Orbit the parallelepiped spanned by u, v, and w',
        },
      },
    ],
  },
  {
    id: 30,
    lecture: 2,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 2 • แนวข้อสอบ 1.10',
    tagEn: 'Exam Drill: Coplanar Points & Volume',
    badgeEn: 'Lecture 2 • Exam Drill 1.10',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดร่วมระนาบ (Coplanar) และหาตัวแปรจากปริมาตร',
    titleEn: 'Exam Drill: Coplanarity Test & Parallelepiped Volume',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh: 'จงหาค่า $k$ ที่ทำให้จุด $A(1, 0, 1),\\; B(2, 1, 3),\\; C(0, 2, 2)$ และ $D(1, k, 4)$ อยู่บนระนาบเดียวกัน (Coplanar)',
        promptEn: 'Find the value of $k$ such that the points $A(1, 0, 1),\\; B(2, 1, 3),\\; C(0, 2, 2)$, and $D(1, k, 4)$ are coplanar.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh:
          'ทรงสี่เหลี่ยมด้านขนานมีขอบประชิดเป็น $\\vec{u} = \\langle 1, 2, 0 \\rangle,\\; \\vec{v} = \\langle 0, 1, 1 \\rangle$ และ $\\vec{w} = \\langle k, 1, 3 \\rangle$ ถ้าปริมาตรเท่ากับ $10$ ลบ.หน่วย จงหาค่า $k$ ทั้งหมด',
        promptEn:
          'A parallelepiped has adjacent edges $\\vec{u} = \\langle 1, 2, 0 \\rangle,\\; \\vec{v} = \\langle 0, 1, 1 \\rangle$, and $\\vec{w} = \\langle k, 1, 3 \\rangle$. If its volume is $10$ cubic units, find all possible values of $k$.',
      },
    ],
  },
  {
    id: 31,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.11',
    tagEn: 'Lines in 3D Space',
    badgeEn: 'Lecture 2 • Section 1.11',
    titleTh: 'สมการเส้นตรงในปริภูมิ 3 มิติ (3 รูปแบบ)',
    titleEn: 'Equations of a Line in 3D Space (Three Forms)',
    embed3D: 'line3d',
    embedHintTh: 'เลื่อนค่า t เพื่อให้จุด P(t) วิ่งไปตามเส้นตรง 3 มิติ (รวม t = 0 ด้วย)',
    embedHintEn: 'Slide parameter t to move P(t) along the 3D line (including t = 0)',
    cards: [
      {
        heading: 'ผ่านจุด $P_0(x_0, y_0, z_0)$ และขนานกับเวกเตอร์ทิศทาง $\\vec{v} = \\langle a, b, c \\rangle$',
        formulas: [
          {
            label: '1. สมการเวกเตอร์ (t ∈ ℝ)',
            latex: '\\overrightarrow{OP} = \\overrightarrow{OP_0} + t\\vec{v} \\implies \\langle x, y, z \\rangle = \\langle x_0, y_0, z_0 \\rangle + t\\langle a, b, c \\rangle',
            tone: 'sky',
          },
          {
            label: '2. สมการอิงตัวแปรเสริม (Parametric)',
            latex: 'x = x_0 + at,\\quad y = y_0 + bt,\\quad z = z_0 + ct \\quad (t \\in \\mathbb{R})',
            tone: 'emerald',
          },
          {
            label: '3. สมการสมมาตร (Symmetric)',
            latex: '\\frac{x - x_0}{a} = \\frac{y - y_0}{b} = \\frac{z - z_0}{c} \\quad (\\text{ถ้า } c=0 \\text{ แยกเขียน } ,\\; z=z_0)',
            tone: 'amber',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Passing through $P_0(x_0, y_0, z_0)$ and parallel to direction vector $\\vec{v} = \\langle a, b, c \\rangle$',
        formulas: [
          {
            label: '1. Vector Equation (t ∈ ℝ)',
            latex: '\\overrightarrow{OP} = \\overrightarrow{OP_0} + t\\vec{v} \\implies \\langle x, y, z \\rangle = \\langle x_0, y_0, z_0 \\rangle + t\\langle a, b, c \\rangle',
            tone: 'sky',
          },
          {
            label: '2. Parametric Equations',
            latex: 'x = x_0 + at,\\quad y = y_0 + bt,\\quad z = z_0 + ct \\quad (t \\in \\mathbb{R})',
            tone: 'emerald',
          },
          {
            label: '3. Symmetric Equations',
            latex: '\\frac{x - x_0}{a} = \\frac{y - y_0}{b} = \\frac{z - z_0}{c} \\quad (\\text{if } c=0,\\; z=z_0)',
            tone: 'amber',
          },
        ],
      },
    ],
  },
  {
    id: 32,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 9',
    tagEn: 'Example 9 (Sheet p. 12)',
    badgeEn: 'Lecture 2 • Example 9',
    titleTh: 'ตัวอย่าง: การอ่านเวกเตอร์แสดงทิศทางจากสมการเส้นตรง',
    titleEn: 'Example 9: Direction Vectors from Symmetric Equations',
    writeHeightHint: 'tall',
    examples: [
      {
        label: 'ข้อ 1–4',
        labelEn: 'Items 1–4',
        promptTh: 'จงหาเวกเตอร์แสดงทิศทางของเส้นตรง $L_1, L_2, L_3$ และ $L_4$ (จัดสัมประสิทธิ์หน้า $x, y, z$ ให้เป็น $+1$ ก่อน)',
        promptEn: 'Find a direction vector for each line $L_1, L_2, L_3$, and $L_4$ (normalize the coefficients of $x, y, z$ to $+1$ first):',
        promptLatex:
          '\\begin{aligned} L_1:\\; &\\frac{x-1}{2}=\\frac{y+3}{5}=z-2, &\\qquad L_2:\\; &1-x=\\frac{y-2}{6}=\\frac{z}{2} \\\\[6pt] L_3:\\; &\\frac{x+1}{2}=\\frac{2y-4}{5}=\\frac{2-z}{3}, &\\qquad L_4:\\; &\\frac{x-1}{3}=\\frac{y+3}{5},\\; z=4 \\end{aligned}',
        scene3D: {
          lines: [
            { point: [1, -3, 2], dir: [2, 5, 1], color: '#0284c7', label: 'L₁' },
            { point: [1, 2, 0], dir: [-1, 6, 2], color: '#059669', label: 'L₂' },
            { point: [-1, 2, 2], dir: [2, 2.5, -3], color: '#d97706', label: 'L₃' },
            { point: [1, -3, 4], dir: [3, 5, 0], color: '#e11d48', label: 'L₄' },
          ],
          hintTh: 'หมุนดูเส้นตรง L₁–L₄ ในปริภูมิ 3 มิติ (L₄ ขนานระนาบ xy)',
          hintEn: 'Orbit to inspect lines L₁–L₄ in 3D space (L₄ is parallel to the xy-plane)',
        },
      },
    ],
  },
  {
    id: 33,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 10',
    tagEn: 'Example 10 (Sheet p. 12–13)',
    badgeEn: 'Lecture 2 • Example 10',
    titleTh: 'ตัวอย่าง: การสร้างสมการเส้นตรงในปริภูมิ 3 มิติ',
    titleEn: 'Example 10: Equations of Lines in 3D Space',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อ 5',
        labelEn: 'Part 5',
        promptTh: 'จงหาสมการเส้นตรงที่ผ่านจุด $(2, 1, -4)$ และขนานกับเวกเตอร์ $\\vec{v} = \\langle -3, -7, 5 \\rangle$',
        promptEn: 'Find equations of the line passing through $(2, 1, -4)$ and parallel to $\\vec{v} = \\langle -3, -7, 5 \\rangle$.',
        scene3D: {
          points: [{ pos: [2, 1, -4], color: '#0f172a', label: 'P₀(2,1,-4)' }],
          vectors: [{ vec: [-3, -7, 5], color: '#059669', label: 'v', opacity: 0.78 }],
          lines: [{ point: [2, 1, -4], dir: [-3, -7, 5], color: '#0284c7', label: 'L' }],
          hintTh: 'เส้นตรง L (น้ำเงิน) ผ่าน P₀ และขนานกับ v (เขียว)',
          hintEn: 'Line L (blue) passes through P₀ and is parallel to v (green)',
        },
      },
      {
        label: 'ข้อ 6',
        labelEn: 'Part 6',
        promptTh: 'จงหาสมการเส้นตรงที่ผ่านจุด $P(-2, 1, 6)$ และจุด $Q(1, -1, -8)$',
        promptEn: 'Find equations of the line passing through $P(-2, 1, 6)$ and $Q(1, -1, -8)$.',
        scene3D: {
          points: [
            { pos: [-2, 1, 6], color: '#0284c7', label: 'P' },
            { pos: [1, -1, -8], color: '#e11d48', label: 'Q' },
          ],
          lines: [{ point: [-2, 1, 6], dir: [3, -2, -14], color: '#059669', label: 'L(PQ)' }],
          hintTh: 'หมุนดูเส้นตรงที่ลากผ่านจุด P และ Q ใน 3 มิติ',
          hintEn: 'Orbit to inspect the line passing through P and Q in 3D',
        },
      },
    ],
  },
  {
    id: 34,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 11',
    tagEn: 'Example 11 (Sheet p. 13)',
    badgeEn: 'Lecture 2 • Example 11',
    titleTh: 'ตัวอย่าง: เส้นตรงขนานกันและมุมระหว่างเส้นตรง 2 เส้น',
    titleEn: 'Example 11: Parallel Lines & Angle Between Lines',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อ 7',
        labelEn: 'Part 7',
        promptTh: 'จงหาสมการอิงตัวแปรเสริมของเส้นตรงที่ผ่านจุด $(2, 1, -4)$ และขนานกับเส้นตรง $L_1$',
        promptEn: 'Find parametric equations of the line passing through $(2, 1, -4)$ and parallel to $L_1$:',
        promptLatex: 'L_1:\\; \\frac{x-1}{4} = \\frac{y+3}{7} = z - 2',
        scene3D: {
          points: [{ pos: [2, 1, -4], color: '#0f172a', label: 'P₀' }],
          lines: [
            { point: [1, -3, 2], dir: [4, 7, 1], color: '#059669', label: 'L₁' },
            { point: [2, 1, -4], dir: [4, 7, 1], color: '#0284c7', label: 'L (ขนาน L₁)', labelEn: 'L (∥ L₁)' },
          ],
          hintTh: 'เส้นตรง L (น้ำเงิน) ผ่าน P₀ และขนานกับ L₁ (เขียว)',
          hintEn: 'Line L (blue) passes through P₀ and is parallel to L₁ (green)',
        },
      },
      {
        label: 'ข้อ 8',
        labelEn: 'Part 8',
        promptTh: 'จงหามุมระหว่างเส้นตรง $L_1$ และ $L_2$ ต่อไปนี้',
        promptEn: 'Find the angle between the following two lines $L_1$ and $L_2$:',
        promptLatex: 'L_1:\\; x-2 = \\frac{y+3}{\\sqrt{2}} = z-1 \\qquad \\text{และ} \\qquad L_2:\\; \\frac{x+4}{\\sqrt{2}} = \\frac{z-1}{\\sqrt{2}},\\; y=3',
        promptLatexEn: 'L_1:\\; x-2 = \\frac{y+3}{\\sqrt{2}} = z-1 \\qquad \\text{and} \\qquad L_2:\\; \\frac{x+4}{\\sqrt{2}} = \\frac{z-1}{\\sqrt{2}},\\; y=3',
        scene3D: {
          lines: [
            { point: [2, -3, 1], dir: [1, 1.4142, 1], color: '#0284c7', label: 'L₁' },
            { point: [-4, 3, 1], dir: [1.4142, 0, 1.4142], color: '#059669', label: 'L₂' },
          ],
          hintTh: 'หมุนดูทิศทางของ L₁ และ L₂ เพื่อหามุมระหว่างเส้นตรง',
          hintEn: 'Orbit to view the directions of L₁ and L₂ and find the angle between them',
        },
      },
    ],
  },
  {
    id: 35,
    lecture: 2,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 2 • แนวข้อสอบเส้นตรง (1)',
    tagEn: 'Exam Drill: Intersecting vs Skew Lines',
    badgeEn: 'Lecture 2 • Lines Drill 1',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดตัดของเส้นตรงและเส้นตรงไขว้ต่างระนาบ',
    titleEn: 'Exam Drill: Intersecting vs. Skew Lines in 3D Space',
    writeHeightHint: 'tall',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh: 'จงตรวจสอบว่าเส้นตรง $L_1$ และ $L_2$ ตัดกันหรือไขว้ต่างระนาบ หากตัดกันจงหาพิกัดจุดตัด',
        promptEn: 'Determine whether $L_1$ and $L_2$ intersect or are skew. If they intersect, find the point of intersection.',
        promptLatex: 'L_1:\\; x = 1+t,\\; y = -2+3t,\\; z = 4-t \\qquad L_2:\\; x = 1+2s,\\; y = 5-s,\\; z = -1+3s',
      },
    ],
  },
  {
    id: 36,
    lecture: 2,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 2 • แนวข้อสอบเส้นตรง (2)',
    tagEn: 'Exam Drill: Line Orthogonal to Two Lines',
    badgeEn: 'Lecture 2 • Lines Drill 2',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: เส้นตรงที่ตั้งฉากกับเส้นตรง 2 เส้น',
    titleEn: 'Exam Drill: Line Orthogonal to Two Given Lines',
    writeHeightHint: 'tall',
    examples: [
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh: 'จงหาสมการอิงตัวแปรเสริมของเส้นตรง $L$ ที่ผ่าน $P(1, -2, 3)$ และตั้งฉากกับทั้ง $L_1$ และ $L_2$',
        promptEn: 'Find parametric equations of the line $L$ passing through $P(1, -2, 3)$ and orthogonal to both $L_1$ and $L_2$.',
        promptLatex: 'L_1:\\; \\frac{x-1}{2}=\\frac{y+1}{-1}=\\frac{z}{1}, \\qquad L_2:\\; x=3+t,\\; y=2+2t,\\; z=-1-t',
      },
    ],
  },
  {
    id: 37,
    lecture: 2,
    kind: 'example',
    isExamDrill: true,
    tagTh: 'คาบที่ 2 • แนวข้อสอบเส้นตรง (3)',
    tagEn: 'Exam Drill: Coordinate Intercepts & Distance',
    badgeEn: 'Lecture 2 • Lines Drill 3',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดตัดระนาบพิกัดและระยะห่างจุดถึงเส้นตรง',
    titleEn: 'Exam Drill: Coordinate Intercepts & Point-to-Line Distance',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        labelEn: 'Drill A',
        promptTh:
          'จงหาจุดตัดของเส้นตรง $L: \\frac{x-3}{3} = \\frac{y+1}{-2} = \\frac{z-4}{2}$ กับระนาบ $xy$ และระนาบ $yz$',
        promptEn:
          'Find the intersection points of the line $L: \\frac{x-3}{3} = \\frac{y+1}{-2} = \\frac{z-4}{2}$ with the $xy$-plane and the $yz$-plane.',
      },
      {
        label: 'แนวข้อสอบ B',
        labelEn: 'Drill B',
        promptTh:
          'จงหาระยะห่างที่สั้นที่สุดจากจุด $P(4, 2, 1)$ ไปยังเส้นตรง $L: x = 1+2t,\\; y = -1+t,\\; z = 1-2t$ (แนะ: $d = \\frac{\\|\\overrightarrow{P_0 P}\\times\\vec{v}\\|}{\\|\\vec{v}\\|}$)',
        promptEn:
          'Find the shortest distance from point $P(4, 2, 1)$ to line $L: x = 1+2t,\\; y = -1+t,\\; z = 1-2t$ (Hint: $d = \\frac{\\|\\overrightarrow{P_0 P}\\times\\vec{v}\\|}{\\|\\vec{v}\\|}$).',
      },
    ],
  },
  {
    id: 38,
    lecture: 2,
    kind: 'summary',
    tagTh: 'สรุปท้ายบทที่ 1',
    tagEn: 'Chapter 1 Cheat Sheet',
    badgeEn: 'Chapter 1 Summary',
    titleTh: 'สรุปสูตรสำคัญ บทที่ 1 (1-Page Cheat Sheet)',
    titleEn: 'Chapter 1 Formula Summary (1-Page Cheat Sheet)',
    cards: [
      {
        heading: 'พิกัด เวกเตอร์ และผลคูณจุด',
        formulas: [
          {
            label: 'เวกเตอร์ระหว่างจุด & ขนาด',
            latex:
              '\\begin{gathered} \\overrightarrow{AB} = B - A,\\quad \\|\\vec{u}\\| = \\sqrt{u_1^2+u_2^2+u_3^2} \\\\ \\hat{u} = \\frac{\\vec{u}}{\\|\\vec{u}\\|} \\end{gathered}',
          },
          {
            label: 'ผลคูณจุด & ตั้งฉาก',
            latex:
              '\\begin{gathered} \\vec{u}\\cdot\\vec{v} = u_1v_1+u_2v_2+u_3v_3 = \\|\\vec{u}\\|\\|\\vec{v}\\|\\cos\\theta \\\\ \\vec{u}\\perp\\vec{v} \\iff \\vec{u}\\cdot\\vec{v} = 0 \\end{gathered}',
            tone: 'sky',
          },
          {
            label: 'การฉาย & มุมทิศทาง',
            latex:
              '\\begin{gathered} \\operatorname{Proj}_{\\vec{v}}\\vec{u} = \\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|^2}\\right)\\vec{v} \\\\ \\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1 \\end{gathered}',
            tone: 'amber',
          },
        ],
      },
      {
        heading: 'ผลคูณไขว้ ปริมาตร และเส้นตรง 3 มิติ',
        formulas: [
          {
            label: 'ผลคูณไขว้ & พื้นที่',
            latex:
              '\\begin{gathered} A_{\\square} = \\|\\vec{u}\\times\\vec{v}\\|,\\quad A_{\\triangle} = \\tfrac{1}{2}\\left\\|\\overrightarrow{AB}\\times\\overrightarrow{AC}\\right\\| \\\\ \\vec{u}\\parallel\\vec{v} \\iff \\vec{u}\\times\\vec{v} = \\vec{0} \\end{gathered}',
            tone: 'rose',
          },
          {
            label: '3 เวกเตอร์ (ปริมาตร)',
            latex:
              '\\begin{gathered} V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})| \\\\ \\text{Coplanar} \\iff V = 0 \\end{gathered}',
            tone: 'emerald',
          },
          {
            label: 'เส้นตรง 3 มิติ',
            latex:
              '\\begin{gathered} \\mathbf{r}(t) = \\mathbf{r}_0 + t\\vec{v} \\\\ \\frac{x-x_0}{a} = \\frac{y-y_0}{b} = \\frac{z-z_0}{c} \\end{gathered}',
            tone: 'sky',
          },
        ],
      },
    ],
    cardsEn: [
      {
        heading: 'Coordinates, Vectors & Dot Product',
        formulas: [
          {
            label: 'Vector Between Points & Magnitude',
            latex:
              '\\begin{gathered} \\overrightarrow{AB} = B - A,\\quad \\|\\vec{u}\\| = \\sqrt{u_1^2+u_2^2+u_3^2} \\\\ \\hat{u} = \\frac{\\vec{u}}{\\|\\vec{u}\\|} \\end{gathered}',
          },
          {
            label: 'Dot Product & Orthogonality',
            latex:
              '\\begin{gathered} \\vec{u}\\cdot\\vec{v} = u_1v_1+u_2v_2+u_3v_3 = \\|\\vec{u}\\|\\|\\vec{v}\\|\\cos\\theta \\\\ \\vec{u}\\perp\\vec{v} \\iff \\vec{u}\\cdot\\vec{v} = 0 \\end{gathered}',
            tone: 'sky',
          },
          {
            label: 'Projection & Direction Angles',
            latex:
              '\\begin{gathered} \\operatorname{Proj}_{\\vec{v}}\\vec{u} = \\left(\\frac{\\vec{u}\\cdot\\vec{v}}{\\|\\vec{v}\\|^2}\\right)\\vec{v} \\\\ \\cos^2\\alpha + \\cos^2\\beta + \\cos^2\\gamma = 1 \\end{gathered}',
            tone: 'amber',
          },
        ],
      },
      {
        heading: 'Cross Product, Volume & 3D Lines',
        formulas: [
          {
            label: 'Cross Product & Area',
            latex:
              '\\begin{gathered} A_{\\square} = \\|\\vec{u}\\times\\vec{v}\\|,\\quad A_{\\triangle} = \\tfrac{1}{2}\\left\\|\\overrightarrow{AB}\\times\\overrightarrow{AC}\\right\\| \\\\ \\vec{u}\\parallel\\vec{v} \\iff \\vec{u}\\times\\vec{v} = \\vec{0} \\end{gathered}',
            tone: 'rose',
          },
          {
            label: 'Scalar Triple Product (Volume)',
            latex:
              '\\begin{gathered} V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})| \\\\ \\text{Coplanar} \\iff V = 0 \\end{gathered}',
            tone: 'emerald',
          },
          {
            label: '3D Line Equations',
            latex:
              '\\begin{gathered} \\mathbf{r}(t) = \\mathbf{r}_0 + t\\vec{v} \\\\ \\frac{x-x_0}{a} = \\frac{y-y_0}{b} = \\frac{z-z_0}{c} \\end{gathered}',
            tone: 'sky',
          },
        ],
      },
    ],
  },
];

const RAW_VISIBLE_SLIDES: SlideDef[] = SHOW_EXAM_DRILLS
  ? CH1_SLIDES
  : CH1_SLIDES.filter((s) => !s.isExamDrill).map((s) => {
      const filteredExamples = s.examples?.filter((ex) => !ex.isExamDrill);
      return {
        ...s,
        tagTh: s.tagThPublic ?? s.tagTh,
        titleTh: s.titleThPublic ?? s.titleTh,
        badgeEn: s.badgeEnPublic ?? s.badgeEn,
        titleEn: s.titleEnPublic ?? s.titleEn,
        ...(filteredExamples ? { examples: filteredExamples } : {}),
      };
    });

const VISIBLE_TOTAL = RAW_VISIBLE_SLIDES.length;
const VISIBLE_LEC1_COUNT = RAW_VISIBLE_SLIDES.filter((s) => s.lecture === 1).length;

export const CH1_VISIBLE_SLIDES: SlideDef[] = RAW_VISIBLE_SLIDES.map((s) => {
  if (s.id !== 1 || SHOW_EXAM_DRILLS) return s;
  return {
    ...s,
    cards: [
      {
        heading: `แผนการเรียนบทที่ 1 (2 คาบเรียน • ${VISIBLE_TOTAL} หน้า)`,
        bullets: [
          `คาบที่ 1 (หน้า 1–${VISIBLE_LEC1_COUNT}): ระบบพิกัด 3 มิติ, เวกเตอร์, การดำเนินการ, ขนาด, เวกเตอร์หนึ่งหน่วย, ผลคูณจุด (Dot Product) และมุมทิศทาง`,
          `คาบที่ 2 (หน้า ${VISIBLE_LEC1_COUNT + 1}–${VISIBLE_TOTAL}): การฉายเชิงตั้งฉาก (Projection), ผลคูณไขว้ (Cross Product), พื้นที่, ผลคูณ 3 เวกเตอร์ และสมการเส้นตรง 3 มิติ`,
        ],
      },
      {
        heading: 'วิธีใช้งานสไลด์นี้ในการเรียนการสอน',
        bullets: [
          'หน้าเนื้อหาและตัวอย่างที่มีกล่อง 3 มิติ: ใช้นิ้วหรือเมาส์หมุนดูทิศทางได้ทันทีกลางหน้าสไลด์',
          'หน้าโจทย์ตัวอย่าง: เว้นกระดานจุดสำหรับเขียนสดด้วย Apple Pencil (รองรับกันฝ่ามือ + เลเซอร์ 2 แบบ) และ Export PDF รวมลายมือแจกนิสิตได้ทันที',
        ],
        note: 'สื่อการสอนแบบ Interactive 3D • สัญญาอนุญาต CC BY-NC 4.0 (เพื่อการศึกษา ห้ามใช้เชิงพาณิชย์)',
      },
    ],
    cardsEn: [
      {
        heading: `Chapter 1 Lesson Plan (2 Lectures • ${VISIBLE_TOTAL} Slides)`,
        bullets: [
          `Lecture 1 (Slides 1–${VISIBLE_LEC1_COUNT}): 3D coordinate system, vectors, operations, magnitude, unit vectors, dot product, and direction angles`,
          `Lecture 2 (Slides ${VISIBLE_LEC1_COUNT + 1}–${VISIBLE_TOTAL}): Orthogonal projection, cross product, area, scalar triple product, and equations of lines in 3D space`,
        ],
      },
      {
        heading: 'How to Use These Interactive Slides',
        bullets: [
          'Concept & example slides with 3D viewports: drag with your finger or mouse to orbit directly on the slide',
          'Example slides: dot-grid workspace for live Apple Pencil annotation (with palm rejection + 2 laser modes) and instant PDF export with notes',
        ],
        note: 'Interactive 3D Lecture Slides • Licensed under CC BY-NC 4.0 (Attribution-NonCommercial)',
      },
    ],
  };
});

export function getLocalizedSlide(slide: SlideDef, lang: 'th' | 'en') {
  const isEn = lang === 'en';
  return {
    primaryTag: isEn ? (slide.badgeEn ?? `Lecture ${slide.lecture}`) : slide.tagTh,
    secondaryTag: slide.tagEn,
    title: isEn ? slide.titleEn : slide.titleTh,
    subtitle: isEn ? (slide.subtitleEn ?? '') : (slide.subtitle ?? slide.titleEn),
    cards: isEn ? (slide.cardsEn ?? slide.cards) : slide.cards,
    embedHint: isEn ? slide.embedHintEn : slide.embedHintTh,
    examples: slide.examples?.map((ex) => ({
      ...ex,
      displayLabel: isEn ? (ex.labelEn ?? ex.label) : ex.label,
      displayPrompt: isEn ? (ex.promptEn ?? ex.promptTh) : ex.promptTh,
      displayLatex: isEn ? (ex.promptLatexEn ?? ex.promptLatex) : ex.promptLatex,
      displaySceneHint: isEn ? (ex.scene3D?.hintEn ?? ex.scene3D?.hintTh) : ex.scene3D?.hintTh,
    })),
  };
}

export function getConceptDashboardTarget(embed?: SlideEmbed3DKind): Ch1DashboardTarget | null {
  switch (embed) {
    case 'plot_point':
      return {
        tab: 'coords_vec',
        patch: { subMode: 'single_point', plotStep: 3, p1: [2, 3, 2], showCoordBox: true },
      };
    case 'arithmetic':
      return {
        tab: 'arithmetic',
        patch: {
          operation: 'add',
          u: [2, 0.5, 1],
          v: [0.5, 2.5, 1.5],
          slideProgress: 1,
          showParallelogram: true,
        },
      };
    case 'dir_angles':
      return {
        tab: 'dot_proj',
        patch: { subMode: 'dir_angles', u: [2, 2, 1.5], showAngleArc: true },
      };
    case 'projection':
      return {
        tab: 'dot_proj',
        patch: { subMode: 'dot_proj', u: [2, 3, 2], v: [3, 1, 0], showProjection: true, showAngleArc: true },
      };
    case 'cross':
      return {
        tab: 'cross_triple',
        patch: { subMode: 'cross', u: [2, 1, 0], v: [0, 2, 1.5], reverseOrder: false, showAreaOrVolume: true },
      };
    case 'triple':
      return {
        tab: 'cross_triple',
        patch: {
          subMode: 'triple',
          u: [2, 1, 0],
          v: [0, 2, 1.5],
          w: [0.5, 0.5, 2.5],
          showAreaOrVolume: true,
        },
      };
    case 'line3d':
      return {
        tab: 'lines3d',
        patch: { inputMode: 'point_dir', p0: [1, -1, 2], dir: [1, 2, -1], t: 1 },
      };
    default:
      return null;
  }
}

export function getExampleDashboardTarget(
  slideId: number,
  exampleIdx: number,
): Ch1DashboardTarget | null {
  switch (slideId) {
    case 6:
      return {
        tab: 'coords_vec',
        patch: { subMode: 'vector', p1: [1, 2, 3], p2: [4, -2, 1], showPositionVec: true, showUnitVec: false },
      };
    case 10:
      return exampleIdx === 1
        ? {
            tab: 'arithmetic',
            patch: { operation: 'scalar', u: [-2, 3, 1], scalarK: -3 },
          }
        : {
            tab: 'coords_vec',
            patch: { subMode: 'vector', p1: [0, 0, 0], p2: [2, -2, 1], showPositionVec: true, showUnitVec: false },
          };
    case 12:
      return {
        tab: 'coords_vec',
        patch: { subMode: 'vector', p1: [0, 0, 0], p2: [1, -4, 2], showPositionVec: true, showUnitVec: true },
      };
    case 15:
      return exampleIdx === 1
        ? {
            tab: 'dot_proj',
            patch: { subMode: 'dot_proj', u: [2, 2, -1], v: [5, -4, 2], showProjection: false, showAngleArc: true },
          }
        : {
            tab: 'dot_proj',
            patch: { subMode: 'dot_proj', u: [-1, 2, 1], v: [-2, 1, -1], showProjection: false, showAngleArc: true },
          };
    case 18:
      return {
        tab: 'dot_proj',
        patch: { subMode: 'dir_angles', u: [1, 1.4142, 1], showAngleArc: true },
      };
    case 20:
      return {
        tab: 'dot_proj',
        patch: { subMode: 'dot_proj', u: [2, 3, -1], v: [-1, 1, -2], showProjection: true, showAngleArc: true },
      };
    case 23:
      return {
        tab: 'cross_triple',
        patch: { subMode: 'cross', u: [2, -1, 3], v: [-4, 2, 1], reverseOrder: false, showAreaOrVolume: true },
      };
    case 24:
      return {
        tab: 'cross_triple',
        patch: { subMode: 'cross', u: [1, -2, 2], v: [2, -1, -2], reverseOrder: false, showAreaOrVolume: false },
      };
    case 26:
      return {
        tab: 'cross_triple',
        patch: { subMode: 'cross', u: [-2, -1, 2], v: [2, -2, 3], reverseOrder: false, showAreaOrVolume: true, showTriangle: true },
      };
    case 29:
      return {
        tab: 'cross_triple',
        patch: {
          subMode: 'triple',
          u: [2, -1, 3],
          v: [3, -2, -5],
          w: [-1, 4, -4],
          showAreaOrVolume: true,
        },
      };
    case 32:
      return {
        tab: 'lines3d',
        patch: {
          inputMode: 'point_dir',
          p0: [1, -3, 2],
          dir: [2, 5, 1],
          t: 1,
          showSecondLine: true,
          p0Second: [1, 2, 0],
          dirSecond: [-1, 6, 2],
        },
      };
    case 33:
      return exampleIdx === 1
        ? {
            tab: 'lines3d',
            patch: { inputMode: 'two_points', p0: [-2, 1, 6], p2: [1, -1, -8], t: 0.5 },
          }
        : {
            tab: 'lines3d',
            patch: { inputMode: 'point_dir', p0: [2, 1, -4], dir: [-3, -7, 5], t: 1 },
          };
    case 34:
      return exampleIdx === 1
        ? {
            tab: 'lines3d',
            patch: {
              inputMode: 'point_dir',
              p0: [2, -3, 1],
              dir: [1, 1.4142, 1],
              t: 1,
              showSecondLine: true,
              p0Second: [-4, 3, 1],
              dirSecond: [1.4142, 0, 1.4142],
            },
          }
        : {
            tab: 'lines3d',
            patch: {
              inputMode: 'point_dir',
              p0: [2, 1, -4],
              dir: [4, 7, 1],
              t: 1,
              showSecondLine: true,
              p0Second: [1, -3, 2],
              dirSecond: [4, 7, 1],
            },
          };
    default:
      return null;
  }
}
