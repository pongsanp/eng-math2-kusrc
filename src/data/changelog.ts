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
    version: '1.7.3',
    date: '2026-11-27',
    titleTh: 'ปุ่มตรวจหาอัปเดต & รีเฟรชแอปจากไอคอน iPad ในคลิกเดียว',
    titleEn: 'One-Tap In-App Update Check & Force Reload for iPad Home Screen App',
    highlightsTh: [
      'เพิ่มระบบเช็ก version.json อัตโนมัติเมื่อเปิดแอป หากมีเวอร์ชันใหม่จะขึ้นจุดสีเขียวข้างเลขเวอร์ชัน',
      'เพิ่มปุ่ม "ตรวจอัปเดต" และ "รีเฟรชแอป" (Cache-Bust) ในหน้าต่างเลขเวอร์ชัน เพื่อให้แอปที่กดเพิ่มลงหน้าจอโฮม iPad อัปเดตเป็นเวอร์ชันล่าสุดได้ทันทีโดยลายมือเดิมไม่หาย',
    ],
    highlightsEn: [
      'Added automatic version.json update checking with a green indicator on the version badge when a newer build is live.',
      'Added "Check" and cache-bust "Force Reload" buttons inside the Version modal for iPad Home Screen apps without losing local notes.',
    ],
  },
  {
    version: '1.7.2',
    date: '2026-11-27',
    titleTh: 'อัปเกรด Kasa Circle Fit สำหรับวาดวงกลม/วงรีบน iPad',
    titleEn: 'Upgraded Open-Arc Circle & Ellipse Fit on iPad',
    highlightsTh: [
      'เพิ่มสมการ Kasa Circle Fit + ตรวจมุมกวาด (Winding Angle >= 225°) ทำให้วาดวงกลมและวงรีบน iPad ติดง่ายแม้ปิดวงไม่สนิทหรือลากเลยจุดเริ่มต้น',
      'ปรับลดเกณฑ์หยุดปลายปากกาก่อนยกเป็น ~85 ms และป้องกันวงกลมขอบเหลี่ยมเล็กน้อยไม่ให้กลายเป็นสี่เหลี่ยม',
    ],
    highlightsEn: [
      'Added Kasa algebraic circle fit and >= 225° winding-angle loop detection so open-arc or overshot iPad circles and ellipses snap reliably.',
      'Lowered early-lift pause threshold to ~85 ms and tightened rectangle fill-ratio guard.',
    ],
  },
  {
    version: '1.7.1',
    date: '2026-11-27',
    titleTh: 'ปรับ Snap วงกลม/วงรีบน iPad, ยางลบทั้งเส้น & แจ้งเวลา Auto-Sync',
    titleEn: 'iPad Shape Snap Fix, Stroke Eraser Default & 5s Sync Label',
    highlightsTh: [
      'ปรับปรุง Hold-to-Snap บน iPad (Apple Pencil) ให้ลดเวลารอเหลือ ~0.3 วินาที เพิ่มระยะรับแรงสั่นมือบนหน้าจอ และรองรับการหยุดปลายปากกาสั้นๆ ก่อนยกเพื่อจัดเป็นวงกลม/วงรี/สามเหลี่ยม/สี่เหลี่ยม',
      'ตั้งค่ายางลบเริ่มต้นเป็นแบบ "ลบทั้งเส้น" (Stroke Eraser) สามารถสลับเป็นลบเฉพาะจุดได้ในแถบตัวเลือกปากกา',
      'แสดงรายละเอียดระยะเวลา Auto-Sync (~5 วินาที) ในหน้าต่างบัญชี Google Sync',
    ],
    highlightsEn: [
      'Improved iPad Apple Pencil shape snap (~0.3s hold threshold, wider screen-space jitter tolerance, and brief pause-before-lift detection for circles, ellipses, triangles, and rectangles).',
      'Defaulted Eraser tool to Stroke mode (whole-stroke erase).',
      'Added explicit ~5s Auto-Sync interval indicator in the Cloud Sync menu.',
    ],
  },
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
      'Auto-Sync ขึ้น Cloud อัตโนมัติหลังหยุดเขียน ~5 วินาที พร้อมเก็บสำรองในเครื่อง (IndexedDB) ให้เขียนออฟไลน์ต่อได้',
      'ปลอดภัย 100% สำหรับผู้ใช้เดิม: เมื่อล็อกอินครั้งแรก ระบบจะอัปโหลด/ผสานลายมือเดิมในเครื่องขึ้น Cloud ให้โดยไม่เขียนทับหรือทำให้โน้ตหาย',
      'เพิ่มป้ายเวอร์ชัน (v1.6.0) และหน้าสรุปอัปเดต เพื่อเช็กได้ทันทีว่าบน iPad/เบราว์เซอร์โหลดเวอร์ชันล่าสุดแล้ว',
    ],
    highlightsEn: [
      'Added Google Sign-In (Firebase Auth) to sync handwriting strokes, custom blank pages, and snippets across iPad, PC, and Android.',
      'Automatic debounced Cloud Sync (~5s after writing) backed by local IndexedDB offline cache.',
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
