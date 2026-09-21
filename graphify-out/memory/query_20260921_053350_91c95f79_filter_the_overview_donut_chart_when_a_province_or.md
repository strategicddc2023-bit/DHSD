---
type: "query"
date: "2026-09-21T05:33:50.521676+00:00"
question: "Filter the overview donut chart when a province or district is selected on the map"
contributor: "graphify"
outcome: "useful"
source_nodes: ["useDashboardInsights.ts", "DashboardSectionView.tsx", "HealthIssueDistributionMapClient.tsx"]
---

# Q: Filter the overview donut chart when a province or district is selected on the map

## Answer

The donut data now filters healthIssueScopeRecords by selectedOverviewMapProvinceCode and selectedOverviewMapDistrictCode, then recomputes unique district counts and percentages for that scope. Issue colors stay stable using the national ranking. The donut heading shows the selected province or district, and clearing the map selection restores national data. Production build passed.

## Outcome

- Signal: useful

## Source Nodes

- useDashboardInsights.ts
- DashboardSectionView.tsx
- HealthIssueDistributionMapClient.tsx