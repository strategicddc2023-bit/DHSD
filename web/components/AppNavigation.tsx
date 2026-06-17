"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase-client";
import type { AppUserRow } from "@/types/mvp";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  allowed: boolean;
};

type AppNavigationProps = {
  user: AppUserRow | null;
};

export default function AppNavigation({ user }: AppNavigationProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSuperadmin = user?.role === "superadmin";
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  const items: NavItem[] = [
    { href: "/", label: "หน้าหลัก", icon: "🏠", allowed: true },
    {
      href: "/superadmin",
      label: "⚙️ จัดการระบบ",
      icon: "⚙️",
      allowed: isSuperadmin,
    },
    {
      href: "/admin",
      label: "🏥 หน้างาน Admin",
      icon: "🏥",
      allowed: isAdmin,
    },
    {
      href: "/my-work",
      label: "📋 งานของฉัน",
      icon: "📋",
      allowed: isUser,
    },
  ];

  const visibleItems = items.filter((item) => item.allowed);

  const closeMenu = () => setMenuOpen(false);

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
          {user && (
            <span className={`app-nav__role-badge app-nav__role-badge--${user.role}`}>
              {isSuperadmin ? "⚙️ Superadmin" : isAdmin ? "🏥 Admin" : "👤 User"}
            </span>
          )}
        </div>
        <button
          type="button"
          className={`app-nav__hamburger ${menuOpen ? "app-nav__hamburger--open" : ""}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={menuOpen}
        >
          <span className="app-nav__hamburger-bar" />
          <span className="app-nav__hamburger-bar" />
          <span className="app-nav__hamburger-bar" />
        </button>
        <div className={`app-nav__shell ${menuOpen ? "app-nav__shell--open" : ""}`}>
          <div className="app-nav__links">
            {visibleItems.map((item) => (
              <span key={item.href} onClick={closeMenu}>
                {item.href.startsWith("#") ? (
                  <a className="app-nav__link" href={item.href}>
                    {item.label}
                  </a>
                ) : (
                  <Link className="app-nav__link" href={item.href} prefetch={false}>
                    {item.label}
                  </Link>
                )}
              </span>
            ))}
          </div>
          <div className="app-nav__auth" onClick={closeMenu}>
            {user ? (
              <button
                type="button"
                className="cta cta--ghost app-nav__auth-btn"
                onClick={() => setShowLogoutModal(true)}
              >
                ออกจากระบบ
              </button>
            ) : (
              <Link className="cta cta--solid app-nav__auth-btn" href="/login" prefetch={false}>
                เข้าสู่ระบบ
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
