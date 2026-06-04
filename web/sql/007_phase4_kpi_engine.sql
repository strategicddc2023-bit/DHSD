-- district_health_system_ddc: Phase 4 KPI engine foundation
-- Date: 2026-05-29

begin;

-- 1) KPI definition (master)
create table if not exists public.kpi_definitions (
  id serial primary key,
  kpi_code text not null unique,
  kpi_name_th text not null,
  kpi_description text,
  created_at timestamptz not null default now()
);

insert into public.kpi_definitions (kpi_code, kpi_name_th, kpi_description)
values
  ('KPI1', 'ร้อยละอำเภอที่มีการวิเคราะห์ปัจจัยเสี่ยง', 'จำนวนอำเภอที่มีผลวิเคราะห์ / จำนวนประเด็นโรคทั้งหมด * 100'),
  ('KPI2', 'ร้อยละอำเภอที่ดำเนินงานผ่านกลไก พชอ.', 'จำนวนอำเภอที่ดำเนินงานผ่าน พชอ. / จำนวนประเด็นโรคทั้งหมด * 100'),
  ('KPI3', 'ร้อยละอำเภอที่มีผลลัพธ์เชิงประจักษ์', 'จำนวนประเด็นที่มีผลลัพธ์ / จำนวนประเด็นโรคทั้งหมด * 100')
on conflict (kpi_code) do update
set kpi_name_th = excluded.kpi_name_th,
    kpi_description = excluded.kpi_description;

-- 2) KPI raw input by agency/year
create table if not exists public.kpi_inputs (
  id uuid primary key default gen_random_uuid(),
  agency_code text not null references public.master_agencies(code),
  fiscal_year int not null check (fiscal_year between 2566 and 2570),
  total_issue_count int not null check (total_issue_count >= 0),
  analyzed_district_count int not null check (analyzed_district_count >= 0),
  pcho_action_district_count int not null check (pcho_action_district_count >= 0),
  evidence_issue_count int not null check (evidence_issue_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_code, fiscal_year)
);

create index if not exists idx_kpi_inputs_agency_year on public.kpi_inputs(agency_code, fiscal_year);

-- 3) KPI calculated results
create table if not exists public.kpi_results (
  id uuid primary key default gen_random_uuid(),
  agency_code text not null references public.master_agencies(code),
  fiscal_year int not null check (fiscal_year between 2566 and 2570),
  kpi_code text not null references public.kpi_definitions(kpi_code),
  numerator numeric(14,2) not null,
  denominator numeric(14,2) not null,
  percent_value numeric(6,2) not null,
  score_value numeric(3,1) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (agency_code, fiscal_year, kpi_code)
);

create index if not exists idx_kpi_results_agency_year on public.kpi_results(agency_code, fiscal_year);

-- 4) scoring function by rule from plan
-- ใช้เกณฑ์แบบช่วงต่อเนื่อง:
-- <= 30 => 0.1
-- 30 < p < 40 => 0.2
-- 40 <= p < 45 => 0.3
-- 45 <= p < 50 => 0.4
-- >= 50 => 0.5
create or replace function public.kpi_score_from_percent(p numeric)
returns numeric
language plpgsql
as $$
begin
  if p <= 30 then return 0.1; end if;
  if p < 40 then return 0.2; end if;
  if p < 45 then return 0.3; end if;
  if p < 50 then return 0.4; end if;
  if p >= 50 then return 0.5; end if;
  return 0.1;
end;
$$;

-- 5) recompute one agency/year
create or replace function public.recompute_kpi_results(p_agency_code text, p_fiscal_year int)
returns void
language plpgsql
as $$
declare
  v_total numeric;
  v_a numeric;
  v_b numeric;
  v_c numeric;
  v_p1 numeric;
  v_p2 numeric;
  v_p3 numeric;
begin
  select
    total_issue_count,
    analyzed_district_count,
    pcho_action_district_count,
    evidence_issue_count
  into v_total, v_a, v_b, v_c
  from public.kpi_inputs
  where agency_code = p_agency_code and fiscal_year = p_fiscal_year;

  if not found then
    delete from public.kpi_results
    where agency_code = p_agency_code and fiscal_year = p_fiscal_year;
    return;
  end if;

  if v_total = 0 then
    v_p1 := 0; v_p2 := 0; v_p3 := 0;
  else
    v_p1 := round((v_a * 100.0 / v_total)::numeric, 2);
    v_p2 := round((v_b * 100.0 / v_total)::numeric, 2);
    v_p3 := round((v_c * 100.0 / v_total)::numeric, 2);
  end if;

  insert into public.kpi_results (agency_code, fiscal_year, kpi_code, numerator, denominator, percent_value, score_value)
  values
    (p_agency_code, p_fiscal_year, 'KPI1', v_a, v_total, v_p1, public.kpi_score_from_percent(v_p1)),
    (p_agency_code, p_fiscal_year, 'KPI2', v_b, v_total, v_p2, public.kpi_score_from_percent(v_p2)),
    (p_agency_code, p_fiscal_year, 'KPI3', v_c, v_total, v_p3, public.kpi_score_from_percent(v_p3))
  on conflict (agency_code, fiscal_year, kpi_code) do update
  set numerator = excluded.numerator,
      denominator = excluded.denominator,
      percent_value = excluded.percent_value,
      score_value = excluded.score_value,
      updated_at = now();
end;
$$;

-- 6) trigger to auto-recompute when input changes
create or replace function public.trg_kpi_inputs_recompute()
returns trigger
language plpgsql
as $$
begin
  perform public.recompute_kpi_results(new.agency_code, new.fiscal_year);
  return new;
end;
$$;

drop trigger if exists trg_kpi_inputs_recompute on public.kpi_inputs;
create trigger trg_kpi_inputs_recompute
after insert or update on public.kpi_inputs
for each row execute function public.trg_kpi_inputs_recompute();

-- 7) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kpi_inputs_updated_at on public.kpi_inputs;
create trigger trg_kpi_inputs_updated_at
before update on public.kpi_inputs
for each row execute function public.set_updated_at();

drop trigger if exists trg_kpi_results_updated_at on public.kpi_results;
create trigger trg_kpi_results_updated_at
before update on public.kpi_results
for each row execute function public.set_updated_at();

-- 8) summary view for dashboard usage
create or replace view public.v_kpi_results_dashboard as
select
  r.agency_code,
  a.label_th as agency_name,
  r.fiscal_year,
  r.kpi_code,
  r.percent_value,
  r.score_value,
  r.updated_at
from public.kpi_results r
join public.master_agencies a on a.code = r.agency_code;

-- 9) aggregated KPI summary for dashboard usage
create or replace view public.v_kpi_summary_dashboard as
select
  r.fiscal_year,
  r.kpi_code,
  d.kpi_name_th,
  round(avg(r.percent_value)::numeric, 2) as avg_percent,
  round(avg(r.score_value)::numeric, 2) as avg_score,
  count(distinct r.agency_code) as agency_count
from public.kpi_results r
join public.kpi_definitions d on d.kpi_code = r.kpi_code
group by r.fiscal_year, r.kpi_code, d.kpi_name_th;

commit;
