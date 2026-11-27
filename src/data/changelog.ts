export interface ChangelogEntry {
  version: string;
  date: string;
  titleTh: string;
  titleEn: string;
  highlightsTh: string[];
  highlightsEn: string[];
}

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.6.0';

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '1.7.0',
    date: '2026-11-27',
    titleTh: 'สลับสมุดบันทึกแยก Sec / คาบสอนได้ (ซิงก์ข้ามอุปกรณ์)',
    titleEn: 'Multi-Section Notebook Switcher with Cloud Sync',
    highlightsTh: [
      'เพิ่มปุ่มสลับสมุดบันทึกบนแถบหัวสไลด์ (เช่น สมุดหลัก, Sec 1, Sec 2) แยกเก็บลายมือและหน้ากระดาษเปล่าคนละชุด',
      'รองรับการสร้าง เปลี่ยนชื่อ และลบสมุดบันทึก พร้อมซิงก์รายชื่อสมุดและลายมือแต่ละ Sec ขึ้น Cloud อัตโนมัติ',
      'ข้อมูลลายมือเดิมของผู้ใช้ทั้งหมดถูกเก็บไว้อย่างปลอดภัยใน "สมุดหลัก"',
    ],
    highlightsEn: [
      'Added Section/Notebook switcher in the Slides top bar to keep separate handwriting & custom blank pages per class section.',
      'Supports creating, renaming, and deleting notebooks with automatic Firestore sync across devices.',
      'All existing notes remain preserved safely inside "Main Notebook".',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-11-27',
    titleTh: 'ล็อกอิน Google + ซิงก์ลายมืออัตโนมัติ & เลขเวอร์ชัน',
    titleEn: 'Google Sign-In, Auto-Sync Notes & Version History',
    highlightsTh: [
      'เพิ่มระบบล็อกอินด้วย Google (Firebase Auth) เพื่อซิงก์ลายมือ หน้ากระดาษเปล่า และรูปที่ตัดแปะข้ามอุปกรณ์ (เช่น iPad ↔ PC ↔ Android)',
      'Auto-Sync ขึ้น Cloud อัตโนมัติหลังหยุดเขียน ~2 วินาที พร้อมเก็บสำรองในเครื่อง (IndexedDB) ให้เขียนออฟไลน์ต่อได้',
      'ปลอดภัย 100% สำหรับผู้ใช้เดิม: เมื่อล็อกอินครั้งแรก ระบบจะอัปโหลด/ผสานลายมือเดิมในเครื่องขึ้น Cloud ให้โดยไม่เขียนทับหรือทำให้โน้ตหาย',
      'เพิ่มป้ายเวอร์ชัน (v1.6.0) และหน้าสรุปอัปเดต เพื่อเช็กได้ทันทีว่าบน iPad/เบราว์เซอร์โหลดเวอร์ชันล่าสุดแล้ว',
    ],
    highlightsEn: [
      'Added Google Sign-In (Firebase Auth) to sync handwriting strokes, custom blank pages, and snippets across iPad, PC, and Android.',
      'Automatic debounced Cloud Sync (~2s after writing) backed by local IndexedDB offline cache.',
      'Zero data loss migration: first sign-in preserves existing local notes and offers Merge / Replace options if Cloud notes already exist.',
      'Added clickable app version badge (v1.6.0) with bilingual release notes.',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-11-25',
    titleTh: 'แถบปากกาแบบลอยพับได้ & ซ่อนแถบล่างอัตโนมัติ',
    titleEn: 'Foldable Amber Pen Bar & Compact Canvas Mode',
    highlightsTh: [
      'ปรับแถบเครื่องมือเขียนแบบลอยสีเหลืองอุ่น พับย่อ/ขยายได้ในคลิกเดียว',
      'ซ่อนแถบนำทางด้านล่างเป็นค่าเริ่มต้น เพื่อเพิ่มพื้นที่จดบนแท็บเล็ตและจอ 7 นิ้ว พร้อมปุ่มสลับเปิด/ปิดด้านบน',
    ],
    highlightsEn: [
      'Added dual-row warm amber foldable floating pen toolbar.',
      'Defaulted compact bottom bar mode to maximize slide writing space on tablets.',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-11-24',
    titleTh: 'รองรับปากกา Android, ป้ายชื่อแกน 3D & สำรองไฟล์ .json',
    titleEn: 'Android Stylus, 3D Labels, Custom Blank Pages & JSON Backup',
    highlightsTh: [
      'รองรับแรงกด/การกันอุ้งมือสำหรับปากกา Android และ iPad (Apple Pencil)',
      'เพิ่มป้ายกำกับเวกเตอร์/แกนในกราฟ 3D, แทรกหน้ากระดาษเปล่า (ลายจุด/มีเส้น/ว่าง) และปุ่มสำรอง-นำเข้าไฟล์ .json',
    ],
    highlightsEn: [
      'Improved Android stylus & Apple Pencil palm-rejection and pressure response.',
      'Added 3D vector labels, insertable blank note pages, and .json deck backup/restore.',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-11-20',
    titleTh: 'สไลด์การสอนบทที่ 1 (TH/EN) + Export PDF',
    titleEn: 'Chapter 1 Interactive Lecture Slides (TH/EN) & PDF Export',
    highlightsTh: [
      'เพิ่มโหมดสไลด์การสอนบทที่ 1 สองภาษา (ไทย/English) พร้อมกราฟ 3D โต้ตอบได้ในสไลด์',
      'รองรับ Export PDF ทั้งแบบมีลายมือและใบงานเปล่า (GoodNotes)',
    ],
    highlightsEn: [
      'Launched bilingual (TH/EN) Chapter 1 lecture slides with embedded 3D canvases.',
      'Added annotated & blank worksheet PDF export.',
    ],
  },
];
