---
type: "query"
date: "2026-09-21T04:47:03.573215+00:00"
question: "Split DashboardSection into functional modules with every file at most 1000 lines"
contributor: "graphify"
outcome: "corrected"
correction: "A valid split must separate responsibilities and keep every resulting dashboard file at or below 1000 lines; moving all code into one large implementation file is not sufficient."
source_nodes: ["DashboardSectionImpl.tsx", "DashboardSection.tsx"]
---

# Q: Split DashboardSection into functional modules with every file at most 1000 lines

## Answer

Corrected the earlier incomplete refactor. Expanded from graph vocabulary: [dashboard, section, components, panel, record, health, kpi, map]. The dashboard is now split into base data loading, insight derivation, actions and KPI logic, shared types and formatters, saved-record UI, and the main view. The largest file is exactly 1000 lines. TypeScript and the Next.js production build both pass.

## Outcome

- Signal: corrected
- Correction: A valid split must separate responsibilities and keep every resulting dashboard file at or below 1000 lines; moving all code into one large implementation file is not sufficient.

## Source Nodes

- DashboardSectionImpl.tsx
- DashboardSection.tsx