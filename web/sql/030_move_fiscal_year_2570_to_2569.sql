-- One-time correction: move all intake records currently assigned to
-- fiscal year 2570 back to fiscal year 2569.

begin;

update public.intake_records
set fiscal_year = 2569
where fiscal_year = 2570;

commit;

-- Verification: this should return 0 after the update.
select count(*) as remaining_fiscal_year_2570
from public.intake_records
where fiscal_year = 2570;
