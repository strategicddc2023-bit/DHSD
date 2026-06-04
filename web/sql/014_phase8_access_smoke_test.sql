-- district_health_system_ddc: Phase 8 access smoke test helpers
-- Date: 2026-06-02

begin;

-- Helper to verify the intended access matrix in Supabase SQL editor
-- Usage examples:
-- select * from public.access_smoke_test_matrix('superadmin', null, null, 'DPC01', '50');
-- select * from public.access_smoke_test_matrix('admin', 'DPC07', '40', 'DPC07', '40');
-- select * from public.access_smoke_test_matrix('user', 'DPC12', '83', 'DPC12', '83');
create or replace function public.access_smoke_test_matrix(
  p_role text,
  p_agency_code text,
  p_province_code text,
  p_target_agency_code text,
  p_target_province_code text
)
returns table (
  check_name text,
  expected_allowed boolean,
  explanation text
)
language sql
stable
as $$
  select * from (
    values
      (
        'view_all',
        p_role = 'superadmin',
        'superadmin only'
      ),
      (
        'view_target_agency',
        p_role = 'superadmin'
          or (p_agency_code is not null and p_agency_code = p_target_agency_code)
          or (p_role = 'admin' and p_province_code is not null and exists (
            select 1
            from public.agency_provinces ap
            where ap.agency_code = p_target_agency_code
              and ap.province_code = p_province_code
          )),
        'superadmin sees all, admin sees province scope, same-agency always allowed'
      ),
      (
        'view_target_province',
        p_role = 'superadmin'
          or (p_role = 'admin' and p_province_code is not null and p_province_code = p_target_province_code)
          or (p_agency_code is not null and exists (
            select 1
            from public.agency_provinces ap
            where ap.agency_code = p_agency_code
              and ap.province_code = p_target_province_code
          )),
        'superadmin sees all, admin sees assigned province, agency sees mapped provinces'
      ),
      (
        'submit_own_agency',
        p_role = 'superadmin'
          or (p_agency_code is not null and p_agency_code = p_target_agency_code),
        'superadmin or own agency only'
      ),
      (
        'manage_users',
        p_role = 'superadmin',
        'allowlist and role management is superadmin only'
      )
  ) as t(check_name, expected_allowed, explanation);
$$;

commit;
