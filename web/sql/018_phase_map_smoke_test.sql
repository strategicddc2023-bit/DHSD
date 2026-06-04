-- district_health_system_ddc: Phase 8 map smoke test
-- Date: 2026-06-02

-- 1) Expected readiness counts for the interactive map
select
  (select count(*) from public.master_provinces) as master_province_count,
  (select count(*) from public.master_districts) as master_district_count,
  (select count(*) from public.agency_provinces) as agency_province_mapping_count,
  (
    select count(*)
    from public.master_provinces p
    left join public.agency_provinces ap
      on ap.province_code = p.code
    where ap.province_code is null
  ) as unmapped_province_count,
  (
    select count(*)
    from (
      select province_code
      from public.agency_provinces
      group by province_code
      having count(*) > 1
    ) duplicated
  ) as duplicate_province_mapping_count;

-- 2) Main manual smoke path: สคร.8 -> อุดรธานี -> เมืองอุดรธานี
select
  ap.agency_code,
  a.label_th as agency_name,
  p.code as province_code,
  p.name_th as province_name,
  d.code as district_code,
  d.name_th as district_name
from public.master_provinces p
join public.agency_provinces ap
  on ap.province_code = p.code
join public.master_agencies a
  on a.code = ap.agency_code
join public.master_districts d
  on d.province_code = p.code
where p.code = '41'
  and d.code = '4101';

-- 3) Health issue records available for the selected district
select
  count(*) as udon_mueang_intake_record_count
from public.intake_records
where district_code = '4101';

-- 4) Role expectation examples for map-driven intake
select * from public.access_smoke_test_matrix('superadmin', null, null, 'DPC08', '41');
select * from public.access_smoke_test_matrix('admin', 'DPC08', '41', 'DPC08', '41');
select * from public.access_smoke_test_matrix('user', 'DPC08', '41', 'DPC08', '41');

