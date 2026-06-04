# Rp.md — สรุปภาพรวมระบบ DHSD (District Health System DDC)

> เอกสารฉบับนี้รวบรวมสาระสำคัญจาก `dhsd.md`, `implementation-plan.md`, `implementation-planv2.md`, `implementation-planv3.md`, `implementation-planv4.md` และ `แผนที่กดเขตสุขภาพ.md` เพื่อให้ AI หรือนักพัฒนาที่มาอ่านเข้าใจทั้งระบบได้จากไฟล์เดียว

---

## 1. ระบบนี้คืออะไร

**ชื่อโปรเจกต์:** `district_health_system_ddc` (DHSD)

**เป้าหมาย:** พัฒนาระบบศูนย์กลางสำหรับบันทึก ประมวลผล และแสดงรายงานภาพรวมการขับเคลื่อนงาน **พชอ. (คุณภาพชีวิตระดับอำเภอ)** ทดแทนการใช้ไฟล์ Excel กระจัดกระจาย ครอบคลุมระดับประเทศ ระดับเขตสุขภาพ (สคร.1-12 + สปคม.) ลงลึกถึงระดับจังหวัดและอำเภอ

**ขนาดข้อมูล:** 77 จังหวัด, 928 อำเภอ/เขต, 13 หน่วยงานเขตสุขภาพ (สคร.1-12 + สปคม.), ปีงบประมาณ 2566-2570

**โครงสร้างแนวคิด:** IPO Model (Input → Process → Output)

---

## 2. สถาปัตยกรรมและ Tech Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js `15.5.18`, React `19.1.0`, TypeScript strict mode |
| แผนที่ | Leaflet `1.9.4` + React Leaflet `5.0.0` + GeoJSON polygon จริง |
| กราฟ | Recharts (BarChart, ResponsiveContainer, Cell) |
| Backend / DB / Auth / Storage | Supabase (PostgreSQL + RLS + Auth + Storage) |
| Source Control | GitHub |
| Deploy | Vercel (Preview + Production) |

---

## 3. โครงสร้างข้อมูล (IPO Model)

### 3.1 INPUT — ข้อมูลนำเข้า 4 กลุ่ม

| กลุ่ม | เนื้อหา |
|-------|---------|
| **กลุ่ม 1: ข้อมูลตั้งต้น** | หน่วยงาน (สคร.1-13), จังหวัด (กรองตามหน่วยงาน), อำเภอ (กรองตามจังหวัด), อำเภอจุดเน้น, ปีงบประมาณ 2566-2570, รอบรายงาน 6/12 เดือน |
| **กลุ่ม 2: โครงการ/การวิเคราะห์ปัญหา** | ประเด็นโรค/ภัยสุขภาพ ตาม 5 Clusters (CD, SALTH, NATI, Env-Occ, ระบบบูรณาการ), แผนงาน/โครงการ, สถานะโครงการ |
| **กลุ่ม 3: ติดตามประเมินผล** | KPI (ชื่อ/วิธี/เครื่องมือวัด), เป้าหมาย, ผลลัพธ์เชิงประจักษ์, สถานะความสำเร็จ, ปัญหาอุปสรรค |
| **กลุ่ม 4: สรุป/เอกสาร** | ข้อเสนอแนะเชิงนโยบาย, ระดับรางวัล พชอ. (เพชร/ทอง/เงิน), เอกสารแนบ PDF/XLS |

**ฟอร์มระยะแรก (MVP):** เก็บเฉพาะ 4 ฟิลด์ — หน่วยงาน, จังหวัด, อำเภอ (dependent dropdown), ประเด็นโรค/ภัยสุขภาพ

### 3.2 PROCESS — การประมวลผล

| กระบวนการ | รายละเอียด |
|-----------|-----------|
| **P0: Data Integration** | เชื่อม API / นำเข้า Excel/SQL, ทำความสะอาดข้อมูล |
| **P1: Calculation Engine** | คำนวณ KPI 3 ตัว (% วิเคราะห์ปัจจัยเสี่ยง, % ดำเนินงานผ่าน พชอ., % ผลลัพธ์เชิงประจักษ์), แปลงร้อยละ→คะแนน (≤30=0.1, 35=0.2, 40=0.3, 45=0.4, ≥50=0.5), สรุปยอดรวม |
| **P2: Clustering** | จัดหมวด 5 Clusters Matrix, เปรียบเทียบย้อนหลัง |
| **P3: Status Tracking** | Color-coding สถานะ (เขียว/เหลือง/แดง), Alert เมื่อต่ำกว่าเป้า, Forecast แนวโน้ม |

