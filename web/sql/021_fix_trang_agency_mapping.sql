-- district_health_system_ddc: move Trang province to health region 12
-- Date: 2026-06-16

begin;

delete from public.agency_provinces
where agency_code = 'DPC11'
  and province_code = (
    select code
    from public.master_provinces
    where name_th = 'ตรัง'
  );

insert into public.agency_provinces (agency_code, province_code)
select
  'DPC12',
  p.code
from public.master_provinces p
where p.name_th = 'ตรัง'
on conflict (agency_code, province_code) do nothing;

commit;

-- Verify:
-- select
--   p.code as province_code,
--   p.name_th as province_name,
--   ap.agency_code
-- from public.master_provinces p
-- left join public.agency_provinces ap
--   on ap.province_code = p.code
-- where p.name_th = 'ตรัง';
