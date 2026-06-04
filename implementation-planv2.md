# implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป)

เอกสารนี้เป็นสรุปสั้นจาก `implementation-plan.md` ว่าเราทำอะไรไปแล้ว และเฟสถัดไปต้องทำอะไรต่อ เพื่อให้ครั้งหน้าเปิดไฟล์นี้ไฟล์เดียวแล้วทำงานต่อได้ทันที

## สรุปสิ่งที่ทำไปแล้ว
- วางแผนโครงการครบ Phase 0-8 (React/Next.js + GitHub + Vercel + Supabase)
- ตั้งค่าโปรเจกต์และโครงสร้างไฟล์หลักใน `web/`
- ตั้งค่านโยบายความปลอดภัย `.env` ไม่ขึ้น GitHub และใช้ environment variables แทน
- ออกแบบฐานข้อมูลหลัก + RLS MVP + ตาราง master หน่วยงาน/จังหวัด/อำเภอ
- นำเข้าจังหวัดและอำเภอครบ และ mapping สคร.1-สคร.13 กับจังหวัด
- พัฒนาฟอร์มรับข้อมูล MVP:
  - หน่วยงาน (สคร.1-สคร.13)
  - จังหวัด (กรองตามหน่วยงาน)
  - อำเภอ (กรองตามจังหวัด)
  - ประเด็นโรค/ภัยสุขภาพ (ข้อความ)
- พัฒนา Dashboard พื้นฐาน:
  - summary cards
  - filter
  - ตารางรายการล่าสุด
  - coverage ตาม สคร.
  - export CSV
- ปรับ Dashboard เพิ่มเติม:
  - filter จากแผนที่ (คลิกเลือกเขต) และกดซ้ำเพื่อยกเลิก filter
  - จำนวนรายการทั้งหมดสัมพันธ์กับ filter ที่เลือก
- วางโครง KPI Engine ระยะต้น (ตาราง/ฟังก์ชัน/วิว/validation constraints) โดยยังไม่ seed ข้อมูลตัวอย่าง
- พัฒนาแผนที่ Dashboard ต่อเนื่อง:
  - เปลี่ยนจากแผนที่ mock เป็นแผนที่ประเทศไทยโทนสีเหลือง-ส้มพร้อมระดับสีตามข้อมูลจริง
  - แสดงค่าเปอร์เซ็นต์บนเขต สคร. เพื่ออ่านภาพรวมเร็วขึ้น
  - เปลี่ยนการ render แผนที่ไปใช้ `amCharts v3 (amMap + thailandLow.js + export plugin + light theme)` ตามโจทย์ล่าสุด
  - ผูกข้อมูล `coverage` จากระบบเข้ากับสี/ป้ายบนแผนที่ และคงพฤติกรรมคลิกเพื่อกรองข้อมูล
  - ผูกข้อมูล `agency_provinces` เพื่อลงสี “ระดับจังหวัดจริง” ตาม สคร. และคลิกจังหวัดเพื่อกรองหน่วยงานได้
  - เพิ่ม type และ flow ที่เกี่ยวข้อง:
    - เพิ่ม `AgencyProvinceMapRow` ใน `web/types/mvp.ts`
    - ดึง `agency_provinces` ใน `DashboardSection` แล้วส่งเข้า `ThailandHealthZoneMap`
    - ปรับ `ThailandHealthZoneMap` ให้สร้าง `areas` ของ `amCharts` จาก mapping จริง
  - ทดสอบ build ผ่านหลังปรับแผนที่ (`npm run build`)

## สถานะ Phase ปัจจุบัน
- เสร็จแล้ว: `Phase 0`, `Phase 1`, `Phase 2`, `Phase 3` (ระดับ MVP ตามแผน)
- เสร็จเชิงโครงสร้างและใช้งานจริงแล้ว: `Phase 4`
- กำลังเก็บรายละเอียด: `Phase 5`, `Phase 6`, และเริ่ม `Phase 7`
  - `Phase 5`: Dashboard/Map/Report ให้พร้อมใช้งานจริง
  - `Phase 6`: Alert, สถานะสี, และ Forecast เบื้องต้น
- `Phase 7`: เริ่มวาง readiness / QA checks สำหรับ UAT
- วางโครงไว้แล้วบางส่วน: `Phase 8` authorization model (`superadmin/admin/user`, allowlist, status, RLS policy pass)
- เริ่มผูก UI กับ role/scope จริงแล้ว:
  - อ่าน session ผู้ใช้และแสดง `AccessRibbon`
  - แสดงเมนูหลักตาม role และซ่อนหน้า `Smoke Test` จาก non-superadmin
  - ล็อกการกรอกฟอร์มตาม `agency_code` ของผู้ใช้
  - กรองตัวเลือก/แผนที่/ตารางบน dashboard ตาม scope
  - เพิ่มพาเนล `Superadmin Access Manager` สำหรับจัดการ `app_users` และ allowlist
  - เพิ่มหน้า `/smoke-test` สำหรับตรวจสิทธิ์ read/write แบบจำลอง
  - เพิ่มหน้า `/my-work` สำหรับ admin/user และ redirect ตาม role หลังอ่าน session
