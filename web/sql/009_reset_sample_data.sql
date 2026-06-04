-- district_health_system_ddc: reset sample/temporary transactional data
-- Date: 2026-05-29

begin;

truncate table public.intake_records restart identity;
truncate table public.kpi_results;
truncate table public.kpi_inputs;

commit;
