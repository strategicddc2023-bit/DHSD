# Graph Report - DHSD  (2026-09-21)

## Corpus Check
- 95 files · ~43,001 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 88 file(s) not represented in the graph (top: .geojson 80, (none) 3, .csv 3)

## Summary
- 534 nodes · 849 edges · 35 communities (26 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0888f165`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin/page.tsx
- Q: Split DashboardSection.tsx to no more than 800-1000 lines without breaking behavior
- HealthIssueDistributionMapClient.tsx
- web/package.json
- mvp.ts
- compilerOptions
- KpiInputSection.tsx
- access-control.ts
- scripts
- Rp.md — สรุปภาพรวมระบบ DHSD (District Health System DDC)
- vercel.json
- web/vercel.json
- next.config.js
- next-env.d.ts
- implementation-plan v4
- implementation-plan.md
- web/implementation-plan.md
- implementation-plan v3
- implementation-plan v3
- แผนพัฒนาแผนที่ Interactive เขตสุขภาพ -> จังหวัด -> อำเภอ
- แผนพัฒนาแผนที่ Interactive เขตสุขภาพ -> จังหวัด -> อำเภอ
- Modules Summary
- implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป)
- implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป)
- README.md
- Q: Split DashboardSection into functional modules with every file at most 1000 lines
- DashboardSectionView.tsx
- Q: Fit the full Thailand map inside the normal dashboard frame
- Q: Make the dashboard overview header and metric cards fit the viewport responsively

## God Nodes (most connected - your core abstractions)
1. `react` - 20 edges
2. `implementation-plan v4` - 17 edges
3. `compilerOptions` - 16 edges
4. `supabase` - 14 edges
5. `implementation-plan v3` - 14 edges
6. `Rp.md — สรุปภาพรวมระบบ DHSD (District Health System DDC)` - 14 edges
7. `implementation-plan v3` - 14 edges
8. `แผนพัฒนาแผนที่ Interactive เขตสุขภาพ -> จังหวัด -> อำเภอ` - 14 edges
9. `แผนพัฒนาแผนที่ Interactive เขตสุขภาพ -> จังหวัด -> อำเภอ` - 14 edges
10. `useDashboardActions()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `LoginPage()` --calls--> `loadCurrentAppUser()`  [EXTRACTED]
  web/app/login/page.tsx → web/services/auth-session.ts
- `useDashboardBase()` --calls--> `loadDistrictHealthIssueSummary()`  [EXTRACTED]
  web/components/dashboard/useDashboardBase.ts → web/services/health-issue-service.ts
- `AdminPage()` --calls--> `buildAccessScope()`  [EXTRACTED]
  web/app/admin/page.tsx → web/services/auth-session.ts
- `AdminPage()` --calls--> `loadCurrentAppUser()`  [EXTRACTED]
  web/app/admin/page.tsx → web/services/auth-session.ts
- `MyWorkPage()` --calls--> `buildAccessScope()`  [EXTRACTED]
  web/app/my-work/page.tsx → web/services/auth-session.ts

## Import Cycles
- None detected.

## Communities (35 total, 3 thin omitted)

### Community 0 - "admin/page.tsx"
Cohesion: 0.07
Nodes (51): react, AdminPage(), AdminTab, initialFormData, MENU_ITEMS, LoginPage(), initialFormData, MyWorkPage() (+43 more)

### Community 1 - "Q: Split DashboardSection.tsx to no more than 800-1000 lines without breaking behavior"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Split DashboardSection.tsx to no more than 800-1000 lines without breaking behavior, Source Nodes

### Community 2 - "HealthIssueDistributionMapClient.tsx"
Cohesion: 0.08
Nodes (35): leaflet, HealthIssueDistributionMap(), HealthIssueDistributionMapClient, HealthIssueDistributionMapProps, HealthIssueDistributionRecord, AreaIssueSummary, colorWithOpacity(), DistrictFeatureLike (+27 more)

### Community 3 - "web/package.json"
Cohesion: 0.05
Nodes (37): eslint, eslint-config-next, next, react-dom, react-leaflet, recharts, @supabase/supabase-js, @types/leaflet (+29 more)

### Community 4 - "mvp.ts"
Cohesion: 0.07
Nodes (40): AgencySubmissionProgressGroup, CoverageChartRow, DashboardInsightTab, DashboardSectionProps, donutPercentLabelFormatter(), fiscalYears, healthIssueDonutColors, HealthIssueDonutRow (+32 more)

### Community 5 - "compilerOptions"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 6 - "KpiInputSection.tsx"
Cohesion: 0.20
Nodes (13): initialForm, KpiForm, KpiInputSection(), KpiInputSectionProps, buildKpiPreview(), KpiCode, KpiFormDraft, KpiPreviewRow (+5 more)

### Community 7 - "access-control.ts"
Cohesion: 0.19
Nodes (12): evaluationStatusLabel(), evaluationStatusOptions, getRelatedLabel(), SavedRecordDraft, SavedRecordsPanel(), SavedRecordsPanelProps, AccessPermissionSnapshot, buildAccessPermissionSnapshot() (+4 more)

### Community 8 - "scripts"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, dev, lint, start

### Community 9 - "Rp.md — สรุปภาพรวมระบบ DHSD (District Health System DDC)"
Cohesion: 0.06
Nodes (34): 10. สิ่งที่ยังไม่ได้ทำ / Known Issues, 11. แนวทางงานรอบถัดไป (ลำดับแนะนำ), 12. ข้อกำหนดที่ต้องยึดเสมอ, 13. Smoke Test Path หลัก, 1. ระบบนี้คืออะไร, 2. สถาปัตยกรรมและ Tech Stack, 3.1 INPUT — ข้อมูลนำเข้า 4 กลุ่ม, 3.2 PROCESS — การประมวลผล (+26 more)

### Community 10 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 11 - "web/vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 16 - "implementation-plan v4"
Cohesion: 0.08
Nodes (24): 1. Dashboard Layout — Full-width Responsive, 2. แผนที่กับกราฟอยู่ขนานกัน (Side-by-side), 3. ลดขนาดกรอบแผนที่ + ซูมแผนที่ให้เห็นชัด, 4. ลบกล่อง "ตำแหน่งแผนที่ ประเทศไทย" (Toolbar), 5. ชุดสี Agency Palette — 13 สีแยกชัดเจน, 6. สี Legend ของแผนที่ — ตรงกับสีจริง, 7. สีอื่นๆ ที่ผู้ใช้ปรับเอง (ใน globals.css), CSS ที่ปรับเปลี่ยนในรอบนี้ (สรุป) (+16 more)

### Community 17 - "implementation-plan.md"
Cohesion: 0.11
Nodes (18): Definition of Done (ระดับโครงการ), Phase 0: Discovery และสรุปข้อกำหนด, Phase 1: Project Setup และโครงสร้างพื้นฐาน, Phase 2: ออกแบบฐานข้อมูลและความปลอดภัย, Phase 3: พัฒนาระบบ Input (ฟอร์ม 4 กลุ่ม), Phase 4: พัฒนาระบบ Process (Calculation + Integration), Phase 5: พัฒนาระบบ Output (Dashboard + รายงาน), Phase 6: Alert, Analytics และ Forecast (ต่อยอด) (+10 more)

### Community 18 - "web/implementation-plan.md"
Cohesion: 0.11
Nodes (18): Definition of Done (ระดับโครงการ), Phase 0: Discovery และสรุปข้อกำหนด, Phase 1: Project Setup และโครงสร้างพื้นฐาน, Phase 2: ออกแบบฐานข้อมูลและความปลอดภัย, Phase 3: พัฒนาระบบ Input (ฟอร์ม 4 กลุ่ม), Phase 4: พัฒนาระบบ Process (Calculation + Integration), Phase 5: พัฒนาระบบ Output (Dashboard + รายงาน), Phase 6: Alert, Analytics และ Forecast (ต่อยอด) (+10 more)

### Community 19 - "implementation-plan v3"
Cohesion: 0.13
Nodes (14): implementation-plan v3, Known Issues / Residual Risks, KPI / Dashboard, Next Steps แนะนำสำหรับรอบถัดไป, Phase แผนที่ที่ทำไปแล้ว, Public Dashboard / Backoffice, Supabase SQL ที่มีในระบบ, Tech Stack (+6 more)

### Community 20 - "implementation-plan v3"
Cohesion: 0.13
Nodes (14): implementation-plan v3, Known Issues / Residual Risks, KPI / Dashboard, Next Steps แนะนำสำหรับรอบถัดไป, Phase แผนที่ที่ทำไปแล้ว, Public Dashboard / Backoffice, Supabase SQL ที่มีในระบบ, Tech Stack (+6 more)

### Community 21 - "แผนพัฒนาแผนที่ Interactive เขตสุขภาพ -> จังหวัด -> อำเภอ"
Cohesion: 0.13
Nodes (14): Phase 1: ตรวจสอบข้อมูลและเตรียมโครงสร้างแผนที่, Phase 2: สร้างแผนที่ระดับ 13 เขตสุขภาพ, Phase 3: แสดงจังหวัดในเขตสุขภาพที่เลือก, Phase 4: แสดงอำเภอในจังหวัดที่เลือก, Phase 5: แสดงประเด็นโรค/ภัยสุขภาพรายอำเภอ, Phase 6: เชื่อมสิทธิ์และฟอร์มหลังบ้าน, Phase 7: ปรับ UI/UX ให้เป็นระดับมืออาชีพ, Phase 8: Performance, QA และความพร้อมใช้งานจริง (+6 more)

### Community 22 - "แผนพัฒนาแผนที่ Interactive เขตสุขภาพ -> จังหวัด -> อำเภอ"
Cohesion: 0.13
Nodes (14): Phase 1: ตรวจสอบข้อมูลและเตรียมโครงสร้างแผนที่, Phase 2: สร้างแผนที่ระดับ 13 เขตสุขภาพ, Phase 3: แสดงจังหวัดในเขตสุขภาพที่เลือก, Phase 4: แสดงอำเภอในจังหวัดที่เลือก, Phase 5: แสดงประเด็นโรค/ภัยสุขภาพรายอำเภอ, Phase 6: เชื่อมสิทธิ์และฟอร์มหลังบ้าน, Phase 7: ปรับ UI/UX ให้เป็นระดับมืออาชีพ, Phase 8: Performance, QA และความพร้อมใช้งานจริง (+6 more)

### Community 23 - "Modules Summary"
Cohesion: 0.25
Nodes (7): Core Abstractions จาก God Nodes, Core Modules ที่ควรระวังเมื่อพัฒนาต่อ, Modules Summary, Modules ที่มีรายละเอียดในรายงาน, Modules ที่ระบุใน Community Hubs, Thin/Omitted Modules, ภาพรวม

### Community 24 - "implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป)"
Cohesion: 0.29
Nodes (6): implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป), ข้อกำหนดที่ต้องยึดต่อเนื่อง, จุดเริ่มงานรอบถัดไป (สำหรับ AI ที่มาอ่านต่อ), สถานะ Phase ปัจจุบัน, สรุปสิ่งที่ทำไปแล้ว, แผนงานต่อจากนี้ (แนะนำลำดับ)

