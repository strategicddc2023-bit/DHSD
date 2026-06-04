"use client";

import type { AppUserRow } from "@/types/mvp";
import { getAccessSummary } from "@/services/auth-session";

type AccessRibbonProps = {
  user: AppUserRow | null;
};

export default function AccessRibbon({ user }: AccessRibbonProps) {
  const roleLabel = user ? user.role : "preview";
  const statusLabel = user ? user.status : "guest";

  return (
    <section className="access-ribbon" aria-label="สถานะสิทธิ์ผู้ใช้">
      <div>
        <p className="access-ribbon__kicker">Access Control</p>
        <h2>{getAccessSummary(user)}</h2>
      </div>
      <div className="access-ribbon__meta">
        <span className="filter-chip">role: {roleLabel}</span>
        <span className="filter-chip">status: {statusLabel}</span>
        <span className="filter-chip">{user?.thai_d_sub ?? "ยังไม่ได้เชื่อม ThaiD"}</span>
      </div>
    </section>
  );
}
