-- Separate the 37 primary DDC issues from the 26 reporting targets.
-- Reporting-only options remain selectable but do not increase the primary total.

begin;

alter table public.master_health_issues
  add column if not exists is_primary_issue boolean not null default false;

alter table public.health_issue_group_memberships
  add column if not exists is_reporting_target boolean not null default false;

-- The canonical catalog from migration 031 contains the 37 primary issues.
update public.master_health_issues issues
set is_primary_issue = exists (
  select 1
  from public.health_issue_group_memberships memberships
  where memberships.health_issue_id = issues.id
    and memberships.is_ddc_approved
    and memberships.source_code like 'DDC-%'
    and memberships.source_code not like 'DDC-REPORT-%'
);

-- These two names are valid reporting choices, but are not additional primary
-- issues in the denominator of 37.
insert into public.master_health_issues (
  name_th,
  issue_group,
  sort_order,
  is_active,
  is_ddc_approved,
  is_primary_issue
)
values
  (
    'โรคจากการประกอบอาชีพ/สิ่งแวดล้อม (ไม่ระบุโรค)',
    'occupational_environmental_disease',
    507,
    true,
    true,
    false
  ),
  (
    'โรคไม่ติดต่อเรื้อรัง NCDs (ไม่ระบุโรค)',
    'noncommunicable_disease',
    304,
    true,
    true,
    false
  )
on conflict (name_th) do update
set is_active = true,
    is_ddc_approved = true,
    is_primary_issue = false,
    updated_at = now();

insert into public.health_issue_group_memberships (
  health_issue_id,
  issue_group,
  source_code,
  sort_order,
  is_active,
  is_ddc_approved,
  is_reporting_target
)
select
  issues.id,
  reporting.issue_group,
  reporting.source_code,
  reporting.sort_order,
  true,
  true,
  true
from (
  values
    (
      'DDC-REPORT-025',
      'โรคจากการประกอบอาชีพ/สิ่งแวดล้อม (ไม่ระบุโรค)',
      'occupational_environmental_disease',
      507
    ),
    (
      'DDC-REPORT-026',
      'โรคไม่ติดต่อเรื้อรัง NCDs (ไม่ระบุโรค)',
      'noncommunicable_disease',
      304
    )
) as reporting(source_code, name_th, issue_group, sort_order)
join public.master_health_issues issues on issues.name_th = reporting.name_th
on conflict (health_issue_id, issue_group) do update
set source_code = excluded.source_code,
    sort_order = excluded.sort_order,
    is_active = true,
    is_ddc_approved = true,
    is_reporting_target = true,
    updated_at = now();

-- Reset first so the list is authoritative and repeatable.
update public.health_issue_group_memberships
set is_reporting_target = false;

update public.health_issue_group_memberships memberships
set is_reporting_target = true,
    updated_at = now()
from public.master_health_issues issues,
(
  values
    ('communicable_disease', 'โรคไข้เลือดออก'),
    ('communicable_disease', 'โรคไข้มาลาเรีย'),
    ('communicable_disease', 'โรคหนอนพยาธิ'),
    ('communicable_disease', 'โรคพยาธิใบไม้ในตับ (OV)'),
    ('communicable_disease', 'โรคมะเร็งท่อน้ำดี (CCA)'),
    ('communicable_disease', 'การสร้างเสริมภูมิคุ้มกันโรคด้วยวัคซีน'),
    ('communicable_disease', 'โรคอุบัติใหม่/โรคอุบัติซ้ำ'),
    ('communicable_disease', 'โรคติดต่อทางเดินอาหารและน้ำ'),
    ('communicable_disease', 'โรคเลปโตสไปโรสิส'),
    ('communicable_disease', 'โรคพิษสุนัขบ้า'),
    ('communicable_disease', 'วัณโรค (TB)'),
    ('noncommunicable_disease', 'โรคความดันโลหิตสูง (HT)'),
    ('noncommunicable_disease', 'โรคเบาหวาน (DM)'),
    ('noncommunicable_disease', 'โรคไต'),
    ('health_risk_factor', 'การจมน้ำ'),
    ('health_risk_factor', 'การบาดเจ็บจากการพลัดตกหกล้มในผู้สูงอายุ'),
    ('health_risk_factor', 'อุบัติเหตุทางถนน (RTI)'),
    ('health_risk_factor', 'การควบคุมการบริโภคยาสูบและบุหรี่ไฟฟ้า'),
    ('health_risk_factor', 'การควบคุมการบริโภคเครื่องดื่มแอลกอฮอล์'),
    ('occupational_environmental_disease', 'โรคจากฝุ่นพิษ PM2.5'),
    ('occupational_environmental_disease', 'โรคจากตะกั่วหรือสารประกอบของตะกั่ว'),
    ('occupational_environmental_disease', 'โรคพิษสารกำจัดศัตรูพืช'),
    ('occupational_environmental_disease', 'อุบัติภัยสารเคมี'),
    (
      'systemic_prevention_mechanism',
      'การสร้างความรอบรู้ด้านสุขภาพในการป้องกันโรคและภัยสุขภาพ เพื่อการท่องเที่ยวปลอดภัย (เห็ดพิษ/ แมงกะพรุน ฯลฯ)'
    ),
    ('occupational_environmental_disease', 'โรคจากการประกอบอาชีพ/สิ่งแวดล้อม (ไม่ระบุโรค)'),
    ('noncommunicable_disease', 'โรคไม่ติดต่อเรื้อรัง NCDs (ไม่ระบุโรค)')
) as reporting(issue_group, name_th)
where memberships.health_issue_id = issues.id
  and memberships.issue_group = reporting.issue_group
  and issues.name_th = reporting.name_th;

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
  greatest(issues.updated_at, memberships.updated_at) as updated_at,
  issues.is_primary_issue,
  memberships.is_reporting_target
from public.health_issue_group_memberships memberships
join public.master_health_issues issues on issues.id = memberships.health_issue_id;

grant select on public.v_health_issue_catalog to anon, authenticated;

commit;

-- Verification after running:
-- select count(*) from master_health_issues where is_primary_issue; -- 37
-- select count(*) from health_issue_group_memberships where is_reporting_target; -- 26
-- select round(26 * 100.0 / 37, 2); -- 70.27
