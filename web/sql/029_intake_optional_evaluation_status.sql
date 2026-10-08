-- Allow legacy intake records to correct their fiscal year without forcing
-- an assessment result. The assessment can remain null until it is completed.

begin;

alter table public.intake_records
  add column if not exists evaluation_status text;

alter table public.intake_records
  alter column evaluation_status drop not null;

alter table public.intake_records
  drop constraint if exists intake_records_evaluation_status_check;

alter table public.intake_records
  add constraint intake_records_evaluation_status_check
  check (evaluation_status is null or evaluation_status in ('pass', 'fail'));

comment on column public.intake_records.evaluation_status is
  'Optional assessment result. Null is allowed while a legacy record is awaiting assessment.';

commit;
