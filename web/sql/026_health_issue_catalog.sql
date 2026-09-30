-- Add the approved health-issue groups and catalog entries.
-- Run this in Supabase SQL Editor after 025_master_health_issues.sql.

begin;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_th_unique;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_group_check;

alter table public.master_health_issues
  add constraint master_health_issues_group_check
  check (issue_group in (
    'disease_health_risk',
    'context_driver',
    'royal_initiative',
    'communicable_disease',
    'noncommunicable_disease',
    'health_risk_factor',
    'occupational_environmental_disease',
    'systemic_prevention_mechanism'
  ));

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_group_unique;

alter table public.master_health_issues
  add constraint master_health_issues_name_group_unique unique (name_th, issue_group);

insert into public.master_health_issues (name_th, issue_group, sort_order)
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
  ('โรคระบบทางเดินหายใจ (ไข้หวัดใหญ่ / Covid -19)', 'communicable_disease', 208),
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
on conflict (name_th, issue_group) do update
set sort_order = excluded.sort_order,
    is_active = true;

commit;
