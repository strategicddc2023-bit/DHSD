-- district_health_system_ddc: Public dashboard read access
-- Date: 2026-06-04
--
-- Goal:
-- - หน้าเว็บทั่วไปต้องเห็นข้อมูล Dashboard Preview ที่ถูกกรอกแล้ว
-- - หน้า admin/superadmin ยังคงเห็น Dashboard และฟอร์มตามสิทธิ์เดิม
-- - public/anon อ่านได้อย่างเดียว ห้าม insert/update/delete

begin;

-- Master data used by public filters, maps, and labels.
grant select on public.master_agencies to anon, authenticated;
grant select on public.master_provinces to anon, authenticated;
grant select on public.master_districts to anon, authenticated;
grant select on public.agency_provinces to anon, authenticated;

-- Intake records power the latest records, map counts, and coverage metrics.
alter table if exists public.intake_records enable row level security;

drop policy if exists "dashboard_public_select_intake_records" on public.intake_records;
create policy "dashboard_public_select_intake_records"
on public.intake_records
for select
to anon
using (true);

-- Keep authenticated scoped read policy from Phase 8, but make sure table select is granted.
grant select on public.intake_records to anon, authenticated;

-- KPI summary views read from kpi_results/kpi_definitions.
alter table if exists public.kpi_results enable row level security;

drop policy if exists "dashboard_public_select_kpi_results" on public.kpi_results;
create policy "dashboard_public_select_kpi_results"
on public.kpi_results
for select
to anon
using (true);

grant select on public.kpi_definitions to anon, authenticated;
grant select on public.kpi_results to anon, authenticated;
grant select on public.v_kpi_results_dashboard to anon, authenticated;
grant select on public.v_kpi_summary_dashboard to anon, authenticated;

commit;
