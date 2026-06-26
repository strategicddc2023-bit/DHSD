-- district_health_system_ddc: Dashboard RLS recovery after enabling RLS on all tables
-- Purpose:
-- - Restore read-only dashboard data for anon/authenticated users.
-- - Keep writes scoped through existing RBAC helper functions.
-- - Make dashboard views use caller permissions via security_invoker where supported.

begin;

-- 1) Master and mapping tables used by DashboardSection / IntakeFormSection.
alter table if exists public.master_agencies enable row level security;
alter table if exists public.master_provinces enable row level security;
alter table if exists public.master_districts enable row level security;
alter table if exists public.agency_provinces enable row level security;

grant select on public.master_agencies to anon, authenticated;
grant select on public.master_provinces to anon, authenticated;
grant select on public.master_districts to anon, authenticated;
grant select on public.agency_provinces to anon, authenticated;

drop policy if exists "dashboard_read_master_agencies" on public.master_agencies;
create policy "dashboard_read_master_agencies"
on public.master_agencies
for select
to anon, authenticated
using (true);

drop policy if exists "dashboard_read_master_provinces" on public.master_provinces;
create policy "dashboard_read_master_provinces"
on public.master_provinces
for select
to anon, authenticated
using (true);

drop policy if exists "dashboard_read_master_districts" on public.master_districts;
create policy "dashboard_read_master_districts"
on public.master_districts
for select
to anon, authenticated
using (true);

drop policy if exists "dashboard_read_agency_provinces" on public.agency_provinces;
create policy "dashboard_read_agency_provinces"
on public.agency_provinces
for select
to anon, authenticated
using (true);

-- 2) app_users is needed only for logged-in scope detection.
alter table if exists public.app_users enable row level security;
grant select on public.app_users to authenticated;

drop policy if exists "app_users_self_or_superadmin_select" on public.app_users;
create policy "app_users_self_or_superadmin_select"
on public.app_users
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or public.has_app_role('superadmin')
);

-- 3) Intake records power dashboard counts, coverage, latest rows, map panels.
alter table if exists public.intake_records enable row level security;
grant select on public.intake_records to anon, authenticated;
grant insert, update on public.intake_records to authenticated;

drop policy if exists "dashboard_public_select_intake_records" on public.intake_records;
create policy "dashboard_public_select_intake_records"
on public.intake_records
for select
to anon
using (true);

drop policy if exists "intake_select_by_scope" on public.intake_records;
create policy "intake_select_by_scope"
on public.intake_records
for select
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_access_province(province_code)
  or public.can_view_agency(agency_code)
);

drop policy if exists "intake_insert_by_scope" on public.intake_records;
create policy "intake_insert_by_scope"
on public.intake_records
for insert
to authenticated
with check (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
);

drop policy if exists "intake_update_by_scope" on public.intake_records;
create policy "intake_update_by_scope"
on public.intake_records
for update
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
)
with check (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
);

-- 4) KPI dashboard data.
alter table if exists public.kpi_definitions enable row level security;
alter table if exists public.kpi_inputs enable row level security;
alter table if exists public.kpi_results enable row level security;

grant select on public.kpi_definitions to anon, authenticated;
grant select on public.kpi_inputs to authenticated;
grant select on public.kpi_results to anon, authenticated;
grant insert, update on public.kpi_inputs to authenticated;
grant insert, update on public.kpi_results to authenticated;

drop policy if exists "dashboard_read_kpi_definitions" on public.kpi_definitions;
create policy "dashboard_read_kpi_definitions"
on public.kpi_definitions
for select
to anon, authenticated
using (true);

drop policy if exists "dashboard_public_select_kpi_results" on public.kpi_results;
create policy "dashboard_public_select_kpi_results"
on public.kpi_results
for select
to anon
using (true);

drop policy if exists "kpi_results_select_by_scope" on public.kpi_results;
create policy "kpi_results_select_by_scope"
on public.kpi_results
for select
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_view_agency(agency_code)
);

drop policy if exists "kpi_inputs_select_by_scope" on public.kpi_inputs;
create policy "kpi_inputs_select_by_scope"
on public.kpi_inputs
for select
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_view_agency(agency_code)
);

drop policy if exists "kpi_inputs_insert_by_scope" on public.kpi_inputs;
create policy "kpi_inputs_insert_by_scope"
on public.kpi_inputs
for insert
to authenticated
with check (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
);

drop policy if exists "kpi_inputs_update_by_scope" on public.kpi_inputs;
create policy "kpi_inputs_update_by_scope"
on public.kpi_inputs
for update
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
)
with check (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
);

drop policy if exists "kpi_results_write_by_scope" on public.kpi_results;
create policy "kpi_results_write_by_scope"
on public.kpi_results
for insert
to authenticated
with check (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
);

drop policy if exists "kpi_results_update_by_scope" on public.kpi_results;
create policy "kpi_results_update_by_scope"
on public.kpi_results
for update
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
)
with check (
  public.has_app_role('superadmin')
  or public.can_access_agency(agency_code)
);

-- 5) Views used by dashboard and district lookup.
-- Supabase/Postgres 15+: security_invoker makes views obey caller/base-table RLS.
alter view if exists public.v_district_lookup set (security_invoker = true);
alter view if exists public.v_kpi_results_dashboard set (security_invoker = true);
alter view if exists public.v_kpi_summary_dashboard set (security_invoker = true);

grant select on public.v_district_lookup to anon, authenticated;
grant select on public.v_kpi_results_dashboard to anon, authenticated;
grant select on public.v_kpi_summary_dashboard to anon, authenticated;

commit;