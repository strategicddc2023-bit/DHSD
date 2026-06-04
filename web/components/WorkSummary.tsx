"use client";

import Link from "next/link";
import type { AccessScope } from "@/services/access-control";
import type { AppUserRow } from "@/types/mvp";

type WorkSummaryProps = {
  user: AppUserRow | null;
  scope: AccessScope | null;
};

export default function WorkSummary({ user, scope }: WorkSummaryProps) {
  const role = user?.role ?? "guest";
  const agency = user?.agency_code ?? "-";
  const province = user?.province_code ?? "-";
  const isAdmin = role === "admin";
  const isUser = role === "user";
  const rootClassName = ["work-summary", isAdmin ? "work-summary--admin" : "", isUser ? "work-summary--user" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={rootClassName}>
      <div className="work-summary__hero">
        <div>
          <p className="work-summary__eyebrow">MY WORKSPACE</p>
          <h1>{isAdmin ? "งานของผู้ดูแลพื้นที่" : isUser ? "งานของผู้ใช้หน่วยงาน" : "งานของฉัน"}</h1>
          <p>
            {isAdmin
              ? "ใช้พื้นที่นี้เพื่อกรอกข้อมูล ดูภาพรวมของ สคร. ที่รับผิดชอบ และตรวจ KPI ของหน่วยงานใน scope ของคุณ"
              : "ใช้พื้นที่นี้เพื่อกรอกข้อมูลเฉพาะหน่วยงานของคุณ ติดตามความคืบหน้า และดู dashboard ภายใต้สิทธิ์ของคุณ"}
          </p>
        </div>
        <div className="work-summary__tags">
          <span className="filter-chip">role: {role}</span>
          <span className="filter-chip">agency: {agency}</span>
          <span className="filter-chip">province: {province}</span>
        </div>
      </div>

      <div className="work-summary__grid">
        <article className="summary-card work-summary__card">
          <p>สิทธิ์ปัจจุบัน</p>
          <h3>{scope ? scope.role : "guest"}</h3>
          <span>
            {isAdmin
              ? "ดูภาพรวม สคร. และกรอกข้อมูลของหน่วยงาน"
              : isUser
                ? "กรอกข้อมูลของหน่วยงาน"
                : "ยังไม่ได้เข้าสู่ระบบ"}
          </span>
        </article>
        <article className="summary-card work-summary__card">
          <p>{isAdmin ? "งานผู้ดูแลพื้นที่" : isUser ? "งานผู้ใช้หน่วยงาน" : "งานที่ต้องทำ"}</p>
          <h3>{isAdmin || isUser ? "บันทึกข้อมูล" : "เข้าสู่ระบบ"}</h3>
          <span>
            {isAdmin
              ? "ฟอร์ม intake, KPI และการตรวจข้อมูลระดับ สคร."
              : isUser
                ? "ฟอร์ม intake และตรวจสอบสถานะงานของหน่วยงาน"
                : "เข้าสู่ระบบเพื่อปลดล็อกหลังบ้าน"}
          </span>
        </article>
        <article className="summary-card work-summary__card">
          <p>ทางลัด</p>
          <h3>3 เมนูหลัก</h3>
          <span>กรอกข้อมูล, KPI, Dashboard</span>
        </article>
      </div>

      <div className="work-summary__actions">
        <Link className="cta cta--solid" href="#input-section">
          ไปที่ฟอร์มกรอกข้อมูล
        </Link>
        <Link className="cta cta--ghost" href="#dashboard-section">
          ดู Dashboard
        </Link>
      </div>
    </section>
  );
}
