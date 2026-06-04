# implementation-plan v4

เอกสารนี้เป็น handoff ล่าสุดหลังจากปรับปรุง UI/UX ของ Dashboard Preview, แผนที่ Interactive, ชุดสี, และ Responsive layout ทั้งหมด สร้างจาก v3 + งานที่ทำเพิ่มในรอบนี้

## สถานะภาพรวมล่าสุด

ระบบปัจจุบันเป็น Next.js/React app ใน `web/` เชื่อม Supabase โดยมีโครงหลักดังนี้:

- Public Dashboard สำหรับดูภาพรวมโดยไม่ login
- Backoffice สำหรับ `superadmin`, `admin`, `user`
- RBAC เบื้องต้นผ่านตาราง `app_users`
- หน้า `/login`
- หน้า `/my-work` สำหรับ admin/user
- หน้า `/smoke-test` สำหรับ superadmin ตรวจสิทธิ์และแผนที่
- แผนที่ Interactive จริงแบบ 3 ระดับ:
  - 13 เขตสุขภาพ
  - จังหวัดในเขต
  - อำเภอในจังหวัด
  - detail panel ประเด็นโรค/ภัยสุขภาพรายอำเภอ

## Tech Stack

- Next.js `15.5.18`
- React `19.1.0`
- Supabase JS `2.106.2`
- Leaflet `1.9.4`
- React Leaflet `5.0.0`
- Recharts (BarChart, ResponsiveContainer, Cell)
- TypeScript strict mode

## สิ่งที่สำคัญมากก่อนทำงานต่อ

- อย่ารัน `npm run build` ขณะที่ `npm run dev` เปิดอยู่ใน browser เดิม เพราะเคยเกิดปัญหา dev/prod RSC payload mismatch
- ถ้าต้องรัน build ให้หยุด dev server ก่อน แล้วหลัง build ให้ล้าง `.next` และ restart dev server
- หลังเพิ่ม dependency ใหม่ ควร restart `npm run dev`
- หลีกเลี่ยงการแตะ `.env.local` หรือ commit secrets
- ระบบนี้ยังไม่ทำ PDF/Excel export ตามที่ผู้ใช้เคยสั่งให้ข้ามไว้ก่อน
- Flow login/ThaiD ยังข้ามไว้ ยังไม่ทำจริง

---

## สิ่งที่ปรับปรุงใน v4 (รอบปัจจุบัน)

### 1. Dashboard Layout — Full-width Responsive

**ปัญหาเดิม:** Dashboard ถูกจำกัดความกว้างที่ `max-width: 1100px` ทำให้แผนที่และกราฟดูแคบบนจอใหญ่

**สิ่งที่แก้:**

- ขยาย `.content-wrap` จาก `max-width: 1100px` → `max-width: 1440px`
- ปรับ `.dashboard-grid` ให้ใช้สัดส่วน `minmax(280px, 1fr) minmax(0, 2.5fr)` เพื่อให้แผนที่อยู่ฝั่งซ้าย (เล็กกว่า) และกราฟอยู่ฝั่งขวา (ใหญ่กว่า)
- ปรับ summary cards ให้ใช้ `auto-fit` กับ `minmax(200px, 1fr)`
- เพิ่ม `overflow-x: hidden; width: 100%;` ที่ `html, body` เพื่อป้องกัน horizontal scroll บนมือถือ

**ไฟล์ที่แก้:**

```text
web/app/globals.css (lines: content-wrap, dashboard-grid, html/body)
```

### 2. แผนที่กับกราฟอยู่ขนานกัน (Side-by-side)

**ปัญหาเดิม:** แผนที่ถูกย้ายไปอยู่ด้านบนแยกจากกราฟ (full-width) ทำให้ไม่ตรงกับ layout ที่ผู้ใช้ต้องการ

**สิ่งที่แก้:**

- นำ `<article className="panel panel--map">` (แผนที่) และ `<article className="panel">` (กราฟ BarChart) กลับเข้าไปอยู่ใน `<div className="dashboard-grid">` ร่วมกัน
- Desktop: แผนที่อยู่ซ้าย กราฟอยู่ขวา (สัดส่วน 1:2.5)
- Mobile (≤1200px): ตกลงมาเรียงแถวเดียว (`grid-template-columns: 1fr`)

**ไฟล์ที่แก้:**

```text
web/components/DashboardSection.tsx (lines ~399-467)
web/app/globals.css (.dashboard-grid)
```

