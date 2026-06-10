-- district_health_system_ddc: Allow admin/superadmin to edit and delete intake records
-- Date: 2026-06-10

begin;

alter table if exists public.intake_records enable row level security;

grant update, delete on public.intake_records to authenticated;

drop policy if exists "intake_update_by_scope" on public.intake_records;
create policy "intake_update_by_scope"
on public.intake_records
for update
to authenticated
using (
  public.has_app_role('superadmin')
  or (
    public.has_app_role('admin')
    and (
      public.can_access_agency(agency_code)
      or public.can_access_province(province_code)
    )
  )
)
with check (
  public.has_app_role('superadmin')
  or (
    public.has_app_role('admin')
    and (
      public.can_access_agency(agency_code)
      or public.can_access_province(province_code)
    )
  )
);

drop policy if exists "intake_delete_by_admin_scope" on public.intake_records;
create policy "intake_delete_by_admin_scope"
on public.intake_records
for delete
to authenticated
using (
  public.has_app_role('superadmin')
  or (
    public.has_app_role('admin')
    and (
      public.can_access_agency(agency_code)
      or public.can_access_province(province_code)
    )
  )
);

commit;
