-- Master list for health issue / disease topics used by intake forms.
-- Run this in Supabase SQL Editor after 024_intake_evaluation_status.sql.

begin;

create extension if not exists pgcrypto;

create table if not exists public.master_health_issues (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  issue_group text not null default 'disease_health_risk',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_health_issues_name_th_trim_check check (char_length(trim(name_th)) >= 3),
  constraint master_health_issues_name_th_unique unique (name_th),
  constraint master_health_issues_group_check check (issue_group in ('disease_health_risk', 'context_driver'))
);

alter table public.master_health_issues
  add column if not exists issue_group text not null default 'disease_health_risk';

alter table public.master_health_issues
  drop constraint if exists master_health_issues_group_check;

alter table public.master_health_issues
  add constraint master_health_issues_group_check
  check (issue_group in ('disease_health_risk', 'context_driver'));

create index if not exists idx_master_health_issues_group_active_sort
  on public.master_health_issues(issue_group, is_active, sort_order, name_th);

create index if not exists idx_master_health_issues_active_sort
  on public.master_health_issues(is_active, sort_order, name_th);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_master_health_issues_updated_at on public.master_health_issues;
create trigger trg_master_health_issues_updated_at
before update on public.master_health_issues
for each row execute function public.set_updated_at();

insert into public.master_health_issues (name_th, issue_group, sort_order)
values
  ('โรคไม่ติดต่อ (NCD)', 'disease_health_risk', 10),
  ('อุบัติเหตุทางถนน (RTI)', 'disease_health_risk', 20),
  ('โรคไต', 'disease_health_risk', 30),
  ('โรคไข้เลือดออก', 'disease_health_risk', 40),
  ('สุขภาพหนึ่งเดียว (One Health)', 'disease_health_risk', 50),
  ('โรคไข้มาลาเรีย', 'disease_health_risk', 60),
  ('วัณโรค (TB)', 'disease_health_risk', 70),
  ('ควบคุมการบริโภคยาสูบ', 'disease_health_risk', 80),
  ('ควบคุมการบริโภคเครื่องดื่มแอลกอฮอล์', 'disease_health_risk', 90),
  ('Car Seat Bank', 'disease_health_risk', 100),
  ('โรคหนอนพยาธิ', 'disease_health_risk', 110),
  ('พยาธิใบไม้ในตับและมะเร็งท่อน้ำดี (OV/CCA)', 'disease_health_risk', 120),
  ('พยาธิใบไม้ในตับ (OV)', 'disease_health_risk', 130),
  ('มะเร็งท่อน้ำดี (CCA)', 'disease_health_risk', 140),
  ('สร้างเสริมภูมิคุ้มกันโรค', 'disease_health_risk', 150),
  ('โรคอุบัติใหม่/โรคอุบัติซ้ำ', 'disease_health_risk', 160),
  ('โรคติดต่อทางเดินอาหารและน้ำ', 'disease_health_risk', 170),
  ('โรคติดต่อในเด็ก', 'disease_health_risk', 180),
  ('โรคเมลิออยด์', 'disease_health_risk', 190),
  ('โรคเลปโตสไปโรสิส', 'disease_health_risk', 200),
  ('โรคเรื้อน', 'disease_health_risk', 210),
  ('โรคไวรัสตับอักเสบ (HCV/HBV)', 'disease_health_risk', 220),
  ('ป้องกันการจมน้ำ', 'disease_health_risk', 230),
  ('ป้องกันการบาดเจ็บพลัดตกหกล้มในผู้สูงอายุ', 'disease_health_risk', 240),
  ('การสร้างเสริมความรอบรู้สุขภาพการป้องกันโรคและภัยสุขภาพ', 'disease_health_risk', 250),
  ('ฝุ่นพิษ PM2.5', 'disease_health_risk', 260),
  ('ผู้สูงอายุ', 'context_driver', 1010),
  ('สุขภาพจิต', 'context_driver', 1020),
  ('ยาเสพติด', 'context_driver', 1030),
  ('สิ่งแวดล้อม (ขยะ)', 'context_driver', 1040),
  ('กลุ่มเปราะบาง', 'context_driver', 1050),
  ('อนามัยแม่และเด็ก', 'context_driver', 1060),
  ('อนามัยเจริญพันธ์', 'context_driver', 1070)
on conflict (name_th) do update
set issue_group = excluded.issue_group,
    sort_order = excluded.sort_order,
    is_active = true;

-- Retire older default seed values that are not part of the approved grouped list.
update public.master_health_issues
set is_active = false
where name_th in (
  'วัณโรค',
  'โรคเบาหวาน',
  'โรคติดต่อทางอาหารและน้ำ',
  'โรคพิษสุนัขบ้า'
);

alter table public.master_health_issues enable row level security;

grant select on public.master_health_issues to anon, authenticated;
grant insert, update on public.master_health_issues to authenticated;

drop policy if exists "dashboard_read_master_health_issues" on public.master_health_issues;
create policy "dashboard_read_master_health_issues"
on public.master_health_issues
for select
to anon, authenticated
using (true);

drop policy if exists "master_health_issues_admin_manage" on public.master_health_issues;
create policy "master_health_issues_admin_manage"
on public.master_health_issues
for all
to authenticated
using (public.has_app_role('superadmin') or public.has_app_role('admin'))
with check (public.has_app_role('superadmin') or public.has_app_role('admin'));

commit;