### 3. ลดขนาดกรอบแผนที่ + ซูมแผนที่ให้เห็นชัด

**ปัญหาเดิม:** กรอบแผนที่สูงเกินไป (480-720px) และแผนที่ประเทศไทยซูมไม่ชิดขอบ

**สิ่งที่แก้:**

- `.interactive-map__canvas` ปรับจาก `height: clamp(480px, 50vw, 720px)` → `height: clamp(400px, 45vw, 550px)` (ผู้ใช้ปรับเพิ่มเป็น `clamp(300px, 45vw, 400px)`)
- Responsive (≤1200px): `height: clamp(380px, 50vw, 500px)`
- `fitBounds` padding ลดจาก `[18, 18]` → `[4, 4]` เพื่อให้แผนที่ซูมเต็มตา

**ไฟล์ที่แก้:**

```text
web/app/globals.css (.interactive-map__canvas, @media max-width:1200px)
web/components/InteractiveHealthMapClient.tsx (MapBoundsController fitBounds padding)
```

### 4. ลบกล่อง "ตำแหน่งแผนที่ ประเทศไทย" (Toolbar)

**ปัญหาเดิม:** กล่องแสดงตำแหน่งแผนที่ด้านบนซ้ำซ้อนกับ breadcrumb ด้านล่าง

**สิ่งที่แก้:**

- ลบ `<div className="interactive-map__toolbar">` ทั้งกล่องออก (รวมข้อความตำแหน่ง + ปุ่ม "กลับสู่จังหวัดในเขต" / "กลับสู่ 13 เขต")
- ผู้ใช้ยังสามารถใช้ breadcrumb buttons ด้านล่างแผนที่ (เช่น "13 เขตสุขภาพ", "จังหวัดในเขต") ในการถอยกลับได้เหมือนเดิม

**ไฟล์ที่แก้:**

```text
web/components/InteractiveHealthMapClient.tsx (lines ~321-345 เดิม ถูกลบออก)
```

### 5. ชุดสี Agency Palette — 13 สีแยกชัดเจน

**ปัญหาเดิม:** สีของเขตสุขภาพบางสีใกล้เคียงกัน (เช่น สีฟ้าหลายโทน, สีเขียวหลายโทน) ทำให้แยกแยะบนแผนที่ยาก

**สิ่งที่แก้:**

ปรับ `agencyPalette` ใน `InteractiveHealthMapClient.tsx` เป็น 13 สีที่แตกต่างกันอย่างชัดเจน:

```typescript
const agencyPalette = [
  "#FF3B30", // Red
  "#FF9500", // Orange
  "#FFCC00", // Yellow
  "#4CD964", // Green
  "#5AC8FA", // Light Blue
  "#007AFF", // Blue
  "#5856D6", // Purple
  "#FF2D55", // Pink
  "#009688", // Teal
  "#795548", // Brown
  "#12d67bff", // Bright Green (ผู้ใช้ปรับเอง)
  "#E91E63", // Deep Pink
  "#8BC34A", // Lime Green
];
```

**ไฟล์ที่แก้:**

```text
web/components/InteractiveHealthMapClient.tsx (agencyPalette array)
```

### 6. สี Legend ของแผนที่ — ตรงกับสีจริง

**ปัญหาเดิม:** สัญลักษณ์อธิบาย (Legend) ด้านล่างแผนที่ไม่ตรงกับสีที่ใช้แสดงบนแผนที่จริง

**สิ่งที่แก้:**

- **เขตสุขภาพ** (`.interactive-map__swatch--zone`): เปลี่ยนจากสีเดี่ยวเป็น `conic-gradient()` ที่รวม 13 สีของ agencyPalette ทั้งหมดเป็นวงล้อสี
- **เขตที่เลือก** (`.interactive-map__swatch--selected`): `#ff039a` (ชมพูเข้ม)
- **จังหวัด/อำเภอที่เลือก** (`.interactive-map__swatch--province`): `#03a7f3` (ฟ้า) — ผู้ใช้สลับสีเอง
- **อำเภอ** (`.interactive-map__swatch--district`): `#f97316` (ส้ม) — ผู้ใช้สลับสีเอง
- เปลี่ยนข้อความ Legend จาก "จังหวัดที่เลือก" → "จังหวัด/อำเภอที่เลือก" เพื่อไม่ให้สับสน

**สี fillColor บนแผนที่ (JS):**

