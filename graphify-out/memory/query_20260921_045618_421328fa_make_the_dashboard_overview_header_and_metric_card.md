---
type: "query"
date: "2026-09-21T04:56:18.401068+00:00"
question: "Make the dashboard overview header and metric cards fit the viewport responsively"
contributor: "graphify"
outcome: "useful"
source_nodes: ["DashboardSectionView.tsx", "DashboardSectionView()"]
---

# Q: Make the dashboard overview header and metric cards fit the viewport responsively

## Answer

Expanded from graph vocabulary: [dashboard, section, view, layout, preview]. The overview had four metric cards but CSS reserved five fixed columns. Replaced the five-column rule with an auto-fit grid using a 200px responsive minimum, so four cards fill the available row and wrap automatically on smaller screens. Next.js production build passed.

## Outcome

- Signal: useful

## Source Nodes

- DashboardSectionView.tsx
- DashboardSectionView()