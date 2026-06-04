-- district_health_system_ddc: fix missing Udon Thani health-zone mapping
-- Date: 2026-06-02

begin;

insert into public.agency_provinces (agency_code, province_code)
select
  'DPC08',
  p.code
from public.master_provinces p
where p.name_th = 'อุดรธานี'
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
-- where p.name_th = 'อุดรธานี';