```text
เขตที่เลือก (คลิกเขต): #ff039a
จังหวัด/อำเภอที่เลือก (คลิกจังหวัดหรืออำเภอ): #f97316
อำเภอทั้งหมดในจังหวัด: #03a7f3
```

**ไฟล์ที่แก้:**

```text
web/app/globals.css (.interactive-map__swatch--zone, --selected, --province, --district)
web/components/InteractiveHealthMapClient.tsx (fillColor logic + legend text)
```

### 7. สีอื่นๆ ที่ผู้ใช้ปรับเอง (ใน globals.css)

ผู้ใช้ได้แก้ไขสีต่างๆ ด้วยตนเองในระหว่างการพัฒนา:

```text
.th-map-legend: color #38566f → #2773b1
.interactive-map__canvas background gradient: rgba(20,184,166) → rgba(3,231,205)
.interactive-map__swatch--zone: #0891b2 → conic-gradient(13 สี)
.interactive-map__swatch--selected: → #ff039a
.interactive-map__swatch--province: → #03a7f3
.interactive-map__swatch--district: → #f97316
.interactive-map__detail-icon: #0f766e → #039488
.interactive-map__permission-box border: rgba(20,184,166,0.22) → rgba(23,236,119,0.74)
.interactive-map__permission-box span color: #115e59 → #07857c
.interactive-map__issue-item border: rgba(14,116,144,0.12) → rgba(11,15,233,0.973)
.interactive-map__issue-item strong color: #0f766e → #1808f1
.interactive-map__empty border: rgba(14,116,144) → rgba(59,10,240)
.interactive-map__status border: rgba(14,116,144) → rgba(19,198,248)
```

---

## Supabase SQL ที่มีในระบบ

รันตามลำดับโดยรวม:

```text
web/sql/001_mvp_schema.sql
web/sql/002_mvp_rls_policies.sql
web/sql/003_agency_province_mapping.sql
web/sql/004_seed_all_provinces_districts.sql
web/sql/005_full_agency_province_mapping.sql
web/sql/006_verify_agency_province_mapping.sql
web/sql/007_phase4_kpi_engine.sql
web/sql/010_kpi_input_validation_constraints.sql
web/sql/011_phase8_auth_model.sql
web/sql/013_phase8_rbac_policies.sql
web/sql/014_phase8_access_smoke_test.sql
web/sql/015_phase8_bootstrap_superadmin.sql
web/sql/016_fix_udon_thani_agency_mapping.sql
web/sql/017_phase_map_readiness_checks.sql
web/sql/018_phase_map_smoke_test.sql
```

หมายเหตุ:

- `008_seed_kpi_sample.sql` เป็น sample data ไม่ควรรันถ้าต้องการใช้ข้อมูลจริงเท่านั้น
- `009_reset_sample_data.sql` เป็นไฟล์ reset sample ระวังการใช้งาน
- `015_phase8_bootstrap_superadmin.sql` bootstrap superadmin UUID:
  - `b86f6f01-819a-4118-881e-33d27b3121ba`
  - email ที่ผู้ใช้สร้างไว้ใน Supabase Auth: `strategic.ddc2023@gmail.com`
- `016_fix_udon_thani_agency_mapping.sql` เติม `อุดรธานี` เข้า `DPC08`
- `017_phase_map_readiness_checks.sql` ตรวจ readiness ฐานข้อมูลสำหรับแผนที่
- `018_phase_map_smoke_test.sql` ตรวจ smoke test แผนที่ใน Supabase SQL Editor

ค่าที่ควรได้จาก readiness/smoke:

```text
master_province_count = 77
master_district_count = 928
agency_province_mapping_count = 77
unmapped_province_count = 0
duplicate_province_mapping_count = 0
อุดรธานี province_code 41 -> DPC08
เมืองอุดรธานี district_code 4101
```

## ระบบสิทธิ์ปัจจุบัน

Role หลัก:

```text
superadmin
- เห็นทุกอย่าง
- เข้า dashboard เต็ม
- จัดการ users/allowlist ได้
- กรอกข้อมูลได้ทุก agency ตาม helper ปัจจุบัน

admin
- เห็นข้อมูลตาม scope ของตัวเอง
- กรอกข้อมูลหน่วยงานตัวเอง
- เข้า /my-work

user
- เห็น/กรอกข้อมูลเฉพาะหน่วยงานหรือ scope ตัวเอง
- เข้า /my-work

guest/public
- เห็น public dashboard
- ไม่เห็นปุ่มกรอกข้อมูลในแผนที่
```

