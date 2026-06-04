-- district_health_system_ddc: enforce KPI input integrity rules
-- Date: 2026-05-29

begin;

alter table public.kpi_inputs
  drop constraint if exists chk_kpi_inputs_analyzed_le_total,
  drop constraint if exists chk_kpi_inputs_pcho_le_total,
  drop constraint if exists chk_kpi_inputs_evidence_le_total;

alter table public.kpi_inputs
  add constraint chk_kpi_inputs_analyzed_le_total
    check (analyzed_district_count <= total_issue_count),
  add constraint chk_kpi_inputs_pcho_le_total
    check (pcho_action_district_count <= total_issue_count),
  add constraint chk_kpi_inputs_evidence_le_total
    check (evidence_issue_count <= total_issue_count);

commit;