### 3.3 OUTPUT — การแสดงผล

| องค์ประกอบ | รายละเอียด |
|-----------|-----------|
| **O1: Interactive Map** | แผนที่ 3 ระดับ (13 เขตสุขภาพ → จังหวัด → อำเภอ), popup ข้อมูลพื้นที่, ปุ่มกรอกข้อมูลตามสิทธิ์ |
| **O2: Executive Dashboard** | Summary Cards, Bar Chart ความครอบคลุมตาม สคร., KPI Summary, Forecast เบื้องต้น |
| **O3: Data Table & Export** | ตารางค้นหา/กรอง, CSV export (PDF/Excel ยังไม่ได้ทำ) |

---

## 4. ระบบสิทธิ์ผู้ใช้ (RBAC)

| Role | สิ่งที่ทำได้ |
|------|-------------|
| **superadmin** | เห็นทุกอย่าง, เข้า Dashboard เต็ม, จัดการ users/allowlist, กรอกข้อมูลได้ทุก agency |
| **admin** | เห็นข้อมูลตาม scope สคร.ตัวเอง, กรอกข้อมูลหน่วยงานตัวเอง, เข้าหน้า `/my-work` |
| **user** | เห็น/กรอกเฉพาะหน่วยงาน/scope ตัวเอง, เข้าหน้า `/my-work` |
| **guest/public** | เห็น Public Dashboard, ไม่เห็นปุ่มกรอกข้อมูลในแผนที่ |

**การออกแบบ Auth ระยะยาว:**
- แยก **Authentication** (ThaiD/SSO ยืนยันตัวตน) ออกจาก **Authorization** (ฐานข้อมูลระบบตัดสินสิทธิ์)
- ตาราง `app_users` ทำ allowlist + สถานะ (`pending/active/suspended`)
- Login ผ่าน ThaiD สำเร็จ → ตรวจ `app_users` → ไม่พบหรือไม่ active → ปฏิเสธ → พบ active → อนุญาตพร้อมแนบ role
- **สถานะปัจจุบัน:** Login/ThaiD ยังไม่ทำจริง, ใช้ client redirect เป็นหลัก

---

## 5. โครงสร้างหน้าเว็บ

| หน้า | รายละเอียด |
|------|-----------|
| `/` (Public Dashboard) | Hero Section + Dashboard Preview + แผนที่ Interactive + กราฟ BarChart (side-by-side) + KPI Summary + ตารางข้อมูลล่าสุด + Coverage สคร. + Coverage จังหวัด |
| `/my-work` | Backoffice สำหรับ admin/user — WorkSummary + IntakeFormSection + KpiInputSection + Dashboard mode |
| `/login` | Card login ง่ายๆ (ยังไม่ทำ ThaiD จริง) |
| `/smoke-test` | superadmin เท่านั้น — ตรวจสิทธิ์ + Map Smoke Test |

**Dashboard Layout (Desktop):**
```
┌──────────────────────────────────────────────────┐
│ Dashboard Preview                                 │
├──────────────┬───────────────────────────────────-┤
│  แผนที่       │  กราฟ BarChart ความครอบคลุม สคร.   │
│  (1fr ~280px) │  (2.5fr)                           │
├──────────────┴───────────────────────────────────-┤
│ Summary Cards / KPI / Metrics / Table             │
└──────────────────────────────────────────────────-┘
```
Mobile (≤1200px): ตกลงมาเรียงแถวเดียว, ไม่มี horizontal scroll

---

## 6. แผนที่ Interactive 3 ระดับ (หัวใจของระบบ)

### Flow การใช้งาน

