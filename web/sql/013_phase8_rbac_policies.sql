-- district_health_system_ddc: Phase 8 RBAC policies for app_users scopes
-- Date: 2026-06-02

begin;

-- Enable RLS on transactional tables
alter table if exists public.intake_records enable row level security;
alter table if exists public.kpi_inputs enable row level security;
alter table if exists public.kpi_results enable row level security;

-- Cleanup older MVP policies
drop policy if exists "mvp_select_intake_records" on public.intake_records;
drop policy if exists "mvp_insert_intake_records" on public.intake_records;

-- 1) intake_records policies
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

-- 2) kpi_inputs policies
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

-- 3) kpi_results policies
drop policy if exists "kpi_results_select_by_scope" on public.kpi_results;
create policy "kpi_results_select_by_scope"
on public.kpi_results
for select
to authenticated
using (
  public.has_app_role('superadmin')
  or public.can_view_agency(agency_code)
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

-- 4) dashboard views remain readable for authenticated users who can access the underlying tables
-- Note: if a query needs broader access, use a dedicated aggregated table later.

commit;
