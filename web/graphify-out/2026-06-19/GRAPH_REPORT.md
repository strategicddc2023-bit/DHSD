# Graph Report - C:\Users\piche\Documents\DHSD\web  (2026-06-19)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 251 nodes · 404 edges · 26 communities (17 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 1.0)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_User Access Management|User Access Management]]
- [[_COMMUNITY_Health Map Visualization|Health Map Visualization]]
- [[_COMMUNITY_Access Permissions|Access Permissions]]
- [[_COMMUNITY_Dashboard Analytics|Dashboard Analytics]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_KPI Calculations|KPI Calculations]]
- [[_COMMUNITY_Thailand Health Zone Map|Thailand Health Zone Map]]
- [[_COMMUNITY_Testing and QA|Testing and QA]]
- [[_COMMUNITY_Vercel Configuration|Vercel Configuration]]
- [[_COMMUNITY_Data Schema and Logic|Data Schema and Logic]]
- [[_COMMUNITY_QA Processes|QA Processes]]
- [[_COMMUNITY_Project Overview|Project Overview]]
- [[_COMMUNITY_Development Requirements|Development Requirements]]
- [[_COMMUNITY_Layout and Metadata|Layout and Metadata]]
- [[_COMMUNITY_Project Configuration|Project Configuration]]
- [[_COMMUNITY_Map Data & README|Map Data & README]]
- [[_COMMUNITY_UI Rules|UI Rules]]
- [[_COMMUNITY_Health Map KPI Plan|Health Map KPI Plan]]
- [[_COMMUNITY_Issues & Risks|Issues & Risks]]
- [[_COMMUNITY_Login Implementation|Login Implementation]]
- [[_COMMUNITY_Security Threats|Security Threats]]
- [[_COMMUNITY_District Health System DDC|District Health System DDC]]

## God Nodes (most connected - your core abstractions)
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

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `buildAccessScope()`  [EXTRACTED]
  app/admin/page.tsx → services/auth-session.ts
- `MyWorkPage()` --calls--> `buildAccessScope()`  [EXTRACTED]
  app/my-work/page.tsx → services/auth-session.ts
- `HomePage()` --calls--> `buildAccessScope()`  [EXTRACTED]
  app/page.tsx → services/auth-session.ts
- `SuperadminPage()` --calls--> `buildAccessScope()`  [EXTRACTED]
  app/superadmin/page.tsx → services/auth-session.ts
- `Favicon SVG` --shares_data_with--> `Map Boundaries README`  [INFERRED]
  public/favicon.svg → public/map-boundaries/README.md

## Import Cycles
- None detected.

## Communities (26 total, 9 thin omitted)

### Community 0 - "User Access Management"
Cohesion: 0.12
Nodes (23): AdminPage(), AdminTab, MENU_ITEMS, HomePage(), AccessRibbonProps, AppNavigationProps, NavItem, AgencyProvinceRow (+15 more)

### Community 1 - "Health Map Visualization"
Cohesion: 0.09
Nodes (20): agencyPalette, DistrictFeatureLike, ProvinceFeatureLike, thailandCenter, DistrictHealthIssueRecord, DistrictHealthIssueSummary, loadDistrictHealthIssueSummary(), fetchGeoJson() (+12 more)

### Community 2 - "Access Permissions"
Cohesion: 0.11
Nodes (22): SavedRecordDraft, AppUserDraft, initialDraft, WorkSummaryProps, AccessPermissionSnapshot, AccessScope, buildAccessPermissionSnapshot(), canSubmitForOwnAgency() (+14 more)

### Community 3 - "Dashboard Analytics"
Cohesion: 0.10
Nodes (26): AgencySubmissionProgressGroup, CoverageChartRow, DashboardSectionProps, fiscalYears, healthIssueDonutColors, HealthIssueDonutRow, ProvinceHealthIssueRecord, ProvinceSubmissionProgress (+18 more)

### Community 4 - "Project Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, leaflet, next, react, react-dom, react-leaflet, recharts, @supabase/supabase-js (+15 more)

### Community 5 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (22): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+14 more)

### Community 6 - "KPI Calculations"
Cohesion: 0.18
Nodes (9): initialFormData, KpiForm, buildKpiPreview(), KpiCode, KpiFormDraft, KpiPreviewRow, KpiValidationResult, parseNonNegativeInteger() (+1 more)

### Community 7 - "Thailand Health Zone Map"
Cohesion: 0.15
Nodes (9): AmChartsMap, AmChartsMapArea, AmChartsMapImage, DpcPoint, dpcPoints, Window, AgencyCoverageRow, AgencyProvinceMapRow (+1 more)

### Community 8 - "Testing and QA"
Cohesion: 0.22
Nodes (9): Next Steps, Visual/Manual QA, SQL Testing, Role-Based Testing, Security Hardening, Test/QA Automation, User Experience Improvements, KPI/Forecast Testing (+1 more)

### Community 9 - "Vercel Configuration"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, outputDirectory

### Community 10 - "Data Schema and Logic"
Cohesion: 0.50
Nodes (4): Expected Output Schema, Input Data Schema, Mathematical Logic, Objective

### Community 11 - "QA Processes"
Cohesion: 0.67
Nodes (3): Automated Testing, Testing and Quality Assurance, Manual Testing

### Community 12 - "Project Overview"
Cohesion: 0.67
Nodes (3): Overview, Project Goals, Scope of Work

### Community 13 - "Development Requirements"
Cohesion: 0.67
Nodes (3): Technical Requirements, Frontend Development, Backend Development

## Knowledge Gaps
- **107 isolated node(s):** `AdminTab`, `MENU_ITEMS`, `metadata`, `initialFormData`, `UserTab` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AccessScope` connect `Access Permissions` to `User Access Management`, `Health Map Visualization`, `Dashboard Analytics`, `KPI Calculations`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `supabase` connect `User Access Management` to `Health Map Visualization`, `Access Permissions`, `Dashboard Analytics`, `KPI Calculations`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `AdminTab`, `MENU_ITEMS`, `metadata` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `User Access Management` be split into smaller, more focused modules?**
  _Cohesion score 0.11605937921727395 - nodes in this community are weakly interconnected._
- **Should `Health Map Visualization` be split into smaller, more focused modules?**
  _Cohesion score 0.09475806451612903 - nodes in this community are weakly interconnected._
- **Should `Access Permissions` be split into smaller, more focused modules?**
  _Cohesion score 0.10967741935483871 - nodes in this community are weakly interconnected._
- **Should `Dashboard Analytics` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._