```
เปิด Dashboard
  → เห็นแผนที่ 13 เขตสุขภาพ (polygon จังหวัดจริง + สี 13 สีแยกชัด)
  → คลิกเขตสุขภาพ (เช่น สคร.8)
  → กรองเหลือเฉพาะจังหวัดในเขตนั้น + ซูมเข้า
  → คลิกจังหวัด (เช่น อุดรธานี)
  → Lazy load districts/{province_code}.geojson
  → แสดง polygon อำเภอ
  → คลิกอำเภอ (เช่น เมืองอุดรธานี)
  → ดึง intake_records ตาม district_code
  → แสดง detail panel: ประเด็นโรค/ภัยสุขภาพ + ข้อมูลล่าสุด 5 รายการ
  → ถ้ามีสิทธิ์ → ปุ่ม "กรอกข้อมูลอำเภอนี้" → เติม agency/province/district ลงฟอร์ม
```

### ข้อมูล Boundary

- **แหล่งที่มา:** `piyayut-ch/mapthai` (UNOCHA / Royal Thai Survey Department, 2019)
- **ไฟล์:** `provinces.geojson` (77 features), `districts/{province_code}.geojson` (77 ไฟล์, 928 features)
- **GeoJSON Contract:** `province_code`, `province_name`, `district_code`, `district_name`
- **Mapping ฐานข้อมูล:** `agency_provinces` ผูก 77 จังหวัด → 13 สคร. ครบ (ไม่มี unmapped)

### สีแผนที่ปัจจุบัน

| สถานะ | สี |
|-------|-----|
| 13 เขตสุขภาพ | agencyPalette 13 สีแตกต่างชัด |
| เขตที่คลิก | `#ff039a` (ชมพูเข้ม) |
| จังหวัด/อำเภอที่คลิก | `#f97316` (ส้ม) |
| อำเภอทั้งหมดในจังหวัด (default) | `#03a7f3` (ฟ้า) |
| Legend เขตสุขภาพ | `conic-gradient()` 13 สี |

---

## 7. ฐานข้อมูล Supabase

### SQL Migrations (รันตามลำดับ)

```
001_mvp_schema.sql               — Schema หลัก
002_mvp_rls_policies.sql         — Row Level Security
003_agency_province_mapping.sql  — Mapping สคร.-จังหวัด
004_seed_all_provinces_districts.sql — Master จังหวัด/อำเภอ
005_full_agency_province_mapping.sql — Mapping ครบ 77 จังหวัด
006_verify_agency_province_mapping.sql — ตรวจสอบ mapping
007_phase4_kpi_engine.sql        — KPI Engine (ตาราง/ฟังก์ชัน/วิว)
010_kpi_input_validation_constraints.sql — Validation
011_phase8_auth_model.sql        — Auth model (app_users)
013_phase8_rbac_policies.sql     — RBAC policies
014_phase8_access_smoke_test.sql — Smoke test สิทธิ์
015_phase8_bootstrap_superadmin.sql — Bootstrap superadmin
016_fix_udon_thani_agency_mapping.sql — แก้ไขอุดรธานี→DPC08
017_phase_map_readiness_checks.sql — Readiness แผนที่
018_phase_map_smoke_test.sql     — Smoke test แผนที่
```

**ค่า Readiness ที่ต้องได้:**
- `master_province_count = 77`
- `master_district_count = 928`
- `agency_province_mapping_count = 77`
- `unmapped_province_count = 0`

**Superadmin ปัจจุบัน:**
- UUID: `b86f6f01-819a-4118-881e-33d27b3121ba`
- Email: `strategic.ddc2023@gmail.com`

---

## 8. ไฟล์สำคัญในโปรเจกต์

### Pages
```
web/app/page.tsx             — หน้า Public Dashboard
web/app/my-work/page.tsx     — หน้า Backoffice (admin/user)
web/app/login/page.tsx       — หน้า Login
web/app/smoke-test/page.tsx  — หน้า Smoke Test (superadmin)
web/app/layout.tsx           — Layout หลัก
web/app/globals.css          — CSS ทั้งระบบ
```

