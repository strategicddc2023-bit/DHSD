-- district_health_system_ddc: MVP RLS policies
-- Date: 2026-05-29

-- Enable RLS on target table
alter table if exists public.intake_records enable row level security;

-- For current MVP (no auth enforcement yet): allow read and insert for anon/authenticated
-- IMPORTANT: tighten these policies when RBAC phase starts.

drop policy if exists "mvp_select_intake_records" on public.intake_records;
create policy "mvp_select_intake_records"
on public.intake_records
for select
to anon, authenticated
using (true);

drop policy if exists "mvp_insert_intake_records" on public.intake_records;
create policy "mvp_insert_intake_records"
on public.intake_records
for insert
to anon, authenticated
with check (true);

-- Optional: keep update/delete blocked for now (no policy created)
