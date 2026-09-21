---
type: "query"
date: "2026-09-21T05:02:40.551651+00:00"
question: "Change the overview health issue suffix from records to districts"
contributor: "graphify"
outcome: "useful"
source_nodes: ["DashboardSectionView.tsx", "useDashboardInsights.ts"]
---

# Q: Change the overview health issue suffix from records to districts

## Answer

The displayed value is districtCount, a distinct district count per health issue. Updated only the overview issue summary label from รายการ to อำเภอ; record-count labels elsewhere remain unchanged. Next.js production build passed.

## Outcome

- Signal: useful

## Source Nodes

- DashboardSectionView.tsx
- useDashboardInsights.ts