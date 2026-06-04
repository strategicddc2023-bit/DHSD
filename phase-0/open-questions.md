# Phase 0 Open Questions (ต้องยืนยันก่อนขึ้น Phase 1)

1. Mapping หน่วยงาน
- ใช้รูปแบบรหัสหน่วยงานแบบไหนเป็น canonical (DPC01 หรือรูปแบบอื่น)

2. ข้อมูลจังหวัด/อำเภอ
- ใช้ชุด master จากแหล่งใดเป็นทางการ (เช่น กรมการปกครอง)
- ต้องรองรับการเปลี่ยนแปลงเขตปกครองระหว่างปีหรือไม่

3. Dashboard map
- ใช้ polygon ขอบเขตจากไฟล์ไหน (GeoJSON/TopoJSON)
- ระดับ hover popup ที่ต้องแสดงใน MVP มีอะไรบ้าง

4. ตารางสรุป Dashboard
- จะ refresh ทุก submit หรือรอบเวลา (เช่น ทุก 15 นาที)

5. รอบรายงาน
- MVP รอบแรกเก็บ fiscal_year/report_cycle เลยหรือเลื่อนไปเฟสถัดไป

6. RBAC/SSO rollout
- กำหนด target date สำหรับเริ่มบังคับ role จริง
- หน่วยงานใดเป็น owner อนุมัติผู้ใช้ (super_admin/admin)
