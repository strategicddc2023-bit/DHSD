# Graph Report - C:\Users\piche\Documents\DHSD  (2026-06-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 236 nodes · 398 edges · 22 communities (14 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_User Access and Admin|User Access and Admin]]
- [[_COMMUNITY_Dashboard and Analytics|Dashboard and Analytics]]
- [[_COMMUNITY_Intake Forms and Maps|Intake Forms and Maps]]
- [[_COMMUNITY_Health Issue Mapping|Health Issue Mapping]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Access Control Logic|Access Control Logic]]
- [[_COMMUNITY_System Architecture and Data|System Architecture and Data]]
- [[_COMMUNITY_KPI Calculation Logic|KPI Calculation Logic]]
- [[_COMMUNITY_NPM Scripts|NPM Scripts]]
- [[_COMMUNITY_Vercel Deployment|Vercel Deployment]]
- [[_COMMUNITY_Vercel Deployment|Vercel Deployment]]
- [[_COMMUNITY_Root Layout and Metadata|Root Layout and Metadata]]
- [[_COMMUNITY_Hero UI Component|Hero UI Component]]
- [[_COMMUNITY_SSO and Auth Migration|SSO and Auth Migration]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_Project Analysis Input|Project Analysis Input]]
- [[_COMMUNITY_Monitoring and Evaluation Input|Monitoring and Evaluation Input]]
- [[_COMMUNITY_Summary and References Input|Summary and References Input]]
- [[_COMMUNITY_Discovery and Requirements Phase|Discovery and Requirements Phase]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `supabase` - 14 edges
3. `AppUserRow` - 11 edges
4. `AgencyOption` - 10 edges
5. `AccessScope` - 9 edges
6. `buildAccessScope()` - 9 edges
7. `buildAccessPermissionSnapshot()` - 6 edges
8. `loadCurrentAppUser()` - 6 edges
9. `IntakeFormData` - 6 edges
10. `scripts` - 5 edges

## Surprising Connections (you probably didn't know these)
- `O1: Interactive Map` --implements--> `Leaflet / React Leaflet`  [INFERRED]
  dhsd.md → implementation-planv3.md
- `InteractiveHealthMapClient()` --calls--> `canSubmitForOwnAgency()`  [EXTRACTED]
  web/components/InteractiveHealthMapClient.tsx → web/services/access-control.ts
- `District Health System DDC (DHSD)` --implements--> `Next.js (Frontend)`  [EXTRACTED]
  dhsd.md → implementation-plan.md
- `District Health System DDC (DHSD)` --implements--> `Supabase (Backend/DB/Auth)`  [EXTRACTED]
  dhsd.md → implementation-plan.md
- `Phase 8: SSO & Authorization` --references--> `011_phase8_auth_model.sql`  [EXTRACTED]
  implementation-plan.md → implementation-planv3.md

## Import Cycles
- None detected.

## Communities (22 total, 8 thin omitted)

### Community 0 - "User Access and Admin"
Cohesion: 0.17
Nodes (17): AdminPage(), AdminTab, HomePage(), initialFormData, AccessRibbonProps, AppNavigationProps, NavItem, KpiForm (+9 more)

### Community 1 - "Dashboard and Analytics"
Cohesion: 0.11
Nodes (23): DashboardSectionProps, fiscalYears, AgencyProvinceRow, BoundaryFeatureCollection, MapSmokeState, ProvinceRow, forecastLabel(), forecastPercent() (+15 more)

### Community 2 - "Intake Forms and Maps"
Cohesion: 0.10
Nodes (20): AgencyProvinceRow, AppUserDraft, initialDraft, AmChartsMap, AmChartsMapArea, AmChartsMapImage, DpcPoint, dpcPoints (+12 more)

### Community 3 - "Health Issue Mapping"
Cohesion: 0.11
Nodes (21): agencyPalette, DistrictFeatureLike, InteractiveHealthMapClient(), ProvinceFeatureLike, thailandCenter, DistrictHealthIssueRecord, DistrictHealthIssueSummary, loadDistrictHealthIssueSummary() (+13 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, leaflet, next, react, react-dom, react-leaflet, recharts, @supabase/supabase-js (+15 more)

### Community 5 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 6 - "Access Control Logic"
Cohesion: 0.22
Nodes (11): roleOptions, WorkSummaryProps, AccessPermissionSnapshot, AccessScope, buildAccessPermissionSnapshot(), canSubmitForOwnAgency(), canViewAgency(), canViewAll() (+3 more)

### Community 7 - "System Architecture and Data"
Cohesion: 0.18
Nodes (11): District Health System DDC (DHSD), Input Group 1: Initial Data (Area & Time), IPO Model (Input-Process-Output), O1: Interactive Map, P1: Calculation Engine (KPI & Scoring), districts/{province_code}.geojson, provinces.geojson, 001_mvp_schema.sql (+3 more)

### Community 8 - "KPI Calculation Logic"
Cohesion: 0.22
Nodes (7): buildKpiPreview(), KpiCode, KpiFormDraft, KpiPreviewRow, KpiValidationResult, parseNonNegativeInteger(), validateKpiDraft()

### Community 9 - "NPM Scripts"
Cohesion: 0.25
Nodes (7): name, private, scripts, build, dev, lint, start

### Community 10 - "Vercel Deployment"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 11 - "Vercel Deployment"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

## Knowledge Gaps
- **105 isolated node(s):** `name`, `private`, `dev`, `build`, `start` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `supabase` connect `User Access and Admin` to `Dashboard and Analytics`, `Intake Forms and Maps`, `Health Issue Mapping`, `Access Control Logic`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `AccessScope` connect `Access Control Logic` to `User Access and Admin`, `Dashboard and Analytics`, `Intake Forms and Maps`, `Health Issue Mapping`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `private`, `dev` to the rest of the system?**
  _112 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard and Analytics` be split into smaller, more focused modules?**
  _Cohesion score 0.10837438423645321 - nodes in this community are weakly interconnected._
- **Should `Intake Forms and Maps` be split into smaller, more focused modules?**
  _Cohesion score 0.09852216748768473 - nodes in this community are weakly interconnected._
- **Should `Health Issue Mapping` be split into smaller, more focused modules?**
  _Cohesion score 0.10837438423645321 - nodes in this community are weakly interconnected._
- **Should `Project Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._