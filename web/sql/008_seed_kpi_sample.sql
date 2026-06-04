-- district_health_system_ddc: sample seed for KPI input testing
-- Date: 2026-05-29

insert into public.kpi_inputs (
  agency_code,
  fiscal_year,
  total_issue_count,
  analyzed_district_count,
  pcho_action_district_count,
  evidence_issue_count
)
values
  ('DPC01', 2569, 100, 60, 52, 48),
  ('DPC07', 2569, 100, 45, 40, 38),
  ('DPC13', 2569, 100, 75, 68, 55)
on conflict (agency_code, fiscal_year) do update
set total_issue_count = excluded.total_issue_count,
    analyzed_district_count = excluded.analyzed_district_count,
    pcho_action_district_count = excluded.pcho_action_district_count,
    evidence_issue_count = excluded.evidence_issue_count,
    updated_at = now();

-- verify
select *
from public.v_kpi_results_dashboard
where fiscal_year = 2569
order by agency_code, kpi_code;
