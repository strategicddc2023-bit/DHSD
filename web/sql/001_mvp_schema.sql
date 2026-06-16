-- district_health_system_ddc: MVP schema for Supabase SQL Editor
-- Date: 2026-05-29

create extension if not exists pgcrypto;

-- 1) Master agencies: DPC01-DPC13
create table if not exists public.master_agencies (
  code text primary key,
  label_th text not null unique,
  created_at timestamptz not null default now()
);

insert into public.master_agencies (code, label_th)
values
  ('DPC01', 'สคร.1'),
  ('DPC02', 'สคร.2'),
  ('DPC03', 'สคร.3'),
  ('DPC04', 'สคร.4'),
  ('DPC05', 'สคร.5'),
  ('DPC06', 'สคร.6'),
  ('DPC07', 'สคร.7'),
  ('DPC08', 'สคร.8'),
  ('DPC09', 'สคร.9'),
  ('DPC10', 'สคร.10'),
  ('DPC11', 'สคร.11'),
  ('DPC12', 'สคร.12'),
  ('DPC13', 'สคร.13')
on conflict (code) do update set label_th = excluded.label_th;

-- 2) Master provinces (MVP seed, can expand to full Thailand list)
create table if not exists public.master_provinces (
  code text primary key,
  name_th text not null unique,
  created_at timestamptz not null default now()
);

insert into public.master_provinces (code, name_th)
values
  ('10', 'กรุงเทพมหานคร'),
  ('40', 'ขอนแก่น'),
  ('50', 'เชียงใหม่'),
  ('83', 'ภูเก็ต'),
  ('90', 'สงขลา')
on conflict (code) do update set name_th = excluded.name_th;

-- 3) Master districts
create table if not exists public.master_districts (
  code text primary key,
  province_code text not null references public.master_provinces(code) on delete restrict,
  name_th text not null,
  created_at timestamptz not null default now(),
  unique (province_code, name_th)
);

insert into public.master_districts (code, province_code, name_th)
values
  ('1001', '10', 'พระนคร'),
  ('1002', '10', 'ดุสิต'),
  ('1004', '10', 'บางรัก'),
  ('1007', '10', 'ปทุมวัน'),
  ('4001', '40', 'เมืองขอนแก่น'),
  ('4002', '40', 'บ้านฝาง'),
  ('4003', '40', 'พระยืน'),
  ('4004', '40', 'น้ำพอง'),
  ('5001', '50', 'เมืองเชียงใหม่'),
  ('5002', '50', 'จอมทอง'),
  ('5003', '50', 'แม่แจ่ม'),
  ('5004', '50', 'เชียงดาว'),
  ('8301', '83', 'เมืองภูเก็ต'),
  ('8302', '83', 'กะทู้'),
  ('8303', '83', 'ถลาง'),
  ('9001', '90', 'เมืองสงขลา'),
  ('9011', '90', 'หาดใหญ่'),
  ('9010', '90', 'สะเดา'),
  ('9012', '90', 'นาหม่อม'),
  ('9007', '90', 'ระโนด')
on conflict (code) do update
set province_code = excluded.province_code,
    name_th = excluded.name_th;

-- 4) Intake records (MVP)
create table if not exists public.intake_records (
  id uuid primary key default gen_random_uuid(),
  agency_code text not null references public.master_agencies(code),
  province_code text not null references public.master_provinces(code),
  district_code text not null references public.master_districts(code),
  health_issue_text text not null check (char_length(trim(health_issue_text)) >= 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_intake_records_agency on public.intake_records(agency_code);
create index if not exists idx_intake_records_province on public.intake_records(province_code);
create index if not exists idx_intake_records_district on public.intake_records(district_code);

-- 5) Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_intake_records_updated_at on public.intake_records;
create trigger trg_intake_records_updated_at
before update on public.intake_records
for each row execute function public.set_updated_at();

-- 6) View for province -> district lookup
create or replace view public.v_district_lookup as
select
  d.code as district_code,
  d.name_th as district_name_th,
  p.code as province_code,
  p.name_th as province_name_th
from public.master_districts d
join public.master_provinces p on p.code = d.province_code
order by p.name_th, d.name_th;