### Components
```
web/components/HeroSection.tsx                — Hero Banner
web/components/DashboardSection.tsx           — Dashboard หลัก
web/components/InteractiveHealthMap.tsx        — แผนที่ (Server Component wrapper)
web/components/InteractiveHealthMapClient.tsx  — แผนที่ (Client Component จริง)
web/components/IntakeFormSection.tsx           — ฟอร์มนำเข้าข้อมูล
web/components/KpiInputSection.tsx            — ฟอร์ม KPI
web/components/AppNavigation.tsx              — Navigation หลัก
web/components/WorkSummary.tsx                — สรุปงาน
web/components/AccessRibbon.tsx               — แถบแสดงสิทธิ์
web/components/SuperadminUsersPanel.tsx        — จัดการ users (superadmin)
web/components/MapSmokeTestPanel.tsx           — Smoke test แผนที่
```

### Services
```
web/services/access-control.ts     — RBAC logic (buildAccessScope, resolveVisible*)
web/services/auth-session.ts       — Session management
web/services/dashboard-analytics.ts — ดึงข้อมูล Dashboard
web/services/kpi-calculations.ts   — คำนวณ KPI
web/services/map-boundary-service.ts — จัดการ GeoJSON boundary
web/services/health-issue-service.ts — ดึงข้อมูลโรค/ภัยสุขภาพรายอำเภอ
```

### Types
```
web/types/mvp.ts  — Types หลัก (AgencyProvinceMapRow ฯลฯ)
web/types/map.ts  — Types แผนที่
```

---

## 9. สถานะการพัฒนาตาม Phase

| Phase | สถานะ | สรุป |
|-------|--------|------|
| **0: Discovery** | ✅ เสร็จ | Requirements, Data Dictionary, Role Matrix |
| **1: Project Setup** | ✅ เสร็จ | React/Next.js, โครงสร้างโฟลเดอร์, Vercel, Supabase, .env policy |
| **2: ฐานข้อมูล** | ✅ เสร็จ | Schema, Master data, RLS MVP, agency-province mapping |
| **3: ระบบ Input** | ✅ เสร็จ (MVP) | ฟอร์ม 4 ฟิลด์, dependent dropdown, บันทึกลงฐานข้อมูลจริง |
| **4: ระบบ Process** | ✅ เสร็จเชิงโครง | KPI Engine (ตาราง/ฟังก์ชัน/วิว), ยังไม่ seed ข้อมูลตัวอย่าง |
| **5: Dashboard/Map/Report** | 🔄 กำลังทำ | Dashboard + แผนที่ Interactive 3 ระดับ + กราฟ + CSV export, ยังไม่ทำ PDF/Excel |
| **6: Alert/Forecast** | 🔄 เริ่มแล้วบางส่วน | Alert/สถานะสี, Forecast เบื้องต้น |
| **7: QA/UAT** | 🔄 เริ่มแล้วบางส่วน | Smoke test, readiness checks |
| **8: SSO/Auth** | ⏸ วางโครงไว้ | Auth model, RBAC policy, allowlist, ยังไม่เชื่อม ThaiD จริง |

### แผนที่ Interactive (Phase แยก)

| Map Phase | สถานะ | สรุป |
|-----------|--------|------|
| 1: เตรียมข้อมูล | ✅ | ตรวจ master, GeoJSON contract, boundary service |
| 2: แผนที่ 13 เขต | ✅ | Leaflet + polygon จังหวัดจริง |
| 3: จังหวัดในเขต | ✅ | คลิกเขต → กรองจังหวัด + breadcrumb |
| 4: อำเภอในจังหวัด | ✅ | Lazy load GeoJSON อำเภอ |
| 5: ข้อมูลรายอำเภอ | ✅ | ดึง intake_records + detail panel |
| 6: ผูกสิทธิ์ | ✅ | AccessScope + ปุ่มกรอกข้อมูลตาม role |
| 7: UX Polish | ✅ | Breadcrumb, loading, responsive |
| 8: QA | ✅ | Smoke test, readiness SQL |
| 9: UI/UX Refinement (v4) | ✅ | Full-width layout, side-by-side, สี 13 สี, Legend |

---

## 10. สิ่งที่ยังไม่ได้ทำ / Known Issues