ไฟล์สิทธิ์สำคัญ:

```text
web/services/access-control.ts
web/services/auth-session.ts
web/components/AccessRibbon.tsx
web/components/AccessDeniedPanel.tsx
web/components/SuperadminUsersPanel.tsx
web/components/AccessSmokeTestPanel.tsx
web/app/smoke-test/page.tsx
web/app/my-work/page.tsx
```

หมายเหตุเชิงระบบ:

- `buildAccessScope(currentUser)` คืน `AccessScope | null`
- Dashboard ใช้ `resolveVisibleAgencyCodes` และ `resolveVisibleProvinceCodes`
- แผนที่รับ `accessScope` เพื่อแสดง/ซ่อนปุ่มกรอกข้อมูลรายอำเภอ
- `canSubmitForOwnAgency` ใช้ควบคุมปุ่ม `กรอกข้อมูลอำเภอนี้`

## Public Dashboard / Backoffice

หน้า public `/`:

- มี hero และ dashboard preview
- ผู้ใช้ทั่วไปดู:
  - Dashboard Preview
  - Forecast เบื้องต้น
  - แผนที่เขตสุขภาพ (ฝั่งซ้าย) + กราฟความครอบคลุม (ฝั่งขวา) อยู่แถวเดียวกัน
  - ข้อมูลล่าสุดจากฟอร์ม
  - KPI Summary
  - ความครอบคลุมข้อมูลตาม สคร.
  - ความครอบคลุมระดับจังหวัด
- กล่อง Access Control และกล่อง "เข้าสู่ระบบเพื่อใช้งานหลังบ้าน" ถูกเอาออกแล้ว

หน้า `/my-work`:

- สำหรับ admin/user
- มี `WorkSummary`
- มี `IntakeFormSection`
- มี `KpiInputSection`
- มี Dashboard ใน backoffice mode

หน้า `/login`:

- เป็น card login ง่าย ๆ ตามตัวอย่างผู้ใช้
- ยังไม่ทำ flow login/ThaiD จริงเต็มระบบ

## แผนที่ Interactive 3 ระดับ

เอกสารหลัก:

```text
แผนที่กดเขตสุขภาพ.md
phase-map/phase-1-map-readiness.md
phase-map/phase-8-map-qa.md
```

แหล่งข้อมูล boundary:

- ใช้ `piyayut-ch/mapthai`
- Source ระบุว่า data มาจาก UNOCHA / Royal Thai Survey Department update 6 November 2019 และ simplify ด้วย mapshaper
- Source URL: `https://github.com/piyayut-ch/mapthai`

ไฟล์ boundary ในระบบ:

```text
web/public/map-boundaries/provinces.source.geojson
web/public/map-boundaries/districts.source.geojson
web/public/map-boundaries/provinces.geojson
web/public/map-boundaries/districts/{province_code}.geojson
web/public/map-boundaries/README.md
```

ผลตรวจ boundary:

```text
province_features = 77
district_files = 77
district_features = 928
```

GeoJSON contract:

```json
{
  "province_code": "41",
  "province_name": "อุดรธานี"
}
```

```json
{
  "district_code": "4101",
  "district_name": "เมืองอุดรธานี",
  "province_code": "41"
}
```

ไฟล์แผนที่สำคัญ:

```text
web/components/InteractiveHealthMap.tsx
web/components/InteractiveHealthMapClient.tsx
web/services/map-boundary-service.ts
web/services/health-issue-service.ts
web/types/map.ts
web/components/MapSmokeTestPanel.tsx
```

Flow แผนที่ปัจจุบัน:

```text
เปิด Dashboard
-> เห็นแผนที่ 13 เขตสุขภาพจาก polygon จังหวัดจริง (ฝั่งซ้ายของ dashboard-grid)
-> คลิก สคร.
-> กรองเหลือจังหวัดในเขตนั้น
-> คลิกจังหวัด
-> lazy load districts/{province_code}.geojson
-> แสดง polygon อำเภอ
-> คลิกอำเภอ
-> ดึง intake_records ตาม district_code
-> แสดง detail panel ประเด็นโรค/ภัยสุขภาพ
-> ถ้ามีสิทธิ์ แสดงปุ่ม กรอกข้อมูลอำเภอนี้
-> กดแล้วเติม agency/province/district ลงฟอร์มหลังบ้าน
```

