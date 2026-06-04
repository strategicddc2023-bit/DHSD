-- district_health_system_ddc: agency-province mapping for health region filtering
-- Date: 2026-05-29

create table if not exists public.agency_provinces (
  agency_code text not null references public.master_agencies(code) on delete cascade,
  province_code text not null references public.master_provinces(code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (agency_code, province_code)
);

-- MVP seed mapping for current sample provinces
insert into public.agency_provinces (agency_code, province_code)
values
  ('DPC01', '50'), -- สคร.1 -> เชียงใหม่
  ('DPC07', '40'), -- สคร.7 -> ขอนแก่น
  ('DPC11', '90'), -- สคร.11 -> สงขลา
  ('DPC12', '83'), -- สคร.12 -> ภูเก็ต
  ('DPC13', '10')  -- สคร.13 -> กรุงเทพมหานคร
on conflict (agency_code, province_code) do nothing;

create index if not exists idx_agency_provinces_agency on public.agency_provinces(agency_code);
create index if not exists idx_agency_provinces_province on public.agency_provinces(province_code);