### Community 25 - "implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป)"
Cohesion: 0.29
Nodes (6): implementation-plan v2 (สรุปสถานะล่าสุดสำหรับใช้อ้างอิงรอบถัดไป), ข้อกำหนดที่ต้องยึดต่อเนื่อง, จุดเริ่มงานรอบถัดไป (สำหรับ AI ที่มาอ่านต่อ), สถานะ Phase ปัจจุบัน, สรุปสิ่งที่ทำไปแล้ว, แผนงานต่อจากนี้ (แนะนำลำดับ)

### Community 31 - "Q: Split DashboardSection into functional modules with every file at most 1000 lines"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Split DashboardSection into functional modules with every file at most 1000 lines, Source Nodes

### Community 32 - "DashboardSectionView.tsx"
Cohesion: 0.09
Nodes (37): evaluationStatusTooltipFormatter(), getRelatedLabel(), recordCountLabelFormatter(), recordCountTooltipFormatter(), DashboardSavedRecordsPanel(), DashboardSavedRecordsPanelProps, DashboardModel, DashboardSectionImpl() (+29 more)

### Community 33 - "Q: Fit the full Thailand map inside the normal dashboard frame"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Fit the full Thailand map inside the normal dashboard frame, Source Nodes

### Community 34 - "Q: Make the dashboard overview header and metric cards fit the viewport responsively"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Make the dashboard overview header and metric cards fit the viewport responsively, Source Nodes

## Knowledge Gaps
- **296 isolated node(s):** `name`, `private`, `dev`, `build`, `start` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 331 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `admin/page.tsx` to `DashboardSectionView.tsx`, `HealthIssueDistributionMapClient.tsx`, `web/package.json`, `mvp.ts`, `KpiInputSection.tsx`, `access-control.ts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `name`, `private`, `dev` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `admin/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07459207459207459 - nodes in this community are weakly interconnected._
- **Should `HealthIssueDistributionMapClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07632850241545894 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `mvp.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07265306122448979 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._