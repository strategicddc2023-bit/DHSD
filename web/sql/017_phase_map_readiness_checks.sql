-- district_health_system_ddc: Phase map readiness checks
-- Date: 2026-06-02

-- 1) Overall readiness counts
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
    ) duplicates
  ) as duplicate_province_mapping_count;

-- 2) Provinces not mapped to any health zone
select
  p.code as province_code,
  p.name_th as province_name
from public.master_provinces p
left join public.agency_provinces ap
  on ap.province_code = p.code
where ap.province_code is null
order by p.code;

-- 3) Provinces mapped to more than one health zone
select
  p.code as province_code,
  p.name_th as province_name,
  array_agg(ap.agency_code order by ap.agency_code) as mapped_agencies
from public.master_provinces p
join public.agency_provinces ap
  on ap.province_code = p.code
group by p.code, p.name_th
having count(*) > 1
order by p.code;

-- 4) Districts whose province reference is missing
select
  d.code as district_code,
  d.name_th as district_name,
  d.province_code
from public.master_districts d
left join public.master_provinces p
  on p.code = d.province_code
where p.code is null
order by d.code;

-- 5) Health-zone province counts
select
  a.code as agency_code,
  a.label_th as agency_name,
  count(ap.province_code) as province_count
from public.master_agencies a
left join public.agency_provinces ap
  on ap.agency_code = a.code
group by a.code, a.label_th
order by a.code;