### ยังไม่ได้ทำ
- ❌ Login/ThaiD SSO จริง (ยังเป็น placeholder)
- ❌ PDF/Excel export (ผู้ใช้สั่งข้ามไว้ก่อน)
- ❌ Route guard ระดับ server/middleware (ยังใช้ client redirect)
- ❌ ทดสอบ RLS ด้วย user จริงครบทุก role
- ❌ ทดสอบ KPI ด้วยข้อมูลจริง
- ❌ Playwright / automated browser test
- ❌ Search จังหวัด/อำเภอบนแผนที่

### Risks / ข้อควรระวัง
- ⚠️ อย่ารัน `npm run build` ขณะ `npm run dev` เปิดอยู่ (RSC payload mismatch)
- ⚠️ OpenStreetMap tile ต้องใช้อินเทอร์เน็ต (polygon ยังแสดงได้ แต่ base tile หาย)
- ⚠️ `npm audit` เคยแจ้ง 4 vulnerabilities (low/moderate) จาก Leaflet
- ⚠️ `min-height: 400px` ของ `.interactive-map__canvas` อาจขัดกับ `clamp(300px,...)`
- ⚠️ ห้าม commit `.env` / `.env.local` ขึ้น GitHub

---

## 11. แนวทางงานรอบถัดไป (ลำดับแนะนำ)

### ลำดับ 1: ตรวจสอบและปิดงาน Phase 4-5
1. ทดสอบ KPI ด้วยข้อมูลจริง
2. ตรวจ recompute หลัง submit ข้อมูลใหม่
3. ตรวจ forecast กับ requirement จริง
4. จัดลำดับ Dashboard ให้ตอบโจทย์ผู้บริหาร

### ลำดับ 2: Visual/Manual QA
1. เปิด `/` → ตรวจ layout แผนที่+กราฟ side-by-side
2. คลิก สคร.8 → อุดรธานี → เมืองอุดรธานี → ตรวจ detail panel
3. ตรวจ responsive (ไม่มี horizontal scroll)
4. ตรวจสี Legend ตรงกับสีบนแผนที่
5. รัน SQL: `017_phase_map_readiness_checks.sql` + `018_phase_map_smoke_test.sql`

### ลำดับ 3: Harden Auth
1. ทำ login flow จริง
2. ทำ route guard server/middleware
3. ทดสอบ role จริง: superadmin/admin/user
4. วาง ThaiD/SSO ต่อ

### ลำดับ 4: Test Automation
1. Playwright สำหรับ map click flow
2. Unit tests สำหรับ access-control
3. Data validation GeoJSON/master mapping

### ลำดับ 5: UX ต่อเนื่อง
1. แยก `MapDetailPanel.tsx`
2. เพิ่ม search จังหวัด/อำเภอ
3. เพิ่ม reset filter ที่ชัดขึ้น

### ลำดับ 6: Export
1. ทำ PDF/Excel export เมื่อผู้ใช้อนุญาต

---

## 12. ข้อกำหนดที่ต้องยึดเสมอ

- ✅ ใช้ข้อมูลจริงที่ผู้ใช้นำเข้าเอง — **ไม่ใช้ sample data**
- ✅ ห้าม commit `.env` ทุกสภาพแวดล้อม
- ✅ แยกไฟล์ตามหน้า/ส่วนงาน ชัดเจน
- ✅ แผนที่ CDN-based ต้องมีแผนรองรับเมื่อ network ไม่พร้อม
- ✅ หลังเพิ่ม dependency ต้อง restart dev server
- ✅ แก้เอกสารนี้ก่อน ลงมือพัฒนาเสมอ (Working Baseline)

---

## 13. Smoke Test Path หลัก

```
สคร.8 → อุดรธานี → เมืองอุดรธานี
DPC08 → province_code 41 → district_code 4101
```

ถ้า path นี้ทำงานได้ถูกต้องทั้ง polygon, data, และ permission → ระบบพร้อมใช้งาน

---

> **เอกสารฉบับนี้อัปเดตล่าสุด: 2 มิถุนายน 2569**
> **แหล่งอ้างอิง:** dhsd.md, implementation-plan.md (v1-v4), แผนที่กดเขตสุขภาพ.md
