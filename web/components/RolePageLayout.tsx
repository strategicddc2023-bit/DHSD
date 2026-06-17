"use client";

import { useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import AccessRibbon from "@/components/AccessRibbon";
import type { AppUserRow } from "@/types/mvp";

export type RoleMenuItem = {
  key: string;
  label: string;
  icon: string;
  description?: string;
};

type RolePageLayoutProps = {
  user: AppUserRow | null;
  title: string;
  subtitle?: string;
  badgeLabel: string;
  badgeIcon: string;
  menuItems: RoleMenuItem[];
  activeKey: string;
  onMenuChange: (key: string) => void;
  children: React.ReactNode;
};

export default function RolePageLayout({
  user,
  title,
  subtitle,
  badgeLabel,
  badgeIcon,
  menuItems,
  activeKey,
  onMenuChange,
  children,
}: RolePageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeItem = menuItems.find((m) => m.key === activeKey);

  return (
    <main>
      <AppNavigation user={user} />
      <div className="role-layout">
        {/* Sidebar Overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="role-layout__overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`role-sidebar ${sidebarOpen ? "role-sidebar--open" : ""}`}>
          <div className="role-sidebar__header">
            <span className="role-sidebar__badge">
              {badgeIcon} {badgeLabel}
            </span>
            <h2 className="role-sidebar__title">{title}</h2>
            {subtitle && <p className="role-sidebar__subtitle">{subtitle}</p>}
          </div>

          <nav className="role-sidebar__nav" aria-label="เมนูหลัก">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`role-sidebar__item ${activeKey === item.key ? "role-sidebar__item--active" : ""}`}
                onClick={() => {
                  onMenuChange(item.key);
                  setSidebarOpen(false);
                }}
              >
                <span className="role-sidebar__item-icon">{item.icon}</span>
                <span className="role-sidebar__item-body">
                  <span className="role-sidebar__item-label">{item.label}</span>
                  {item.description && (
                    <span className="role-sidebar__item-desc">{item.description}</span>
                  )}
                </span>
              </button>
            ))}
          </nav>

          <div className="role-sidebar__user-info">
            <span className="filter-chip">{user?.role ?? "—"}</span>
            <span className="filter-chip">{user?.thai_d_sub ?? user?.agency_code ?? "—"}</span>
          </div>
        </aside>

        {/* Main content area */}
        <div className="role-content">
          {/* Mobile top bar */}
          <div className="role-content__topbar">
            <button
              type="button"
              className="role-content__menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="เปิดเมนู"
            >
              ☰ เมนู
            </button>
            {activeItem && (
              <span className="role-content__breadcrumb">
                {activeItem.icon} {activeItem.label}
              </span>
            )}
          </div>

          {/* Access Ribbon */}
          <AccessRibbon user={user} />

          {/* Page content */}
          <div className="role-content__body">{children}</div>
        </div>
      </div>
    </main>
  );
}
