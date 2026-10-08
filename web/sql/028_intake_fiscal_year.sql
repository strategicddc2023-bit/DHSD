-- Add Thai fiscal year to district intake records.
-- A fiscal year runs from 1 October to 30 September and uses the Buddhist year in which it ends.

begin;

alter table public.intake_records
  add column if not exists fiscal_year integer;

update public.intake_records
set fiscal_year = greatest(
  2567,
  least(
    2574,
    extract(year from (created_at at time zone 'Asia/Bangkok'))::integer
      + 543
      + case
          when extract(month from (created_at at time zone 'Asia/Bangkok'))::integer >= 10 then 1
          else 0
        end
  )
)
where fiscal_year is null;

alter table public.intake_records
  alter column fiscal_year set default (
    extract(year from (now() at time zone 'Asia/Bangkok'))::integer
      + 543
      + case
          when extract(month from (now() at time zone 'Asia/Bangkok'))::integer >= 10 then 1
          else 0
        end
  ),
  alter column fiscal_year set not null;

alter table public.intake_records
  drop constraint if exists intake_records_fiscal_year_check;

alter table public.intake_records
  add constraint intake_records_fiscal_year_check
  check (fiscal_year between 2567 and 2574);

create index if not exists idx_intake_records_fiscal_year
  on public.intake_records(fiscal_year);

commit;
