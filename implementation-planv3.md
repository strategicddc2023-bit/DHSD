# implementation-plan v3

เอกสารนี้เป็น handoff ล่าสุดสำหรับ AI/ผู้พัฒนารอบถัดไปของระบบ DHSD หลังจากพัฒนา dashboard, RBAC, และแผนที่ Interactive 3 ระดับแล้ว

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
- TypeScript strict mode

## สิ่งที่สำคัญมากก่อนทำงานต่อ

- อย่ารัน `npm run build` ขณะที่ `npm run dev` เปิดอยู่ใน browser เดิม เพราะเคยเกิดปัญหา dev/prod RSC payload mismatch
- ถ้าต้องรัน build ให้หยุด dev server ก่อน แล้วหลัง build ให้ล้าง `.next` และ restart dev server
- หลังเพิ่ม dependency ใหม่ ควร restart `npm run dev`
- หลีกเลี่ยงการแตะ `.env.local` หรือ commit secrets
- ระบบนี้ยังไม่ทำ PDF/Excel export ตามที่ผู้ใช้เคยสั่งให้ข้ามไว้ก่อน
- Flow login/ThaiD ยังข้ามไว้ ยังไม่ทำจริง

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
  - แผนที่เขตสุขภาพ
  - ข้อมูลล่าสุดจากฟอร์ม
  - KPI Summary
  - ความครอบคลุมข้อมูลตาม สคร.
  - ความครอบคลุมระดับจังหวัด
- กล่อง Access Control และกล่อง “เข้าสู่ระบบเพื่อใช้งานหลังบ้าน” ถูกเอาออกแล้ว

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
-> เห็นแผนที่ 13 เขตสุขภาพจาก polygon จังหวัดจริง
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

Manual smoke path สำคัญ:

```text
สคร.8 -> อุดรธานี -> เมืองอุดรธานี
DPC08 -> province_code 41 -> district_code 4101
```

## Phase แผนที่ที่ทำไปแล้ว

Phase 1:

- ตรวจ master province/district
- สร้าง contract GeoJSON
- เพิ่ม `map-boundary-service.ts`
- เพิ่ม `web/types/map.ts`
- เพิ่ม folder `web/public/map-boundaries`

Phase 2:

- ติดตั้ง Leaflet/React Leaflet
- สร้าง `InteractiveHealthMap`
- ใช้ polygon จังหวัดจริงแสดง 13 เขตสุขภาพ
- สลับ Dashboard มาใช้แผนที่ใหม่แทน AmCharts

Phase 3:

- คลิกเขตแล้วกรองเหลือจังหวัดในเขต
- breadcrumb และปุ่มกลับ 13 เขต

Phase 4:

- คลิกจังหวัดแล้ว lazy load อำเภอ
- แสดง polygon อำเภอ
- ปุ่มกลับสู่จังหวัดในเขต

Phase 5:

- คลิกอำเภอแล้วดึงข้อมูลจาก `intake_records`
- แสดงประเด็นโรค/ภัยสุขภาพ
- แสดงข้อมูลล่าสุด 5 รายการ
- empty/error state

Phase 6:

- ส่ง `AccessScope` เข้าแผนที่
- จำกัด polygon ตาม visible province
- ปุ่มกรอกข้อมูลอำเภอนี้ตามสิทธิ์
- map -> intake form fill agency/province/district

Phase 7:

- breadcrumb เป็นปุ่มกดถอยระดับ
- loading overlay/spinner
- responsive map/detail panel
- permission box ชัดเจน

Phase 8:

- เพิ่ม `MapSmokeTestPanel`
- เพิ่ม SQL smoke test
- เพิ่ม QA doc
- ตรวจ HTTP และ TypeScript ผ่าน

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

## Next Steps แนะนำสำหรับรอบถัดไป

1. ทำ visual/manual QA ด้วย browser จริง:
   - เปิด `/`
   - คลิก `สคร.8`
   - คลิก `อุดรธานี`
   - คลิก `เมืองอุดรธานี`
   - ตรวจ detail panel และปุ่มกรอกข้อมูล
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