สีที่ใช้บนแผนที่ปัจจุบัน:

```text
เขตสุขภาพ 13 เขต: ใช้ agencyPalette (13 สีแตกต่าง)
เขตที่ถูกคลิกเลือก: #ff039a (ชมพูเข้ม)
จังหวัดที่ถูกคลิกเลือก: #f97316 (ส้ม)
อำเภอทั้งหมดในจังหวัด (default): #03a7f3 (ฟ้า)
อำเภอที่ถูกคลิกเลือก: #f97316 (ส้ม)
fitBounds padding: [4, 4] (ซูมชิดขอบ)
```

Manual smoke path สำคัญ:

```text
สคร.8 -> อุดรธานี -> เมืองอุดรธานี
DPC08 -> province_code 41 -> district_code 4101
```

## Phase แผนที่ที่ทำไปแล้ว

Phase 1-8: (เหมือน v3 ไม่มีการเปลี่ยนแปลง)

Phase 9 (v4 — UI/UX Refinement):

- ปรับ Dashboard Preview เป็น full-width responsive (max-width 1440px)
- แผนที่ + กราฟอยู่ขนานกัน (side-by-side) ในสัดส่วน 1:2.5
- ลดความสูงกรอบแผนที่ + ซูมแผนที่ชิดขอบ
- ลบกล่อง toolbar "ตำแหน่งแผนที่"
- เปลี่ยนชุดสี agencyPalette เป็น 13 สีแยกชัด
- ปรับสี Legend ให้ตรงกับสีจริงบนแผนที่
- ปรับ Legend ใช้ conic-gradient สำหรับ "เขตสุขภาพ"
- เปลี่ยนข้อความ Legend "จังหวัดที่เลือก" → "จังหวัด/อำเภอที่เลือก"
- เพิ่ม overflow-x: hidden ป้องกัน horizontal scroll มือถือ

## Dashboard Grid Layout ปัจจุบัน

```text
Desktop (>1200px):
┌──────────────────────────────────────────────────────┐
│ Dashboard Preview                                     │
├──────────────┬───────────────────────────────────────-┤
│  แผนที่       │  กราฟ BarChart ความครอบคลุม สคร.       │
│  (1fr ~280px) │  (2.5fr)                               │
├──────────────┴───────────────────────────────────────-┤
│ Summary Cards / Metrics / Table                       │
└──────────────────────────────────────────────────────-┘

Mobile (≤1200px):
┌───────────────────────┐
│  แผนที่ (full-width)   │
├───────────────────────┤
│  กราฟ (full-width)    │
├───────────────────────┤
│  Summary / Metrics    │
└───────────────────────┘
```

## KPI / Dashboard

ไฟล์สำคัญ:

```text
web/components/DashboardSection.tsx
web/services/dashboard-analytics.ts
web/services/kpi-calculations.ts
web/components/KpiInputSection.tsx
web/sql/007_phase4_kpi_engine.sql
web/sql/010_kpi_input_validation_constraints.sql
```

มีแล้ว:

- KPI Summary
- Forecast เบื้องต้น
- Alert/status สี
- Readiness panel
- CSV export
- filter สคร./จังหวัด
- dashboard data scope ตาม role

ยังควรตรวจเพิ่ม:

- ทดสอบ KPI ด้วยข้อมูลจริง
- ตรวจ recompute หลัง submit ข้อมูลใหม่
- ตรวจค่า forecast กับ requirement จริง

## ไฟล์สำคัญใน frontend

```text
web/app/page.tsx
web/app/my-work/page.tsx
web/app/login/page.tsx
web/app/smoke-test/page.tsx
web/app/layout.tsx
web/app/globals.css
web/components/AppNavigation.tsx
web/components/HeroSection.tsx
web/components/DashboardSection.tsx
web/components/IntakeFormSection.tsx
web/components/KpiInputSection.tsx
web/components/InteractiveHealthMap.tsx
web/components/InteractiveHealthMapClient.tsx
web/components/MapSmokeTestPanel.tsx
web/components/WorkSummary.tsx
web/components/SuperadminUsersPanel.tsx
```

## CSS ที่ปรับเปลี่ยนในรอบนี้ (สรุป)

