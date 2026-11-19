-- Map confirmed legacy labels to canonical DDC memberships without losing the
-- originally submitted text. Ambiguous and non-DDC labels remain unchanged.

begin;

alter table public.intake_records
  add column if not exists health_issue_original_text text;

create table if not exists public.health_issue_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_text text not null unique,
  health_issue_membership_id uuid not null
    references public.health_issue_group_memberships(id) on delete restrict,
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_issue_aliases_text_check check (char_length(trim(alias_text)) >= 2)
);

drop trigger if exists trg_health_issue_aliases_updated_at on public.health_issue_aliases;
create trigger trg_health_issue_aliases_updated_at
before update on public.health_issue_aliases
for each row execute function public.set_updated_at();

insert into public.health_issue_aliases (alias_text, health_issue_membership_id, note)
select aliases.alias_text, memberships.id, aliases.note
from (
  values
    (
      'โรคไม่ติดต่อ (NCD)',
      'โรคไม่ติดต่อเรื้อรัง NCDs (ไม่ระบุโรค)',
      'noncommunicable_disease',
      'ชื่อเดิมของตัวเลือก NCDs ที่ไม่ระบุโรค'
    ),
    (
      'วัณโรค',
      'วัณโรค (TB)',
      'communicable_disease',
      'เติมชื่อย่อ TB และกำหนดเป็นกลุ่มโรคติดต่อ'
    ),
    (
      'พยาธิใบไม้ในตับ (OV)',
      'โรคพยาธิใบไม้ในตับ (OV)',
      'communicable_disease',
      'เติมคำนำหน้าชื่อมาตรฐาน'
    ),
    (
      'หนอนพยาธิ',
      'โรคหนอนพยาธิ',
      'communicable_disease',
      'เติมคำนำหน้าชื่อมาตรฐาน'
    ),
    (
      'สร้างเสริมภูมิคุ้มกันโรค',
      'การสร้างเสริมภูมิคุ้มกันโรคด้วยวัคซีน',
      'communicable_disease',
      'ขยายชื่อเดิมเป็นชื่อมาตรฐาน'
    )
) as aliases(alias_text, canonical_name, issue_group, note)
join public.master_health_issues issues
  on issues.name_th = aliases.canonical_name
join public.health_issue_group_memberships memberships
  on memberships.health_issue_id = issues.id
 and memberships.issue_group = aliases.issue_group
on conflict (alias_text) do update
set health_issue_membership_id = excluded.health_issue_membership_id,
    note = excluded.note,
    is_active = true,
    updated_at = now();

-- The intake trigger will also enforce canonical text/id/group consistency.
update public.intake_records records
set health_issue_original_text = coalesce(records.health_issue_original_text, records.health_issue_text),
    health_issue_id = memberships.health_issue_id,
    health_issue_membership_id = memberships.id,
    health_issue_group = memberships.issue_group,
    health_issue_text = issues.name_th
from public.health_issue_aliases aliases
join public.health_issue_group_memberships memberships
  on memberships.id = aliases.health_issue_membership_id
join public.master_health_issues issues
  on issues.id = memberships.health_issue_id
where aliases.is_active
  and trim(records.health_issue_text) = aliases.alias_text;

alter table public.health_issue_aliases enable row level security;

grant select on public.health_issue_aliases to anon, authenticated;
grant insert, update on public.health_issue_aliases to authenticated;

drop policy if exists "dashboard_read_health_issue_aliases" on public.health_issue_aliases;
create policy "dashboard_read_health_issue_aliases"
on public.health_issue_aliases
for select
to anon, authenticated
using (true);

drop policy if exists "health_issue_aliases_admin_manage" on public.health_issue_aliases;
create policy "health_issue_aliases_admin_manage"
on public.health_issue_aliases
for all
to authenticated
using (public.has_app_role('superadmin') or public.has_app_role('admin'))
with check (public.has_app_role('superadmin') or public.has_app_role('admin'));

commit;

-- Verification after running:
-- select count(*) from health_issue_aliases where is_active; -- 5
-- select count(*) from intake_records where health_issue_original_text is not null; -- expected 306 for the reviewed CSV
-- select count(*) from intake_records where health_issue_membership_id is null; -- unresolved/non-DDC rows remain for review
