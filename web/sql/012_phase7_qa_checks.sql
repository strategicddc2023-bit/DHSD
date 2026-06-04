-- district_health_system_ddc: Phase 7 QA/UAT validation queries
-- Date: 2026-06-02

-- 1) Verify master counts
select
  (select count(*) from public.master_agencies) as agency_count,
  (select count(*) from public.master_provinces) as province_count,
  (select count(*) from public.master_districts) as district_count,
  (select count(*) from public.agency_provinces) as agency_province_mapping_count;

-- 2) Provinces not mapped to any agency
select
  p.code as province_code,
  p.name_th as province_name
from public.master_provinces p
left join public.agency_provinces ap
  on ap.province_code = p.code
where ap.province_code is null
order by p.code;

-- 3) Districts without valid province mapping
select
  d.code as district_code,
  d.name_th as district_name,
  d.province_code
from public.master_districts d
left join public.master_provinces p
  on p.code = d.province_code
where p.code is null
order by d.code;

-- 4) Intake records with missing references
select
  i.id,
  i.agency_code,
  i.province_code,
  i.district_code
from public.intake_records i
left join public.master_agencies a on a.code = i.agency_code
left join public.master_provinces p on p.code = i.province_code
left join public.master_districts d on d.code = i.district_code
where a.code is null
   or p.code is null
   or d.code is null;

-- 5) KPI inputs that should not exist if validation is active
select
  agency_code,
  fiscal_year,
  total_issue_count,
  analyzed_district_count,
  pcho_action_district_count,
  evidence_issue_count
from public.kpi_inputs
where analyzed_district_count > total_issue_count
   or pcho_action_district_count > total_issue_count
   or evidence_issue_count > total_issue_count;

-- 6) KPI results without matching definition
select
  r.agency_code,
  r.fiscal_year,
  r.kpi_code
from public.kpi_results r
left join public.kpi_definitions d
  on d.kpi_code = r.kpi_code
where d.kpi_code is null;

-- 7) App users not yet active
select
  u.auth_user_id,
  u.thai_d_sub,
  u.role,
  u.status
from public.app_users u
where u.status <> 'active'
order by u.created_at desc;

