"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/services/supabase-client";
import type { AppUserRow } from "@/types/mvp";
import styles from "./PublicDashboardAccountMenu.module.css";

type PublicDashboardAccountMenuProps = {
  user: AppUserRow | null;
  loading: boolean;
};

const workspaceByRole: Record<AppUserRow["role"], { href: string; label: string }> = {
  superadmin: { href: "/superadmin", label: "จัดการระบบ" },
  admin: { href: "/admin", label: "หน้างาน Admin" },
  user: { href: "/my-work", label: "งานของฉัน" },
};

export default function PublicDashboardAccountMenu({ user, loading }: PublicDashboardAccountMenuProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const workspace = user ? workspaceByRole[user.role] : null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className={styles.accountMenu} aria-label="เมนูบัญชีผู้ใช้">
      <div className={styles.menuLabel}>
        <span aria-hidden="true">☰</span>
        <strong>เมนูระบบ</strong>
      </div>

      {loading ? (
        <span className={styles.loading}>กำลังตรวจสอบ...</span>
      ) : user && workspace ? (
        <div className={styles.actions}>
          <Link className={styles.primaryAction} href={workspace.href} prefetch={false}>
            {workspace.label}
          </Link>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "กำลังออก..." : "ออกจากระบบ"}
          </button>
        </div>
      ) : (
        <Link className={styles.primaryAction} href="/login" prefetch={false}>
          เข้าสู่ระบบ
        </Link>
      )}
    </nav>
  );
}
