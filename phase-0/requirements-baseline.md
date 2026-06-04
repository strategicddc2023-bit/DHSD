# Phase 0 Requirements Baseline

เอกสารนี้เป็นข้อกำหนดตั้งต้นสำหรับเริ่มพัฒนาโครงการ `district_health_system_ddc`
วันที่อ้างอิง: 2026-05-29

## 1) วัตถุประสงค์ระบบ
- พัฒนาระบบศูนย์กลางรายงานผลข้อมูล พชอ. แทนการใช้ไฟล์ Excel กระจัดกระจาย
- รองรับข้อมูลปีงบประมาณ 2566-2570
- แสดงผล Dashboard ระดับประเทศ/เขต โดยเป้าหมายเร่งด่วนคือแผนที่ สคร. 13 เขต

## 2) ขอบเขต MVP รอบปัจจุบัน
- Frontend: React (Next.js)
- Backend/Data/Auth/Storage: Supabase
- Deploy: Vercel
- Source Control: GitHub

MVP ที่ต้องมี
- หน้าเว็บแนว SPA/Landing Page
- Hero Section/Hero Banner
- Immersive Background (Depth of Field)
- Scroll Indicator
- Dashboard แผนที่ สคร.1-13
- ฟอร์มนำเข้าข้อมูลระยะแรก 4 ฟิลด์
  - หน่วยงาน (Dropdown สคร.1-สคร.13)
  - จังหวัด
  - อำเภอ (กรองตามจังหวัดที่เลือก)
  - ประเด็นโรค/ภัยสุขภาพ (Text)

## 3) ขอบเขตที่วางโครงไว้ก่อน (ยังไม่บังคับใช้)
- RBAC role model: super_admin, admin, user
- SSO/ThaiD integration architecture (OIDC)
- Authorization โดย allowlist ในฐานข้อมูลของระบบ

## 4) ข้อกำหนดเชิงฟังก์ชัน (Functional)
- ผู้ใช้สร้าง/แก้ไขข้อมูลนำเข้าระยะแรกได้
- ระบบบันทึกข้อมูลและอ่านกลับเพื่อแสดงผลหน้า Dashboard ได้
- หน้าเว็บแต่ละหน้าแยกไฟล์ชัดเจนและเชื่อม navigation กันได้
- เตรียมโครงข้อมูลสรุปสำหรับดึง Dashboard โดยไม่คำนวณใหม่ทุกครั้ง

## 5) ข้อกำหนดเชิงไม่ใช่ฟังก์ชัน (Non-Functional)
- Security: ห้าม commit ไฟล์ .env ขึ้น GitHub
- Config management: ใช้ Environment Variables/Secrets บน Vercel/Supabase
- Maintainability: แยกไฟล์ตามหน้า/components/services/types
- Scalability: รองรับการเพิ่มฟอร์ม/สิทธิ์/SSO ในเฟสถัดไปโดยไม่รื้อใหญ่

## 6) Acceptance Criteria ของ Phase 0
- มีเอกสาร Requirements baseline ฉบับนี้
- มี Data Dictionary baseline สำหรับฟิลด์ระยะแรก
- มี User Role Matrix baseline
- มีรายการประเด็นที่ต้องยืนยันก่อนเริ่มพัฒนา Phase 1
