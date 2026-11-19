-- Normalize the DDC catalog into 37 unique issues and 44 group memberships.
-- Existing intake rows are preserved. Rows whose issue name belongs to two
-- groups remain explicitly unresolved until an administrator chooses a group.

begin;

create extension if not exists pgcrypto;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_group_unique;

-- Preserve the most permissive status before merging duplicate issue names.
with issue_status as (
  select
    name_th,
    bool_or(is_active) as is_active,
    bool_or(is_ddc_approved) as is_ddc_approved,
    min(sort_order) as sort_order
  from public.master_health_issues
  group by name_th
)
update public.master_health_issues retained
set is_active = issue_status.is_active,
    is_ddc_approved = issue_status.is_ddc_approved,
    sort_order = issue_status.sort_order
from issue_status
where retained.name_th = issue_status.name_th;

with ranked as (
  select
    id,
    row_number() over (partition by name_th order by sort_order, created_at, id) as row_number
  from public.master_health_issues
)
delete from public.master_health_issues duplicate
using ranked
where duplicate.id = ranked.id
  and ranked.row_number > 1;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_th_unique;

alter table public.master_health_issues
  add constraint master_health_issues_name_th_unique unique (name_th);

create table if not exists public.health_issue_group_memberships (
  id uuid primary key default gen_random_uuid(),
  health_issue_id uuid not null references public.master_health_issues(id) on delete cascade,
  issue_group text not null,
  source_code text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  is_ddc_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_issue_group_memberships_group_check check (issue_group in (
    'disease_health_risk',
    'context_driver',
    'royal_initiative',
    'communicable_disease',
    'noncommunicable_disease',
    'health_risk_factor',
    'occupational_environmental_disease',
    'systemic_prevention_mechanism'
  )),
  constraint health_issue_group_memberships_issue_group_unique unique (health_issue_id, issue_group),
  constraint health_issue_group_memberships_id_issue_unique unique (id, health_issue_id)
);

create index if not exists idx_health_issue_memberships_group_sort
  on public.health_issue_group_memberships(issue_group, is_active, sort_order);

drop trigger if exists trg_health_issue_memberships_updated_at on public.health_issue_group_memberships;
create trigger trg_health_issue_memberships_updated_at
before update on public.health_issue_group_memberships
for each row execute function public.set_updated_at();

