# Modules Summary

สรุปจาก `web/graphify-out/GRAPH_REPORT.md` วันที่ 2026-06-19

## ภาพรวม

- จำนวนโหนดทั้งหมด: 251 nodes
- จำนวนความเชื่อมโยงทั้งหมด: 404 edges
- จำนวนโมดูล/communities ทั้งหมด: 26 modules
- รายงานระบุว่าแสดง 17 communities และละเว้น thin communities 9 รายการ
- ในหัวข้อ `Communities` มีรายละเอียดที่แสดงจริง 14 modules คือ Community 0-13
- ในหัวข้อ `Community Hubs (Navigation)` มีชื่อโมดูลที่ระบุไว้ 23 modules

หมายเหตุ: ตัวเลขในรายงานมีความต่างกันระหว่าง `Summary`, `Community Hubs`, และ `Communities` ดังนั้นตัวเลขหลักที่ควรยึดคือ 26 modules ตาม `Summary` และหัวข้อ `Communities (26 total, 9 thin omitted)`

## Modules ที่มีรายละเอียดในรายงาน

| # | Module | Cohesion | จำนวน Nodes | บทบาทโดยย่อ |
|---|---|---:|---:|---|
| 0 | User Access Management | 0.12 | 23 | จัดการหน้า/สิทธิ์ผู้ใช้ เมนู และ navigation ตาม role |
| 1 | Health Map Visualization | 0.09 | 20 | แผนที่สุขภาพ, GeoJSON, summary รายพื้นที่ |
| 2 | Access Permissions | 0.11 | 22 | permission snapshot, access scope, เงื่อนไขการดู/บันทึกข้อมูล |
| 3 | Dashboard Analytics | 0.10 | 26 | dashboard, chart, coverage, province/district progress |
| 4 | Project Dependencies | 0.08 | 23 | dependency หลัก เช่น Next, React, Supabase, Recharts, Leaflet |
| 5 | TypeScript Configuration | 0.09 | 22 | config TypeScript และ compiler options |
| 6 | KPI Calculations | 0.18 | 9 | ฟอร์ม KPI, preview, validation และ calculation logic |
| 7 | Thailand Health Zone Map | 0.15 | 9 | แผนที่เขตสุขภาพ, DPC points, agency-province map |
| 8 | Testing and QA | 0.22 | 9 | manual QA, SQL testing, role-based testing, security hardening |
| 9 | Vercel Configuration | 0.40 | 4 | config deployment/build บน Vercel |
| 10 | Data Schema and Logic | 0.50 | 4 | schema input/output และ mathematical logic |
| 11 | QA Processes | 0.67 | 3 | automated/manual testing process |
| 12 | Project Overview | 0.67 | 3 | overview, goals, scope of work |
| 13 | Development Requirements | 0.67 | 3 | technical requirements, frontend/backend development |

## Modules ที่ระบุใน Community Hubs

1. User Access Management
2. Health Map Visualization
3. Access Permissions
4. Dashboard Analytics
5. Project Dependencies
6. TypeScript Configuration
7. KPI Calculations
8. Thailand Health Zone Map
9. Testing and QA
10. Vercel Configuration
11. Data Schema and Logic
12. QA Processes
13. Project Overview
14. Development Requirements
15. Layout and Metadata
16. Project Configuration
17. Map Data & README
18. UI Rules
19. Health Map KPI Plan
20. Issues & Risks
21. Login Implementation
22. Security Threats
23. District Health System DDC

## Thin/Omitted Modules

รายงานระบุว่ามี thin communities ที่ถูกละเว้น 9 modules เพราะมีขนาดเล็กมากหรือมีความเชื่อมโยงน้อยกว่า 3 nodes

## Core Modules ที่ควรระวังเมื่อพัฒนาต่อ

- User Access Management
- Access Permissions
- Dashboard Analytics
- Health Map Visualization
- KPI Calculations
- Thailand Health Zone Map

## Core Abstractions จาก God Nodes

1. `compilerOptions` - 16 edges
2. `supabase` - 13 edges
3. `AppUserRow` - 12 edges
4. `AgencyOption` - 10 edges
5. `AccessScope` - 9 edges
6. `buildAccessScope()` - 9 edges
7. `IntakeFormData` - 7 edges
8. `loadCurrentAppUser()` - 6 edges
9. `scripts` - 5 edges
10. `buildAccessPermissionSnapshot()` - 5 edges