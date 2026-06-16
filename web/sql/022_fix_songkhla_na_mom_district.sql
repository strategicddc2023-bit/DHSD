-- district_health_system_ddc: add Na Mom district for Songkhla and fix Sadao code
-- Date: 2026-06-16

begin;

insert into public.master_districts (code, province_code, name_th)
values
  ('9010', '90', 'สะเดา'),
  ('9012', '90', 'นาหม่อม')
on conflict (code) do update
set province_code = excluded.province_code,
    name_th = excluded.name_th;

commit;

-- Verify:
-- select code, province_code, name_th
-- from public.master_districts
-- where province_code = '90'
--   and code in ('9010', '9012')
-- order by code;