-- The authoritative DDC list contains 37 unique names and 44 memberships.
insert into public.health_issue_group_memberships (
  health_issue_id,
  issue_group,
  source_code,
  sort_order,
  is_active,
  is_ddc_approved
)
select issues.id, catalog.issue_group, catalog.source_code, catalog.sort_order, true, true
from (
  values
    ('DDC-RI-001', 'การขับเคลื่อนงานโครงการเฝ้าระวัง คัดกรอง ป้องกันควบคุมโรคที่สำคัญตามโครงการพระราชดำริและภายใต้แผนปฏิบัติการโครงการราชทัณฑ์ปันสุข ทำความดี เพื่อชาติ ศาสน์ กษัตริย์', 'royal_initiative', 101),
    ('DDC-RI-001-01', 'โรคหนอนพยาธิ', 'royal_initiative', 102),
    ('DDC-RI-001-02', 'โรคพิษสุนัขบ้า', 'royal_initiative', 103),
    ('DDC-RI-001-03', 'โรคพยาธิใบไม้ในตับ (OV)', 'royal_initiative', 104),
    ('DDC-RI-001-04', 'โรคมะเร็งท่อน้ำดี (CCA)', 'royal_initiative', 105),
    ('DDC-RI-001-05', 'วัณโรค (TB)', 'royal_initiative', 106),
    ('DDC-RI-001-06', 'ไข้หวัดใหญ่', 'royal_initiative', 107),
    ('DDC-RI-001-07', 'การสร้างเสริมภูมิคุ้มกันโรคด้วยวัคซีน', 'royal_initiative', 108),
    ('DDC-RI-001-08', 'โรคติดต่อทางเพศสัมพันธ์', 'royal_initiative', 109),
    ('DDC-CD-002', 'โรคไข้เลือดออก', 'communicable_disease', 201),
    ('DDC-CD-003', 'โรคไข้มาลาเรีย', 'communicable_disease', 202),
    ('DDC-CD-004', 'โรคหนอนพยาธิ', 'communicable_disease', 203),
    ('DDC-CD-005', 'โรคพยาธิใบไม้ในตับ (OV)', 'communicable_disease', 204),
    ('DDC-CD-006', 'โรคมะเร็งท่อน้ำดี (CCA)', 'communicable_disease', 205),
    ('DDC-CD-007', 'การสร้างเสริมภูมิคุ้มกันโรคด้วยวัคซีน', 'communicable_disease', 206),
    ('DDC-CD-008', 'โรคอุบัติใหม่/โรคอุบัติซ้ำ', 'communicable_disease', 207),
    ('DDC-CD-009', 'โรคระบบทางเดินหายใจ (ไข้หวัดใหญ่ / COVID-19)', 'communicable_disease', 208),
    ('DDC-CD-010', 'โรคติดต่อทางเดินอาหารและน้ำ', 'communicable_disease', 209),
    ('DDC-CD-011', 'โรคติดต่อในเด็ก (มือ เท้า ปาก)', 'communicable_disease', 210),
    ('DDC-CD-012', 'โรคเมลิออยด์', 'communicable_disease', 211),
    ('DDC-CD-013', 'โรคเลปโตสไปโรสิส', 'communicable_disease', 212),
    ('DDC-CD-014', 'โรคพิษสุนัขบ้า', 'communicable_disease', 213),
    ('DDC-CD-015', 'โรคไวรัสตับอักเสบ ซี (HCV)', 'communicable_disease', 214),
    ('DDC-CD-016', 'โรคไวรัสตับอักเสบ บี (HBV)', 'communicable_disease', 215),
    ('DDC-CD-017', 'โรคติดต่อทางเพศสัมพันธ์', 'communicable_disease', 216),
    ('DDC-CD-018', 'โรคเรื้อน', 'communicable_disease', 217),
    ('DDC-CD-019', 'วัณโรค (TB)', 'communicable_disease', 218),
    ('DDC-CD-020', 'HIV / AIDS', 'communicable_disease', 219),
    ('DDC-NCD-021', 'โรคความดันโลหิตสูง (HT)', 'noncommunicable_disease', 301),
    ('DDC-NCD-022', 'โรคเบาหวาน (DM)', 'noncommunicable_disease', 302),
    ('DDC-NCD-023', 'โรคไต', 'noncommunicable_disease', 303),
    ('DDC-HRF-024', 'การจมน้ำ', 'health_risk_factor', 401),
    ('DDC-HRF-025', 'การบาดเจ็บจากการพลัดตกหกล้มในผู้สูงอายุ', 'health_risk_factor', 402),
    ('DDC-HRF-026', 'อุบัติเหตุทางถนน (RTI)', 'health_risk_factor', 403),
    ('DDC-HRF-027', 'การควบคุมการบริโภคยาสูบและบุหรี่ไฟฟ้า', 'health_risk_factor', 404),
    ('DDC-HRF-028', 'การควบคุมการบริโภคเครื่องดื่มแอลกอฮอล์', 'health_risk_factor', 405),
    ('DDC-OE-029', 'โรคจากฝุ่นพิษ PM2.5', 'occupational_environmental_disease', 501),
    ('DDC-OE-030', 'โรคจากตะกั่วหรือสารประกอบของตะกั่ว', 'occupational_environmental_disease', 502),
    ('DDC-OE-031', 'โรคจากฝุ่นซิลิกา', 'occupational_environmental_disease', 503),
    ('DDC-OE-032', 'โรคจากแอสเบสตอส (ใยหิน)', 'occupational_environmental_disease', 504),
    ('DDC-OE-033', 'โรคพิษสารกำจัดศัตรูพืช', 'occupational_environmental_disease', 505),
    ('DDC-OE-034', 'อุบัติภัยสารเคมี', 'occupational_environmental_disease', 506),
    ('DDC-SPM-035', 'การสร้างความรอบรู้ด้านสุขภาพในการป้องกันโรคและภัยสุขภาพ เพื่อการท่องเที่ยวปลอดภัย (เห็ดพิษ/ แมงกะพรุน ฯลฯ)', 'systemic_prevention_mechanism', 601),
    ('DDC-SPM-036', 'การป้องกันโรคในแรงงานข้ามชาติ', 'systemic_prevention_mechanism', 602)
) as catalog(source_code, name_th, issue_group, sort_order)
join public.master_health_issues issues on issues.name_th = catalog.name_th
on conflict (health_issue_id, issue_group) do update
set source_code = excluded.source_code,
    sort_order = excluded.sort_order,
    is_active = true,
    is_ddc_approved = true,
    updated_at = now();

-- Preserve every non-DDC entry as a membership instead of dropping it.
insert into public.health_issue_group_memberships (
  health_issue_id,
  issue_group,
  sort_order,
  is_active,
  is_ddc_approved
)
select issues.id, issues.issue_group, issues.sort_order, issues.is_active, issues.is_ddc_approved
from public.master_health_issues issues
on conflict (health_issue_id, issue_group) do nothing;

alter table public.intake_records
  add column if not exists health_issue_id uuid references public.master_health_issues(id) on delete restrict;

alter table public.intake_records
  add column if not exists health_issue_membership_id uuid;

alter table public.intake_records
  add column if not exists health_issue_group text;

alter table public.intake_records
  drop constraint if exists intake_records_health_issue_group_check;

alter table public.intake_records
  add constraint intake_records_health_issue_group_check
  check (health_issue_group is null or health_issue_group in (
    'disease_health_risk',
    'context_driver',
    'royal_initiative',
    'communicable_disease',
    'noncommunicable_disease',
    'health_risk_factor',
    'occupational_environmental_disease',
    'systemic_prevention_mechanism'
  ));

alter table public.intake_records
  drop constraint if exists intake_records_health_issue_membership_fk;

alter table public.intake_records
  add constraint intake_records_health_issue_membership_fk
  foreign key (health_issue_membership_id, health_issue_id)
  references public.health_issue_group_memberships(id, health_issue_id)
  on delete restrict;

