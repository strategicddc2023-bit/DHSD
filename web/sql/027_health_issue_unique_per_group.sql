-- 027_health_issue_unique_per_group.sql
-- ปรับแก้ Unique Constraint ของตาราง master_health_issues ให้เป็น unique ร่วมกันระหว่าง (name_th, issue_group)
-- เพื่อให้สามารถมีชื่อโรคเดียวกันในต่างกลุ่มได้ โดยไม่เกิด 409 Conflict

begin;

-- ปลด unique เดิมที่ห้ามชื่อซ้ำกันทั่วทั้งตาราง
alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_th_unique;

alter table public.master_health_issues
  drop constraint if exists master_health_issues_name_group_unique;

-- กำหนด unique ใหม่เป็นคู่ (name_th, issue_group) ซ้ำกันได้ถ้าอยู่คนละกลุ่มโรค
alter table public.master_health_issues
  add constraint master_health_issues_name_group_unique unique (name_th, issue_group);

commit;