```text
globals.css:
  html, body        → เพิ่ม overflow-x: hidden; width: 100%
  .content-wrap      → max-width: 1440px (จาก 1100px)
  .dashboard-grid    → grid-template-columns: minmax(280px, 1fr) minmax(0, 2.5fr)
  .interactive-map__canvas → height: clamp(300px, 45vw, 400px), min-height: 400px
  .interactive-map__swatch--zone → conic-gradient(13 สี)
  .interactive-map__swatch--selected → #ff039a
  .interactive-map__swatch--province → #03a7f3 (ผู้ใช้สลับเอง)
  .interactive-map__swatch--district → #f97316 (ผู้ใช้สลับเอง)
  @media (max-width: 1200px) → dashboard-grid: 1fr, canvas: clamp(380px, 50vw, 500px)
  + สีอื่นๆ ที่ผู้ใช้ปรับเอง (ดูรายละเอียดในหัวข้อ "สีอื่นๆ ที่ผู้ใช้ปรับเอง")
```

## การทดสอบล่าสุดที่ผ่าน

คำสั่งที่ผ่านล่าสุด:

```powershell
cd web
npx tsc --noEmit
npm ls leaflet react-leaflet @types/leaflet
```

HTTP checks ที่ผ่าน:

```text
http://localhost:3000 -> 200
http://localhost:3000/my-work -> 200
http://localhost:3000/smoke-test -> 200
http://localhost:3000/map-boundaries/provinces.geojson -> 200
http://localhost:3000/map-boundaries/districts/41.geojson -> 200
```

Boundary checks ที่ผ่าน:

```text
province_features=77
district_files=77
district_features=928
```

## Known Issues / Residual Risks

- Login/ThaiD ยังไม่ทำจริง
- Page-level protection ยังพึ่ง client redirect เป็นหลัก ควรทำ server/middleware guard ในอนาคต
- RLS ต้องทดสอบด้วย user จริงครบ superadmin/admin/user
- OpenStreetMap tile ต้องใช้อินเทอร์เน็ต ถ้า network ล่ม แผนที่ base tile อาจไม่แสดง แต่ polygon ยังอยู่
- ยังไม่ได้ทำ PDF/Excel export
- `npm audit` เคยแจ้ง 4 vulnerabilities ระดับ low/moderate หลังติดตั้ง Leaflet ควร audit ต่อในรอบ hardened security
- ถ้า browser เจอ RSC mismatch ให้ restart dev server และ hard refresh เนื่องจากเคยมี dev/prod cache mismatch
- `min-height: 400px` ของ `.interactive-map__canvas` อาจขัดกับ `height: clamp(300px,...)` — ถ้าต้องการให้แผนที่เล็กกว่า 400px ต้องปรับ min-height ด้วย

## Next Steps แนะนำสำหรับรอบถัดไป

1. ทำ visual/manual QA ด้วย browser จริง:
   - เปิด `/`
   - ตรวจ layout แผนที่+กราฟ side-by-side บนจอคอม
   - ตรวจ responsive บนมือถือ (ไม่มี horizontal scroll)
   - คลิก `สคร.8`
   - คลิก `อุดรธานี`
   - คลิก `เมืองอุดรธานี`
   - ตรวจ detail panel และปุ่มกรอกข้อมูล
   - ตรวจสี Legend ตรงกับสีบนแผนที่
2. รัน SQL:
   - `web/sql/017_phase_map_readiness_checks.sql`
   - `web/sql/018_phase_map_smoke_test.sql`
3. ทดสอบ role จริง:
   - superadmin เห็นทุกอย่าง
   - admin เห็น scope ตัวเอง
   - user กรอกได้เฉพาะหน่วยงานตัวเอง
4. Harden auth:
   - ทำ login flow จริง
   - ทำ ThaiD/SSO ภายหลัง
   - ทำ route guard ที่แน่นกว่า client redirect
5. เพิ่ม test/QA automation:
   - Playwright หรือ browser smoke test สำหรับ map click flow
   - unit tests สำหรับ `access-control`
   - data validation สำหรับ GeoJSON/master mapping
6. ปรับ UX ต่อ:
   - detail panel อาจแยกเป็น component `MapDetailPanel.tsx`
   - เพิ่ม search จังหวัด/อำเภอ
   - เพิ่ม reset filter ที่ชัดขึ้น
7. ตรวจ KPI/Forecast ด้วยข้อมูลจริง
8. ทำ export ตาม requirement ใหม่เมื่อผู้ใช้อนุญาตให้กลับมาทำ PDF/Excel
