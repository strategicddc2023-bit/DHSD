-- district_health_system_ddc: Phase 8 authorization model scaffolding
-- Date: 2026-06-02

begin;

-- 1) App user registry
create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  thai_d_sub text unique,
  role text not null check (role in ('superadmin', 'admin', 'user')),
  agency_code text references public.master_agencies(code) on delete set null,
  province_code text references public.master_provinces(code) on delete set null,
  district_code text references public.master_districts(code) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_users_auth_user_id on public.app_users(auth_user_id);
create index if not exists idx_app_users_role on public.app_users(role);
create index if not exists idx_app_users_status on public.app_users(status);
create index if not exists idx_app_users_agency on public.app_users(agency_code);

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

-- 2) Helper to read the current signed-in app user
create or replace function public.current_app_user()
returns public.app_users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.app_users
  where auth_user_id = auth.uid()
    and status = 'active'
  limit 1;
$$;

-- 3) Authorization helpers
create or replace function public.has_app_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
      and u.role = p_role
  );
$$;

create or replace function public.can_access_agency(p_agency_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user public.app_users;
begin
  select * into v_user
  from public.current_app_user();

  if not found then
    return false;
  end if;

  if v_user.role = 'superadmin' then
    return true;
  end if;

  if v_user.agency_code is not null and v_user.agency_code = p_agency_code then
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.can_view_agency(p_agency_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user public.app_users;
begin
  select * into v_user
  from public.current_app_user();

  if not found then
    return false;
  end if;

  if v_user.role = 'superadmin' then
    return true;
  end if;

  if v_user.agency_code is not null and v_user.agency_code = p_agency_code then
    return true;
  end if;

  if v_user.role = 'admin' and v_user.province_code is not null then
    return exists (
      select 1
      from public.agency_provinces ap
      where ap.agency_code = p_agency_code
        and ap.province_code = v_user.province_code
    );
  end if;

  return false;
end;
$$;

create or replace function public.can_access_province(p_province_code text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_user public.app_users;
begin
  select * into v_user
  from public.current_app_user();

  if not found then
    return false;
  end if;

  if v_user.role = 'superadmin' then
    return true;
  end if;

  if v_user.role = 'admin' and v_user.province_code is not null and v_user.province_code = p_province_code then
    return true;
  end if;

  if v_user.agency_code is not null then
    return exists (
      select 1
      from public.agency_provinces ap
      where ap.agency_code = v_user.agency_code
        and ap.province_code = p_province_code
    );
  end if;

  return false;
end;
$$;

create or replace function public.can_manage_self()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users u
    where u.auth_user_id = auth.uid()
      and u.status = 'active'
      and u.role in ('admin', 'user')
      and u.agency_code is not null
  );
$$;

-- 4) RLS starter policies for app_users
alter table public.app_users enable row level security;

drop policy if exists "app_users_self_select" on public.app_users;
create policy "app_users_self_select"
on public.app_users
for select
to authenticated
using (auth_user_id = auth.uid() or public.has_app_role('superadmin'));

drop policy if exists "app_users_superadmin_manage" on public.app_users;
create policy "app_users_superadmin_manage"
on public.app_users
for all
to authenticated
using (public.has_app_role('superadmin'))
with check (public.has_app_role('superadmin'));

-- 5) Notes for the next phase:
-- - superadmin: access all agencies/provinces/districts and manage allowlist.
-- - admin: access the assigned province/agency scope.
-- - user: create/update their own agency data only.
-- - Apply these helper functions to intake_records and KPI tables in the next policy pass.

commit;
