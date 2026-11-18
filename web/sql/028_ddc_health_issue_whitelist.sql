-- Synchronize master_health_issues with the Department of Disease Control catalog.
-- Source: Mmd2/ประเด็นใหม่/บัญชีประเด็นกรมควบคุมโรค.json
-- Historical intake_records are preserved. Non-catalog master rows are only deactivated.

begin;

alter table public.master_health_issues
  add column if not exists is_ddc_approved boolean not null default false;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_th_unique;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_group_unique;

delete from public.master_health_issues duplicate
using public.master_health_issues retained
where duplicate.name_th = retained.name_th
  and duplicate.issue_group = retained.issue_group
  and duplicate.id > retained.id;

alter table public.master_health_issues
  add constraint master_health_issues_name_group_unique unique (name_th, issue_group);

-- Deactivate the existing catalog first. Approved rows are reactivated by the upsert below.
update public.master_health_issues
set is_active = false,
    is_ddc_approved = false;

-- Keep the approved catalog inline so the migration does not depend on a temporary
-- table surviving across statements in SQL runners that change sessions/transactions.
insert into public.master_health_issues (name_th, issue_group, sort_order, is_active, is_ddc_approved)
select approved.name_th, approved.issue_group, approved.sort_order, true, true
from (
  values
  ('การขับเคลื่อนงานโครงการเฝ้าระวัง คัดกรอง ป้องกันควบคุมโรคที่สำคัญตามโครงการพระราชดำริและภายใต้แผนปฏิบัติการโครงการราชทัณฑ์ปันสุข ทำความดี เพื่อชาติ ศาสน์ กษัตริย์', 'royal_initiative', 101),
  ('โรคหนอนพยาธิ', 'royal_initiative', 102),
  ('โรคพิษสุนัขบ้า', 'royal_initiative', 103),
  ('โรคพยาธิใบไม้ในตับ (OV)', 'royal_initiative', 104),
  ('โรคมะเร็งท่อน้ำดี (CCA)', 'royal_initiative', 105),
  ('วัณโรค (TB)', 'royal_initiative', 106),
  ('ไข้หวัดใหญ่', 'royal_initiative', 107),
  ('การสร้างเสริมภูมิคุ้มกันโรคด้วยวัคซีน', 'royal_initiative', 108),
  ('โรคติดต่อทางเพศสัมพันธ์', 'royal_initiative', 109),

  ('โรคไข้เลือดออก', 'communicable_disease', 201),
  ('โรคไข้มาลาเรีย', 'communicable_disease', 202),
  ('โรคหนอนพยาธิ', 'communicable_disease', 203),
  ('โรคพยาธิใบไม้ในตับ (OV)', 'communicable_disease', 204),
  ('โรคมะเร็งท่อน้ำดี (CCA)', 'communicable_disease', 205),
  ('การสร้างเสริมภูมิคุ้มกันโรคด้วยวัคซีน', 'communicable_disease', 206),
  ('โรคอุบัติใหม่/โรคอุบัติซ้ำ', 'communicable_disease', 207),
  ('โรคระบบทางเดินหายใจ (ไข้หวัดใหญ่ / COVID-19)', 'communicable_disease', 208),
  ('โรคติดต่อทางเดินอาหารและน้ำ', 'communicable_disease', 209),
  ('โรคติดต่อในเด็ก (มือ เท้า ปาก)', 'communicable_disease', 210),
  ('โรคเมลิออยด์', 'communicable_disease', 211),
  ('โรคเลปโตสไปโรสิส', 'communicable_disease', 212),
  ('โรคพิษสุนัขบ้า', 'communicable_disease', 213),
  ('โรคไวรัสตับอักเสบ ซี (HCV)', 'communicable_disease', 214),
  ('โรคไวรัสตับอักเสบ บี (HBV)', 'communicable_disease', 215),
  ('โรคติดต่อทางเพศสัมพันธ์', 'communicable_disease', 216),
  ('โรคเรื้อน', 'communicable_disease', 217),
  ('วัณโรค (TB)', 'communicable_disease', 218),
  ('HIV / AIDS', 'communicable_disease', 219),

  ('โรคความดันโลหิตสูง (HT)', 'noncommunicable_disease', 301),
  ('โรคเบาหวาน (DM)', 'noncommunicable_disease', 302),
  ('โรคไต', 'noncommunicable_disease', 303),

  ('การจมน้ำ', 'health_risk_factor', 401),
  ('การบาดเจ็บจากการพลัดตกหกล้มในผู้สูงอายุ', 'health_risk_factor', 402),
  ('อุบัติเหตุทางถนน (RTI)', 'health_risk_factor', 403),
  ('การควบคุมการบริโภคยาสูบและบุหรี่ไฟฟ้า', 'health_risk_factor', 404),
  ('การควบคุมการบริโภคเครื่องดื่มแอลกอฮอล์', 'health_risk_factor', 405),

  ('โรคจากฝุ่นพิษ PM2.5', 'occupational_environmental_disease', 501),
  ('โรคจากตะกั่วหรือสารประกอบของตะกั่ว', 'occupational_environmental_disease', 502),
  ('โรคจากฝุ่นซิลิกา', 'occupational_environmental_disease', 503),
  ('โรคจากแอสเบสตอส (ใยหิน)', 'occupational_environmental_disease', 504),
  ('โรคพิษสารกำจัดศัตรูพืช', 'occupational_environmental_disease', 505),
  ('อุบัติภัยสารเคมี', 'occupational_environmental_disease', 506),

  ('การสร้างความรอบรู้ด้านสุขภาพในการป้องกันโรคและภัยสุขภาพ เพื่อการท่องเที่ยวปลอดภัย (เห็ดพิษ/ แมงกะพรุน ฯลฯ)', 'systemic_prevention_mechanism', 601),
  ('การป้องกันโรคในแรงงานข้ามชาติ', 'systemic_prevention_mechanism', 602)
) as approved(name_th, issue_group, sort_order)
on conflict (name_th, issue_group) do update
set sort_order = excluded.sort_order,
    is_active = true,
    is_ddc_approved = true;

commit;
