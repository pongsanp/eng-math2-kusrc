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

export interface SlideExampleItem {
  label?: string;
  promptTh: string;
  promptLatex?: string;
}

export interface SlideDef {
  id: number;
  lecture: 1 | 2;
  kind: 'cover' | 'concept' | 'example' | 'summary';
  tagTh: string;
  tagEn: string;
  titleTh: string;
  titleEn: string;
  subtitle?: string;
  cards?: SlideSectionCard[];
  embed3D?: SlideEmbed3DKind;
  embedHintTh?: string;
  examples?: SlideExampleItem[];
  writeHeightHint?: 'compact' | 'tall';
}

export const CH1_SLIDES: SlideDef[] = [
  // ==================== LECTURE 1 (Slides 1 - 18) ====================
  {
    id: 1,
    lecture: 1,
    kind: 'cover',
    tagTh: 'รายวิชา 01417168',
    tagEn: 'Engineering Mathematics II',
    titleTh: 'บทที่ 1: เวกเตอร์ในปริภูมิสามมิติ',
    titleEn: 'Vectors and Geometry of Space',
    subtitle: 'คณะวิทยาศาสตร์ ศรีราชา มหาวิทยาลัยเกษตรศาสตร์ • ประกอบสื่อ 3D Interactive',
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
      },
    ],
  },
  {
    id: 2,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.1',
    tagEn: '3D Coordinate System',
    titleTh: 'ระบบพิกัดฉาก 3 มิติและการพล็อตจุด',
    titleEn: '3D Rectangular Coordinates & Plotting Points',
    embed3D: 'plot_point',
    embedHintTh: 'ทดลองกด ขั้น 1 → ขั้น 2 → ขั้น 3 และหมุนดูอัฐภาคใน 3 มิติ',
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
  },
  {
    id: 3,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.2',
    tagEn: 'Scalars & Vectors',
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
  },
  {
    id: 4,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.3',
    tagEn: 'Vector Arithmetic (Geometry)',
    titleTh: 'การบวก ลบ และคูณสเกลาร์เชิงเรขาคณิต',
    titleEn: 'Head-to-Tail, Parallelogram & Scaling',
    embed3D: 'arithmetic',
    embedHintTh: 'เลื่อนสไลเดอร์เพื่อดูการย้ายหางของ v ไปต่อหัวของ u แบบต่อหัว-หาง',
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
  },
  {
    id: 5,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.4',
    tagEn: 'Component Form',
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
  },
  {
    id: 6,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 1',
    tagEn: 'Example 1 (Sheet p. 2)',
    titleTh: 'ตัวอย่าง: การหาส่วนประกอบของเวกเตอร์ระหว่างจุด',
    titleEn: 'Finding Component Form Between Points',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $A(1, 2, 3),\\; B(4, -2, 1)$ และ $C(-3, 7, 2)$ จงหาเวกเตอร์ต่อไปนี้',
        promptLatex: '\\overrightarrow{AB},\\quad \\overrightarrow{AC},\\quad \\text{และ}\\quad \\overrightarrow{BA}',
      },
    ],
  },
  {
    id: 7,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • แนวข้อสอบ 1.4',
    tagEn: 'Exam Drill: Position Vectors & Linear Eq.',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดยอดสี่เหลี่ยมด้านขนานและสมการเวกเตอร์',
    titleEn: 'Parallelogram Vertices & Linear Vector Equations',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh:
          'ให้จุด $A(1, -2, 3),\\; B(3, 1, 0)$ และ $C(2, 4, -1)$ เป็นจุดยอด $3$ จุดเรียงตามลำดับของรูปสี่เหลี่ยมด้านขนาน $ABCD$ จงหาพิกัดของจุดยอด $D$',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh:
          'ให้ $\\vec{u} = \\langle 2, -1, 3 \\rangle$ และ $\\vec{v} = \\langle 0, 2, -2 \\rangle$ จงหาเวกเตอร์ $\\vec{w}$ ที่สอดคล้องสมการ $2\\vec{u} - 3\\vec{w} = \\vec{v} + \\vec{w}$',
      },
    ],
  },
  {
    id: 8,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • ทฤษฎีบท 3',
    tagEn: 'Properties of Vector Operations',
    titleTh: 'สมบัติพีชคณิตของเวกเตอร์ (ทฤษฎีบท 3)',
    titleEn: 'Algebraic Properties of Vectors',
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
  },
  {
    id: 9,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.5',
    tagEn: 'Magnitude / Length',
    titleTh: 'ขนาดของเวกเตอร์ (Magnitude / Norm)',
    titleEn: 'Length of a Vector in 3D Space',
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
  },
  {
    id: 10,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 2',
    tagEn: 'Example 2 (Sheet p. 3)',
    titleTh: 'ตัวอย่าง: การหาขนาดของเวกเตอร์',
    titleEn: 'Computing Vector Magnitude',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        promptTh: 'ให้ $\\vec{v} = \\langle 2, -2, 1 \\rangle$ จงหา $\\|\\vec{v}\\|$',
      },
      {
        label: 'ข้อย่อย 2',
        promptTh: 'ให้ $\\vec{u} = \\langle 1, -4, 2 \\rangle$ และ $\\vec{v} = \\langle -2, 3, 1 \\rangle$ จงหา $\\|\\vec{u}\\|$ และ $\\|-3\\vec{v}\\|$',
      },
    ],
  },
  {
    id: 11,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.6',
    tagEn: 'Unit Vectors & Standard Basis',
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
  },
  {
    id: 12,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 3',
    tagEn: 'Example 3 (Sheet p. 4)',
    titleTh: 'ตัวอย่าง: การสร้างเวกเตอร์หนึ่งหน่วยและปรับขนาด',
    titleEn: 'Unit Vector & Scaling to Target Length',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = \\langle 1, -4, 2 \\rangle$ จงหา (1) เวกเตอร์หนึ่งหน่วยที่มีทิศทางเดียวกับ $\\vec{u}$ และ (2) เวกเตอร์ขนาด $7$ หน่วยที่มีทิศตรงข้ามกับ $\\vec{u}$',
      },
    ],
  },
  {
    id: 13,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • แนวข้อสอบ 1.5–1.6',
    tagEn: 'Exam Drill: Magnitude & Unit Vectors',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: หาตัวแปรจากขนาดและปรับขนาดเวกเตอร์',
    titleEn: 'Solving Scalar Parameters & Scaling Point-to-Point Vectors',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh: 'จงหาค่า $k$ ทั้งหมดที่ทำให้เวกเตอร์ $\\vec{v} = \\langle k, 2, 2k \\rangle$ มีขนาดเท่ากับ $7$ หน่วย',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh:
          'จงหาเวกเตอร์ $\\vec{w}$ ที่มีขนาด $10$ หน่วย และมีทิศทางตรงข้ามกับ $\\overrightarrow{PQ}$ เมื่อ $P(1, 2, -1)$ และ $Q(4, -2, -1)$',
      },
    ],
  },
  {
    id: 14,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • หัวข้อ 1.7',
    tagEn: 'Dot Product & Angle',
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
  },
  {
    id: 15,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • ตัวอย่างที่ 4',
    tagEn: 'Example 4 (Sheet p. 5–6)',
    titleTh: 'ตัวอย่าง: การหาผลคูณจุด มุม และการตรวจสอบตั้งฉาก',
    titleEn: 'Dot Product, Angle & Orthogonality Check',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        promptTh: 'ให้ $\\vec{u} = \\langle -1, 2, 1 \\rangle$ และ $\\vec{v} = \\langle -2, 1, -1 \\rangle$ จงหา $\\vec{u}\\cdot\\vec{v}$ และมุม $\\theta$ ระหว่าง $\\vec{u}$ และ $\\vec{v}$',
      },
      {
        label: 'ข้อย่อย 2',
        promptTh: 'จงแสดงว่าเวกเตอร์ $2\\vec{i} + 2\\vec{j} - \\vec{k}$ ตั้งฉากกับเวกเตอร์ $5\\vec{i} - 4\\vec{j} + 2\\vec{k}$',
      },
    ],
  },
  {
    id: 16,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • แนวข้อสอบ 1.7',
    tagEn: 'Exam Drill: Dot Product & Orthogonality',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: ผลคูณจุด เงื่อนไขตั้งฉาก และสมบัติพีชคณิต',
    titleEn: 'Orthogonality Parameters & Dot Product Expansion',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh:
          'ให้ $\\vec{u} = \\langle k, -1, 2 \\rangle$ และ $\\vec{v} = \\langle k, 3, -k \\rangle$ จงหาค่า $k$ ทั้งหมดที่ทำให้ $\\vec{u}$ ตั้งฉากกับ $\\vec{v}$',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh:
          'กำหนดให้ $\\|\\vec{u}\\| = 3,\\; \\|\\vec{v}\\| = 4$ และมุมระหว่าง $\\vec{u}$ กับ $\\vec{v}$ คือ $60^\\circ$ จงหาค่า $(2\\vec{u} - \\vec{v})\\cdot(\\vec{u} + 3\\vec{v})$ และ $\\|\\vec{u} + \\vec{v}\\|$',
      },
    ],
  },
  {
    id: 17,
    lecture: 1,
    kind: 'concept',
    tagTh: 'คาบที่ 1 • เสริมจากผลคูณจุด',
    tagEn: 'Direction Angles & Cosines',
    titleTh: 'มุมบอกทิศทาง (Direction Angles α, β, γ)',
    titleEn: 'Direction Angles & Direction Cosines',
    embed3D: 'dir_angles',
    embedHintTh: 'หมุนดูมุม α (แดง), β (เขียว), γ (น้ำเงิน) ที่เวกเตอร์ทำกับแกน +x, +y, +z',
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
  },
  {
    id: 18,
    lecture: 1,
    kind: 'example',
    tagTh: 'คาบที่ 1 • แนวข้อสอบมุมทิศทาง',
    tagEn: 'Exam Drill: Direction Angles & Cosines',
    titleTh: 'ตัวอย่าง & แนวข้อสอบ: โคไซน์และมุมบอกทิศทาง (α, β, γ)',
    titleEn: 'Computing Direction Angles & Missing Third Angle',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        promptTh:
          'จงหาโคไซน์แสดงทิศทาง ($\\cos\\alpha, \\cos\\beta, \\cos\\gamma$) และมุมบอกทิศทางของเวกเตอร์ $\\vec{u} = \\langle 1, \\sqrt{2}, 1 \\rangle$',
      },
      {
        label: 'แนวข้อสอบ',
        promptTh:
          'เวกเตอร์หนึ่งหน่วย $\\hat{u}$ ทำมุม $\\alpha = 60^\\circ$ กับแกน $+x$ และทำมุม $\\beta = 45^\\circ$ กับแกน $+y$ จงหาค่ามุม $\\gamma$ ที่เป็นไปได้ทั้งหมด และเขียน $\\hat{u}$ ในรูปส่วนประกอบ',
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
    titleTh: 'การฉายเชิงตั้งฉากของเวกเตอร์ (Projection)',
    titleEn: 'Vector Projection of u onto v',
    embed3D: 'projection',
    embedHintTh: 'สังเกตเงาฉายสีทองของ u ลงบนแนวของ v พร้อมมุมฉากสีแดง',
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
  },
  {
    id: 20,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 5',
    tagEn: 'Example 5 (Sheet p. 7)',
    titleTh: 'ตัวอย่าง: การหาเวกเตอร์ฉายเชิงตั้งฉาก',
    titleEn: 'Computing Vector Projections',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = 2\\vec{i} + 3\\vec{j} - \\vec{k}$ และ $\\vec{v} = -\\vec{i} + \\vec{j} - 2\\vec{k}$ จงหา',
        promptLatex: '\\operatorname{Proj}_{\\vec{v}} \\vec{u} \\quad \\text{และ} \\quad \\operatorname{Proj}_{\\vec{u}} \\vec{v}',
      },
    ],
  },
  {
    id: 21,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบ 1.8',
    tagEn: 'Exam Drill: Orthogonal Decomposition & Work',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: แยกเวกเตอร์ขนาน–ตั้งฉาก และงานของแรง',
    titleEn: 'Orthogonal Vector Decomposition & Mechanical Work',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh:
          'ให้ $\\vec{u} = \\langle 4, 5, 2 \\rangle$ และ $\\vec{v} = \\langle 1, 2, 2 \\rangle$ จงเขียน $\\vec{u} = \\vec{w}_1 + \\vec{w}_2$ โดยที่ $\\vec{w}_1$ ขนานกับ $\\vec{v}$ และ $\\vec{w}_2$ ตั้งฉากกับ $\\vec{v}$',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh:
          'แรงคงตัว $\\vec{F} = 4\\vec{i} - 2\\vec{j} + 5\\vec{k}$ นิวตัน เลื่อนวัตถุจาก $A(1, 0, -2)$ ไป $B(3, 2, -1)$ (เมตร) จงหาขนาดแรงฉายตามแนวเคลื่อนที่ และงาน $W = \\vec{F}\\cdot\\overrightarrow{AB}$',
      },
    ],
  },
  {
    id: 22,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.9',
    tagEn: 'Cross Product',
    titleTh: 'ผลคูณเชิงเวกเตอร์ / ผลคูณไขว้ (Cross Product)',
    titleEn: 'Cross Product, Determinant & Right-Hand Rule',
    embed3D: 'cross',
    embedHintTh: 'กดปุ่มสลับ u × v ↔ v × u เพื่อสังเกตทิศทางตรงข้ามตามกฎมือขวา',
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
  },
  {
    id: 23,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 6 (Cross 1)',
    tagEn: 'Example 6 (Sheet p. 8)',
    titleTh: 'ตัวอย่าง: การคำนวณผลคูณไขว้',
    titleEn: 'Computing a Cross Product',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = \\langle 2, -1, 3 \\rangle$ และ $\\vec{v} = \\langle -4, 2, 1 \\rangle$ จงหา $\\vec{u}\\times\\vec{v}$',
      },
    ],
  },
  {
    id: 24,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบ Cross Product (2)',
    tagEn: 'Cross Product Drill: Unit Normal & Algebra',
    titleTh: 'ตัวอย่าง & แนวข้อสอบ: เวกเตอร์ตั้งฉากหนึ่งหน่วยและสมบัติผลคูณไขว้',
    titleEn: 'Unit Orthogonal Vectors & Algebraic Cross Product',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อย่อย 1',
        promptTh: 'จงหาเวกเตอร์หนึ่งหน่วยทั้งหมดที่ตั้งฉากกับทั้ง $\\vec{u} = \\langle 1, -2, 2 \\rangle$ และ $\\vec{v} = \\langle 2, -1, -2 \\rangle$',
      },
      {
        label: 'แนวข้อสอบ',
        promptTh:
          'กำหนดให้ $\\vec{u}\\times\\vec{v} = \\langle 2, -3, 1 \\rangle$ จงหาค่าของ $(2\\vec{u} + 3\\vec{v})\\times(\\vec{u} - \\vec{v})$ โดยใช้สมบัติของผลคูณไขว้',
      },
    ],
  },
  {
    id: 25,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • ทฤษฎีบท 7 & พื้นที่',
    tagEn: 'Area & Parallel Condition',
    titleTh: 'สมบัติตั้งฉาก พื้นที่รูปเรขาคณิต และเงื่อนไขขนาน',
    titleEn: 'Orthogonality, Parallelogram/Triangle Area & Parallelism',
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
  },
  {
    id: 26,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 7 (Cross 3)',
    tagEn: 'Example 7 (Sheet p. 9)',
    titleTh: 'ตัวอย่าง: การหาพื้นที่สามเหลี่ยมในปริภูมิ 3 มิติ',
    titleEn: 'Area of Triangle ABC in 3D Space',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้จุด $A(2, 2, 0),\\; B(0, 1, 2)$ และ $C(4, 0, 3)$ จงหาพื้นที่ของสามเหลี่ยม $ABC$',
      },
    ],
  },
  {
    id: 27,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบ Cross Product (4)',
    tagEn: 'Exam Drill: Triangle Height & Parallelism',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: พื้นที่ ความสูงสามเหลี่ยม และเงื่อนไขขนาน',
    titleEn: 'Triangle Altitude via Area & Parallel Vector Parameters',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh:
          'ให้สามเหลี่ยมมีจุดยอด $P(1, 0, 2),\\; Q(3, 1, 0)$ และ $R(4, 3, 2)$ จงหา (1) พื้นที่สามเหลี่ยม $PQR$ และ (2) ความสูงของสามเหลี่ยมเมื่อใช้ด้าน $PQ$ เป็นฐาน',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh: 'จงหาค่า $a$ และ $b$ ที่ทำให้เวกเตอร์ $\\vec{u} = \\langle 2, a, -3 \\rangle$ และ $\\vec{v} = \\langle -4, 6, b \\rangle$ ขนานกัน',
      },
    ],
  },
  {
    id: 28,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.10',
    tagEn: 'Scalar Triple Product',
    titleTh: 'ผลคูณเชิงสเกลาร์ของ 3 เวกเตอร์ & ปริมาตรกล่อง',
    titleEn: 'Scalar Triple Product & Volume of Parallelepiped',
    embed3D: 'triple',
    embedHintTh: 'หมุนดูกล่องทรงสี่เหลี่ยมด้านขนานและทดสอบกรณีอยู่บนระนาบเดียวกัน (V = 0)',
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
  },
  {
    id: 29,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 8',
    tagEn: 'Example 8 (Sheet p. 10)',
    titleTh: 'ตัวอย่าง: ผลคูณเชิงสเกลาร์ของ 3 เวกเตอร์และปริมาตรกล่อง',
    titleEn: 'Scalar Triple Product & Parallelepiped Volume',
    writeHeightHint: 'tall',
    examples: [
      {
        promptTh: 'ให้ $\\vec{u} = \\langle 2, -1, 3 \\rangle,\\; \\vec{v} = \\langle 3, -2, -5 \\rangle$ และ $\\vec{w} = \\langle -1, 4, -4 \\rangle$ จงหา',
        promptLatex: '\\vec{u}\\cdot(\\vec{v}\\times\\vec{w}) \\quad \\text{และปริมาตรทรงสี่เหลี่ยมด้านขนาน } V = |\\vec{u}\\cdot(\\vec{v}\\times\\vec{w})|',
      },
    ],
  },
  {
    id: 30,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบ 1.10',
    tagEn: 'Exam Drill: Coplanar Points & Volume',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดร่วมระนาบ (Coplanar) และหาตัวแปรจากปริมาตร',
    titleEn: 'Coplanarity Test & Solving Parameters from Box Volume',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh: 'จงหาค่า $k$ ที่ทำให้จุด $A(1, 0, 1),\\; B(2, 1, 3),\\; C(0, 2, 2)$ และ $D(1, k, 4)$ อยู่บนระนาบเดียวกัน (Coplanar)',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh:
          'ทรงสี่เหลี่ยมด้านขนานมีขอบประชิดเป็น $\\vec{u} = \\langle 1, 2, 0 \\rangle,\\; \\vec{v} = \\langle 0, 1, 1 \\rangle$ และ $\\vec{w} = \\langle k, 1, 3 \\rangle$ ถ้าปริมาตรเท่ากับ $10$ ลบ.หน่วย จงหาค่า $k$ ทั้งหมด',
      },
    ],
  },
  {
    id: 31,
    lecture: 2,
    kind: 'concept',
    tagTh: 'คาบที่ 2 • หัวข้อ 1.11',
    tagEn: 'Lines in 3D Space',
    titleTh: 'สมการเส้นตรงในปริภูมิ 3 มิติ (3 รูปแบบ)',
    titleEn: 'Vector, Parametric & Symmetric Equations of a Line',
    embed3D: 'line3d',
    embedHintTh: 'เลื่อนค่า t เพื่อให้จุด P(t) วิ่งไปตามเส้นตรง 3 มิติ (รวม t = 0 ด้วย)',
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
  },
  {
    id: 32,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 9',
    tagEn: 'Example 9 (Sheet p. 12)',
    titleTh: 'ตัวอย่าง: การอ่านเวกเตอร์แสดงทิศทางจากสมการเส้นตรง',
    titleEn: 'Reading Direction Vectors from Symmetric Equations',
    writeHeightHint: 'tall',
    examples: [
      {
        label: 'ข้อ 1–4',
        promptTh: 'จงหาเวกเตอร์แสดงทิศทางของเส้นตรง $L_1, L_2, L_3$ และ $L_4$ (จัดสัมประสิทธิ์หน้า $x, y, z$ ให้เป็น $+1$ ก่อน)',
        promptLatex:
          '\\begin{aligned} L_1:\\; &\\frac{x-1}{2}=\\frac{y+3}{5}=z-2, &\\qquad L_2:\\; &1-x=\\frac{y-2}{6}=\\frac{z}{2} \\\\[6pt] L_3:\\; &\\frac{x+1}{2}=\\frac{2y-4}{5}=\\frac{2-z}{3}, &\\qquad L_4:\\; &\\frac{x-1}{3}=\\frac{y+3}{5},\\; z=4 \\end{aligned}',
      },
    ],
  },
  {
    id: 33,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 10',
    tagEn: 'Example 10 (Sheet p. 12–13)',
    titleTh: 'ตัวอย่าง: การสร้างสมการเส้นตรงในปริภูมิ 3 มิติ',
    titleEn: 'Building Line Equations (Point + Vector & Two Points)',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อ 5',
        promptTh: 'จงหาสมการเส้นตรงที่ผ่านจุด $(2, 1, -4)$ และขนานกับเวกเตอร์ $\\vec{v} = \\langle -3, -7, 5 \\rangle$',
      },
      {
        label: 'ข้อ 6',
        promptTh: 'จงหาสมการเส้นตรงที่ผ่านจุด $P(-2, 1, 6)$ และจุด $Q(1, -1, -8)$',
      },
    ],
  },
  {
    id: 34,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • ตัวอย่างที่ 11',
    tagEn: 'Example 11 (Sheet p. 13)',
    titleTh: 'ตัวอย่าง: เส้นตรงขนานกันและมุมระหว่างเส้นตรง 2 เส้น',
    titleEn: 'Parallel Lines & Angle Between Two Lines',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'ข้อ 7',
        promptTh: 'จงหาสมการอิงตัวแปรเสริมของเส้นตรงที่ผ่านจุด $(2, 1, -4)$ และขนานกับเส้นตรง $L_1$',
        promptLatex: 'L_1:\\; \\frac{x-1}{4} = \\frac{y+3}{7} = z - 2',
      },
      {
        label: 'ข้อ 8',
        promptTh: 'จงหามุมระหว่างเส้นตรง $L_1$ และ $L_2$ ต่อไปนี้',
        promptLatex: 'L_1:\\; x-2 = \\frac{y+3}{\\sqrt{2}} = z-1 \\qquad \\text{และ} \\qquad L_2:\\; \\frac{x+4}{\\sqrt{2}} = \\frac{z-1}{\\sqrt{2}},\\; y=3',
      },
    ],
  },
  {
    id: 35,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบเส้นตรง (1)',
    tagEn: 'Exam Drill: Intersecting vs Skew Lines',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดตัดของเส้นตรงและเส้นตรงไขว้ต่างระนาบ',
    titleEn: 'Intersecting vs Skew Lines in 3D Space',
    writeHeightHint: 'tall',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh: 'จงตรวจสอบว่าเส้นตรง $L_1$ และ $L_2$ ตัดกันหรือไขว้ต่างระนาบ หากตัดกันจงหาพิกัดจุดตัด',
        promptLatex: 'L_1:\\; x = 1+t,\\; y = -2+3t,\\; z = 4-t \\qquad L_2:\\; x = 1+2s,\\; y = 5-s,\\; z = -1+3s',
      },
    ],
  },
  {
    id: 36,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบเส้นตรง (2)',
    tagEn: 'Exam Drill: Line Orthogonal to Two Lines',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: เส้นตรงที่ตั้งฉากกับเส้นตรง 2 เส้น',
    titleEn: 'Finding a Line Orthogonal to Two Given Lines',
    writeHeightHint: 'tall',
    examples: [
      {
        label: 'แนวข้อสอบ B',
        promptTh: 'จงหาสมการอิงตัวแปรเสริมของเส้นตรง $L$ ที่ผ่าน $P(1, -2, 3)$ และตั้งฉากกับทั้ง $L_1$ และ $L_2$',
        promptLatex: 'L_1:\\; \\frac{x-1}{2}=\\frac{y+1}{-1}=\\frac{z}{1}, \\qquad L_2:\\; x=3+t,\\; y=2+2t,\\; z=-1-t',
      },
    ],
  },
  {
    id: 37,
    lecture: 2,
    kind: 'example',
    tagTh: 'คาบที่ 2 • แนวข้อสอบเส้นตรง (3)',
    tagEn: 'Exam Drill: Coordinate Intercepts & Distance',
    titleTh: 'ฝึกโจทย์แนวข้อสอบ: จุดตัดระนาบพิกัดและระยะห่างจุดถึงเส้นตรง',
    titleEn: 'Coordinate-Plane Intercepts & Point-to-Line Distance',
    writeHeightHint: 'compact',
    examples: [
      {
        label: 'แนวข้อสอบ A',
        promptTh:
          'จงหาจุดตัดของเส้นตรง $L: \\frac{x-3}{3} = \\frac{y+1}{-2} = \\frac{z-4}{2}$ กับระนาบ $xy$ และระนาบ $yz$',
      },
      {
        label: 'แนวข้อสอบ B',
        promptTh:
          'จงหาระยะห่างที่สั้นที่สุดจากจุด $P(4, 2, 1)$ ไปยังเส้นตรง $L: x = 1+2t,\\; y = -1+t,\\; z = 1-2t$ (แนะ: $d = \\frac{\\|\\overrightarrow{P_0 P}\\times\\vec{v}\\|}{\\|\\vec{v}\\|}$)',
      },
    ],
  },
  {
    id: 38,
    lecture: 2,
    kind: 'summary',
    tagTh: 'สรุปท้ายบทที่ 1',
    tagEn: 'Chapter 1 Cheat Sheet',
    titleTh: 'สรุปสูตรสำคัญ บทที่ 1 (1-Page Cheat Sheet)',
    titleEn: 'Vectors & 3D Lines Formula Summary',
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
  },
];
