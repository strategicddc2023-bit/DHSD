# Phase 0 User Role Matrix Baseline

วันที่อ้างอิง: 2026-05-29
สถานะ: Draft for future enforcement

## Role
- super_admin
- admin
- user

## แนวทางใช้งานในรอบปัจจุบัน
- รอบนี้ยังไม่บังคับแยกสิทธิ์ทุกหน้า
- ทุกหน้าเปิดให้เห็นเพื่อพัฒนา UI flow และ business flow ก่อน

## สิทธิ์เป้าหมาย (เมื่อเปิดใช้จริง)

| Capability | super_admin | admin | user |
|---|---|---|---|
| ดู Dashboard ทั้งประเทศ | Yes | Optional by scope | Optional by scope |
| จัดการ master data | Yes | Partial | No |
| จัดการผู้ใช้/อนุมัติสิทธิ์ | Yes | Partial | No |
| เพิ่ม/แก้ไขข้อมูล intake | Yes | Yes | Yes (ตาม scope) |
| Export รายงาน | Yes | Yes | Optional |
| กำหนดค่า alert/สูตร | Yes | Partial | No |

## Scope model (proposed)
- agency scope (สคร.)
- province scope
- district scope

## หมายเหตุ
- เมื่อต่อ SSO/ThaiD แล้ว ให้ใช้ Authentication จาก ThaiD
- การอนุญาตเข้าใช้ระบบจริง ให้ตัดสินจาก app_users + status + scope
