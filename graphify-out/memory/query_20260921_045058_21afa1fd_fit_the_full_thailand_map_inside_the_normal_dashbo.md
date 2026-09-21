---
type: "query"
date: "2026-09-21T04:50:58.797355+00:00"
question: "Fit the full Thailand map inside the normal dashboard frame"
contributor: "graphify"
outcome: "useful"
source_nodes: ["MapBoundsController()", "HealthIssueDistributionMapClient.tsx"]
---

# Q: Fit the full Thailand map inside the normal dashboard frame

## Answer

Expanded from graph vocabulary: [dashboard, health, issue, distribution, map, leaflet, bounds, province, district]. MapBoundsController was the relevant node. Removed the additional 0.55 zoom applied after fitBounds, invalidated the Leaflet container size before fitting, and added 12px bounds padding so the full country remains visible. Next.js production build passed.

## Outcome

- Signal: useful

## Source Nodes

- MapBoundsController()
- HealthIssueDistributionMapClient.tsx