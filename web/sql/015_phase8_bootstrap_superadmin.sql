-- district_health_system_ddc: Phase 8 bootstrap for app_users + superadmin
-- Date: 2026-06-02

begin;

-- Create the allowlist table if Phase 8 auth model has not been applied yet.
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

alter table public.app_users enable row level security;

-- Bootstrap the first superadmin user.
insert into public.app_users (
  auth_user_id,
  thai_d_sub,
  role,
  agency_code,
  province_code,
  district_code,
  status
)
values (
  'b86f6f01-819a-4118-881e-33d27b3121ba',
  'THAID-SUPERADMIN-001',
  'superadmin',
  null,
  null,
  null,
  'active'
)
on conflict (auth_user_id) do update
set
  thai_d_sub = excluded.thai_d_sub,
  role = excluded.role,
  agency_code = excluded.agency_code,
  province_code = excluded.province_code,
  district_code = excluded.district_code,
  status = excluded.status,
  updated_at = now();

commit;