- ยังไม่เริ่มเต็มรูปแบบ: ไม่มี

## แผนงานต่อจากนี้ (แนะนำลำดับ)
1. ปิด `Phase 4` ให้ครบ:
   - ทดสอบสูตร KPI กับข้อมูลจริง
   - ตรวจความถูกต้องผลคำนวณและการ recompute
2. ปิด `Phase 5` ให้ครบ:
   - ปรับ Dashboard เชิงบริหาร (จัดลำดับ KPI/Map/Table ให้ตอบโจทย์ผู้บริหารมากขึ้น)
   - เตรียมรายงาน export ตามรูปแบบใช้งานจริง (CSV/Excel/PDF ตาม template หน่วยงาน)
   - เก็บงานแผนที่ `amCharts`:
     - ตรวจสอบความถูกต้องรหัสพื้นที่แผนที่ (`TH-xx`) เทียบ `province_code` ให้ครบทุกจังหวัด และทำตารางแปลงรหัสถ้าจำเป็น
     - ปรับ tooltip/label ให้แสดงชื่อจังหวัด + ชื่อเขต + จำนวนรายการ + สัดส่วน (%)
     - เพิ่ม fallback กรณีโหลด CDN ไม่สำเร็จ (ข้อความแจ้งเตือน/โหมดสำรอง)
     - ปรับ UX การเลือก filter จากแผนที่ (แสดงสถานะเขตที่เลือกชัดเจน และปุ่มล้าง filter)
3. เก็บ `Phase 6` ให้แน่น:
   - Alert/สถานะสี/แนวโน้ม
   - Forecast เบื้องต้น
4. เข้า `Phase 7`:
   - QA/UAT/Go-live readiness
   - ตรวจความสมบูรณ์ของข้อมูล, mapping, KPI, และสิทธิ์ใช้งาน
5. วาง `Phase 8` ต่อ:
   - SSO ThaiD + authorization model (allowlist/role/status)
   - ปรับ RLS และหน้าเว็บให้สอดคล้องกับสิทธิ์ `superadmin/admin/user`
   - แยกสิทธิ์อ่าน/เขียนให้ชัด:
     - `superadmin` เห็นและจัดการทุก scope
     - `admin` เห็นภาพรวมระดับ สคร. ของตัวเอง แต่กรอกข้อมูลได้เฉพาะหน่วยงานตัวเอง
     - `user` กรอกข้อมูลได้เฉพาะหน่วยงานตัวเอง
   - ทำหน้า/flow สำหรับจัดการ `app_users` และ allowlist สำหรับ `superadmin`
   - เพิ่ม smoke test page + SQL helper สำหรับยืนยัน matrix สิทธิ์ใน Supabase SQL editor
   - ทำ page-level visibility ให้เห็นหน้าตาม role ชัดเจน
   - redirect หลัง login/โหลด session:
     - `superadmin` อยู่ dashboard หลัก
     - `admin/user` ไปหน้า `/my-work`

## ข้อกำหนดที่ต้องยึดต่อเนื่อง
- ยังไม่ใช้ sample data: ให้ใช้ข้อมูลจริงที่ผู้ใช้นำเข้าเอง
- รักษานโยบายความลับระบบ: ไม่ commit `.env` ทุกสภาพแวดล้อม
- แยกไฟล์ตามหน้า/ส่วนงานชัดเจน และเชื่อมโยงการทำงานระหว่างหน้า
- การใช้แผนที่แบบ CDN (`amCharts`) ต้องมีแผนรองรับเมื่อเครือข่ายภายนอกไม่พร้อมใช้งาน

## จุดเริ่มงานรอบถัดไป (สำหรับ AI ที่มาอ่านต่อ)
1. ตรวจแผนที่จังหวัดว่าลงสีครบทุกจังหวัดจริง:
   - เทียบผลบนหน้า Dashboard กับข้อมูลใน `agency_provinces`
   - หากบางจังหวัดไม่ติดสี ให้เพิ่ม mapping แปลง `province_code` -> `amCharts area id`
2. ทำ fallback แผนที่เมื่อโหลด CDN ไม่สำเร็จ:
   - แสดงข้อความเตือนผู้ใช้
   - แสดงโหมดสำรอง (เช่น ตาราง coverage ตาม สคร.) โดยไม่ทำให้หน้า Dashboard พัง
3. ขยายข้อมูล tooltip/map legend ให้ครบเชิงบริหาร:
   - จังหวัด, สคร., จำนวนรายการ, % เทียบเขตที่สูงสุด
4. ต่อ Phase 4:
   - ทดสอบผล KPI ด้วยข้อมูลจริงรายปี
   - ยืนยันความถูกต้องของ recompute เมื่อมีการ submit ข้อมูลใหม่
