-- Add pass/fail assessment result for district intake records.
alter table public.intake_records
  add column if not exists evaluation_status text;

alter table public.intake_records
  drop constraint if exists intake_records_evaluation_status_check;

alter table public.intake_records
  add constraint intake_records_evaluation_status_check
  check (evaluation_status is null or evaluation_status in ('pass', 'fail'));

create index if not exists idx_intake_records_evaluation_status
  on public.intake_records(evaluation_status);