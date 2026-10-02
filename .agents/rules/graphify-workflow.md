# Graphify Workflow Guidelines for SmartDSP (DHSD)

ก่อนเริ่มเขียนหรือแก้ไขโค้ดใด ๆ:
1. ให้อ่านและอ้างอิงแผนผังโครงสร้างระบบจาก:
   - `graphify-out/GRAPH_REPORT.md`
   - `graphify-out/graph.json` (หรือใช้คำสั่ง query ของ Graphify: `& "C:\Users\piche\Documents\graphify\graphify-8\.venv\Scripts\graphify.exe" query "<query>"`)
2. ทำความเข้าใจ Module, Dependency และความเชื่อมโยงของไฟล์ในระบบ SmartDSP ทั้งหมดก่อนเสมอ

เมื่อได้รับคำสั่งงาน:
- ให้ค้นหาไฟล์และฟังก์ชันที่เกี่ยวข้องจาก Graphify ก่อน
- ห้ามไล่ค้นหาหรือสแกนไฟล์ทั้งระบบโดยไม่จำเป็นเพื่อประหยัด Token
- เมื่อพบตำแหน่งที่ถูกต้องแล้ว ค่อยเปิดอ่านเฉพาะไฟล์ที่จำเป็นต้องแก้ไขเท่านั้น
- Git Hook ได้รับการติดตั้งแล้วเพื่อ Auto-update graphify อัตโนมัติทุกครั้งที่ commit
