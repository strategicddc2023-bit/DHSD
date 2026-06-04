"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase-client";
import type { AppUserRow } from "@/types/mvp";

type NavItem = {
  href: string;
  label: string;
  allowed: boolean;
};

type AppNavigationProps = {
  user: AppUserRow | null;
};

export default function AppNavigation({ user }: AppNavigationProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const isSuperadmin = user?.role === "superadmin";
  const isStaff = user?.role === "admin" || user?.role === "user";
  const hasAgencyScope = Boolean(user?.agency_code);

  const items: NavItem[] = [
    { href: "/", label: "หน้าหลัก", allowed: true },
    { href: "#dashboard-section", label: "Dashboard", allowed: !isSuperadmin },
    { href: "/admin", label: "จัดการระบบ", allowed: isSuperadmin },
  ];

  const visibleItems = items.filter((item) => item.allowed);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutModal(false);
    window.location.href = "/";
  };

  return (
    <>
      <nav className="app-nav" aria-label="เมนูหลัก">
        <div className="app-nav__brand">
          <span>DHSD</span>
        </div>
        <div className="app-nav__shell">
          <div className="app-nav__links">
            {visibleItems.map((item) =>
              item.href.startsWith("#") ? (
                <a key={item.href} className="app-nav__link" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} className="app-nav__link" href={item.href} prefetch={false}>
                  {item.label}
                </Link>
              )
            )}
          </div>
          <div className="app-nav__auth">
            {user ? (
              <button type="button" className="cta cta--ghost app-nav__auth-btn" onClick={() => setShowLogoutModal(true)}>
                ออกจากระบบ
              </button>
            ) : (
              <Link className="cta cta--solid app-nav__auth-btn" href="/login" prefetch={false}>
                เข้าสู่ระบบ Admin
              </Link>
            )}
          </div>
        </div>
      </nav>

      {showLogoutModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <h3>ยืนยันการออกจากระบบ</h3>
            <p>คุณต้องการออกจากระบบ DHSD ใช่หรือไม่?</p>
            <div className="logout-modal-actions">
              <button className="cta cta--ghost" onClick={() => setShowLogoutModal(false)}>
                ยกเลิก
              </button>
              <button className="cta cta--solid" onClick={handleLogout}>
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
