-- district_health_system_ddc: verify agency-province mapping coverage
-- Date: 2026-05-29

-- 1) จำนวนจังหวัดต่อหน่วยงาน
select
  a.code as agency_code,
  a.label_th as agency_name,
  count(ap.province_code) as mapped_province_count
from public.master_agencies a
left join public.agency_provinces ap
  on ap.agency_code = a.code
group by a.code, a.label_th
order by a.code;

-- 2) จังหวัดที่ยังไม่ถูกผูกกับหน่วยงานใดเลย
select
  p.code as province_code,
  p.name_th as province_name
from public.master_provinces p
left join public.agency_provinces ap
  on ap.province_code = p.code
where ap.province_code is null
order by p.code;

-- 3) หน่วยงานที่ยังไม่มีจังหวัดผูก
select
  a.code as agency_code,
  a.label_th as agency_name
from public.master_agencies a
left join public.agency_provinces ap
  on ap.agency_code = a.code
group by a.code, a.label_th
having count(ap.province_code) = 0
order by a.code;