update public.intake_records records
set health_issue_id = issues.id
from public.master_health_issues issues
where records.health_issue_id is null
  and issues.name_th = records.health_issue_text;

-- Resolve only names with exactly one membership. Ambiguous historical names
-- stay null so the system never invents a group that the user did not select.
with single_membership as (
  select health_issue_id, (array_agg(id order by id))[1] as membership_id, min(issue_group) as issue_group
  from public.health_issue_group_memberships
  group by health_issue_id
  having count(*) = 1
)
update public.intake_records records
set health_issue_membership_id = single_membership.membership_id,
    health_issue_group = single_membership.issue_group
from single_membership
where records.health_issue_id = single_membership.health_issue_id
  and records.health_issue_membership_id is null;

create or replace function public.sync_intake_health_issue_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_issue_id uuid;
  selected_membership_id uuid;
  selected_group text;
  selected_name text;
  membership_count integer;
begin
  if new.health_issue_membership_id is not null then
    select memberships.health_issue_id, memberships.issue_group, issues.name_th
      into selected_issue_id, selected_group, selected_name
    from public.health_issue_group_memberships memberships
    join public.master_health_issues issues on issues.id = memberships.health_issue_id
    where memberships.id = new.health_issue_membership_id;

    if selected_issue_id is null then
      raise exception 'Unknown health issue membership: %', new.health_issue_membership_id;
    end if;

    new.health_issue_id := selected_issue_id;
    new.health_issue_group := selected_group;
    new.health_issue_text := selected_name;
    return new;
  end if;

  if new.health_issue_id is null and nullif(trim(new.health_issue_text), '') is not null then
    select id, name_th into selected_issue_id, selected_name
    from public.master_health_issues
    where name_th = trim(new.health_issue_text)
    limit 1;
    new.health_issue_id := selected_issue_id;
  elsif new.health_issue_id is not null then
    select name_th into selected_name
    from public.master_health_issues
    where id = new.health_issue_id;
  end if;

  if new.health_issue_id is not null then
    new.health_issue_text := coalesce(selected_name, new.health_issue_text);

    if new.health_issue_group is not null then
      select id into selected_membership_id
      from public.health_issue_group_memberships
      where health_issue_id = new.health_issue_id
        and issue_group = new.health_issue_group
        and is_active
      limit 1;

      if selected_membership_id is null then
        raise exception 'Health issue % does not have an active membership in group %',
          new.health_issue_id, new.health_issue_group;
      end if;
    else
      select count(*), (array_agg(id order by id))[1], min(issue_group)
        into membership_count, selected_membership_id, selected_group
      from public.health_issue_group_memberships
      where health_issue_id = new.health_issue_id
        and is_active;

      if membership_count = 1 then
        new.health_issue_group := selected_group;
      else
        selected_membership_id := null;
      end if;
    end if;

    new.health_issue_membership_id := selected_membership_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_intake_health_issue_membership on public.intake_records;
create trigger trg_sync_intake_health_issue_membership
before insert or update of health_issue_text, health_issue_id, health_issue_membership_id, health_issue_group
on public.intake_records
for each row execute function public.sync_intake_health_issue_membership();

create or replace view public.v_health_issue_catalog
with (security_invoker = true)
as
select
  memberships.id,
  issues.id as issue_id,
  memberships.id as membership_id,
  issues.name_th,
  memberships.issue_group,
  memberships.is_active,
  memberships.is_ddc_approved,
  memberships.sort_order,
  memberships.source_code,
  issues.created_at,
  greatest(issues.updated_at, memberships.updated_at) as updated_at
from public.health_issue_group_memberships memberships
join public.master_health_issues issues on issues.id = memberships.health_issue_id;

alter table public.health_issue_group_memberships enable row level security;

grant select on public.health_issue_group_memberships to anon, authenticated;
grant insert, update on public.health_issue_group_memberships to authenticated;
grant select on public.v_health_issue_catalog to anon, authenticated;

drop policy if exists "dashboard_read_health_issue_memberships" on public.health_issue_group_memberships;
create policy "dashboard_read_health_issue_memberships"
on public.health_issue_group_memberships
for select
to anon, authenticated
using (true);

drop policy if exists "health_issue_memberships_admin_manage" on public.health_issue_group_memberships;
create policy "health_issue_memberships_admin_manage"
on public.health_issue_group_memberships
for all
to authenticated
using (public.has_app_role('superadmin') or public.has_app_role('admin'))
with check (public.has_app_role('superadmin') or public.has_app_role('admin'));

commit;

-- Verification after running:
-- select count(*) from master_health_issues where is_ddc_approved; -- 37 before migration 032 adds reporting-only choices
-- select count(*) from health_issue_group_memberships where is_ddc_approved; -- 44 before migration 032 adds two reporting-only choices
-- select count(*) from intake_records where health_issue_id is null; -- investigate aliases only
-- select count(*) from intake_records where health_issue_id is not null and health_issue_membership_id is null;
-- The last query is the preserved ambiguous legacy set that needs manual group selection.
