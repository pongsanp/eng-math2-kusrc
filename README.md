# 01417168 Engineering Mathematics II — 3D Surfaces & Interactive Slides

สื่อการสอนแบบ Interactive 3 มิติและสไลด์ประกอบการสอนรายวิชา **01417168 คณิตศาสตร์วิศวกรรม II**

- **ผู้จัดทำ (Author):**
  - ผศ.ดร.พงษ์สัญ ประกฤตศรี — คณะวิทยาศาสตร์ ศรีราชา ม.เกษตรศาสตร์ วิทยาเขตศรีราชา
  - Pongsan Prakitsri — Faculty of Science at Sriracha, Kasetsart University Sriracha Campus
- **เว็บไซต์ (GitHub Pages):** https://pongsanp.github.io/eng-math2-kusrc/
- **Repository:** https://github.com/pongsanp/eng-math2-kusrc
- **สัญญาอนุญาต (License):** [CC BY-NC 4.0 (Creative Commons Attribution-NonCommercial 4.0 International)](LICENSE) — นำไปใช้และดัดแปลงเพื่อการศึกษาได้โดยต้องระบุชื่อผู้จัดทำและแหล่งที่มา ห้ามนำไปใช้ในเชิงพาณิชย์

---

## วิธีแก้ไขข้อความหรือโจทย์ในสไลด์บทที่ 1 ด้วยตัวเอง

1. เปิดไฟล์ [`src/slides/ch1SlidesData.ts`](src/slides/ch1SlidesData.ts) บนหน้าเว็บ GitHub (หรือแก้ไขในคอมพิวเตอร์)
2. กดไอคอนรูปดินสอ (**Edit this file**) แล้วแก้ข้อความในส่วน `titleTh`, `bullets`, `promptTh`, หรือ `promptLatex`
   *(หมายเหตุ: ในไฟล์ `.ts` เครื่องหมาย Backslash ของสมการ LaTeX ให้เขียนซ้อน 2 ตัว เช่น `\\vec{u}` หรือ `\\frac{x-1}{2}`)*
3. กดปุ่ม **Commit changes** → ระบบ GitHub Actions จะ Build และอัปเดตหน้าเว็บ GitHub Pages ให้อัตโนมัติภายใน ~1 นาที (ไม่มีค่าใช้จ่าย/ไม่เสียเครดิต)

---

## พัฒนาและทดสอบบนเครื่อง (Local Development)

```bash
npm install
npm run dev
npm run build
npm run lint
```
