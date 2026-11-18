"use client";

import Link from "next/link";
import { useState } from "react";
import type { WorkspaceMenuView } from "@/components/dashboard/dashboard-shared";
import { supabase } from "@/services/supabase-client";
import type { AgencyOption, AppUserRow } from "@/types/mvp";

type DashboardInsightMenuKey = "evaluation" | "group";

type DashboardAgencySelectorProps = {
  agencies: AgencyOption[];
  selectedAgencyCode: string;
  isOverviewActive: boolean;
  isOverviewDisabled?: boolean;
  lockedAgencyCode?: string | null;
  activeInsightTab?: DashboardInsightMenuKey | null;
  hasAccountMenu?: boolean;
  currentUser?: AppUserRow | null;
  isUserLoading?: boolean;
  activeWorkspaceView?: WorkspaceMenuView;
  onSelectWorkspaceView?: (view: WorkspaceMenuView) => void;
  onLoggedOut?: () => void;
  onSelectInsight?: (tab: DashboardInsightMenuKey) => void;
  onSelectOverview: () => void;
  onSelectAgency: (agencyCode: string) => void;
};

const ADMIN_WORKSPACE_ITEMS: Array<{ view: WorkspaceMenuView; label: string; iconKey: "overview" | "intake" | "kpi" }> = [
  { view: "workOverview", label: "ภาพรวมงานของฉัน", iconKey: "overview" },
  { view: "intake", label: "กรอกข้อมูลอำเภอ", iconKey: "intake" },
  { view: "kpi", label: "กรอก KPI", iconKey: "kpi" },
];

const SUPERADMIN_MANAGEMENT_ITEMS: Array<{ view: WorkspaceMenuView; label: string; iconKey: "intake" | "healthIssues" }> = [
  { view: "intake", label: "กรอกข้อมูลอำเภอ", iconKey: "intake" },
  { view: "healthIssues", label: "เพิ่มรายการประเด็นโรค/ภัยสุขภาพ", iconKey: "healthIssues" },
];

function BrandLogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="11" width="3.5" height="9" rx="1.2" fill="currentColor" />
      <rect x="10.25" y="5" width="3.5" height="15" rx="1.2" fill="currentColor" />
      <rect x="16.5" y="8" width="3.5" height="12" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function SidebarToggleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h11" />
      <path d="M4 17h16" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.6 7-11.2a7 7 0 1 0-14 0C5 15.4 12 21 12 21Z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </svg>
  );
}

function ClipboardChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M8 15v-3" />
      <path d="M12 15V9" />
      <path d="M16 15v-5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12.5 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function EditNoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function ClipboardListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function AuthIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`tail-sidebar__chevron${isOpen ? " is-open" : ""}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function DashboardAgencySelector({
  agencies,
  selectedAgencyCode,
  isOverviewActive,
  isOverviewDisabled = false,
  lockedAgencyCode = null,
  activeInsightTab = null,
  hasAccountMenu = false,
  currentUser = null,
  isUserLoading = false,
  activeWorkspaceView = "dashboard",
  onSelectWorkspaceView,
  onLoggedOut,
  onSelectInsight,
  onSelectOverview,
  onSelectAgency,
}: DashboardAgencySelectorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAgencyMenuOpen, setIsAgencyMenuOpen] = useState(Boolean(selectedAgencyCode));
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const selectedValue = selectedAgencyCode || "";
  const selectedAgency = agencies.find((agency) => agency.code === selectedValue) ?? null;
  const isDashboardView = activeWorkspaceView === "dashboard";
  const isHomeSelected = isDashboardView && isOverviewActive && !activeInsightTab;
  const isAgencySectionActive = isDashboardView && Boolean(selectedValue);
  const isEvaluationSelected = isDashboardView && activeInsightTab === "evaluation";
  const isGroupSelected = isDashboardView && activeInsightTab === "group";
  const isSuperadmin = currentUser?.role === "superadmin";
  const isAdmin = currentUser?.role === "admin";
  const isStandardUser = currentUser?.role === "user";

  const handleSelectOverviewView = () => {
    onSelectWorkspaceView?.("dashboard");
    onSelectOverview();
  };

  const handleSelectAgencyView = (agencyCode: string) => {
    onSelectWorkspaceView?.("dashboard");
    onSelectAgency(agencyCode);
  };

  const handleSelectInsightView = (tab: DashboardInsightMenuKey) => {
    onSelectWorkspaceView?.("dashboard");
    onSelectInsight?.(tab);
  };

  const handleToggleAgencyMenu = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsAgencyMenuOpen(true);
      return;
    }
    setIsAgencyMenuOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    setIsLoggingOut(false);
    if (onLoggedOut) {
      onLoggedOut();
      return;
    }
    window.location.href = "/";
  };

  return (
    <aside
      className={`dashboard-side-menu tail-sidebar${isCollapsed ? " is-collapsed" : ""}`}
      aria-label="เมนูหลักระบบ"
    >
      <div className="tail-sidebar__header">
        <div className="tail-sidebar__brand">
          <span className="tail-sidebar__logo" aria-hidden="true">
            <BrandLogoIcon />
          </span>
          {!isCollapsed && (
            <div className="tail-sidebar__brand-text">
              <strong>DHSD</strong>
              <span>พชอ./พชข. กรมควบคุมโรค</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="tail-sidebar__toggle"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? "ขยายแถบเมนูด้านซ้าย" : "ย่อแถบเมนูด้านซ้าย"}
          title={isCollapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
        >
          <SidebarToggleIcon />
        </button>
      </div>

      <div className="tail-sidebar__group">
        {!isCollapsed && <span className="tail-sidebar__group-label">ภาพรวมข้อมูล</span>}

        <button
          type="button"
          className={`tail-sidebar__item${isHomeSelected ? " is-active" : ""}`}
          onClick={handleSelectOverviewView}
          disabled={isOverviewDisabled}
          title="หน้าแรก สรุปภาพรวม"
        >
          <span className="tail-sidebar__icon">
            <GridIcon />
          </span>
          {!isCollapsed && <span className="tail-sidebar__label">หน้าแรก (สรุปภาพรวม)</span>}
        </button>

        <div className="tail-sidebar__submenu-wrap">
          <button
            type="button"
            className={`tail-sidebar__item${isAgencySectionActive ? " is-active" : ""}`}
            onClick={handleToggleAgencyMenu}
            aria-expanded={isAgencyMenuOpen}
            title={selectedAgency ? `เลือก สคร. (${selectedAgency.label_th})` : "เลือก สคร."}
          >
            <span className="tail-sidebar__icon">
              <MapPinIcon />
            </span>
            {!isCollapsed && (
              <>
                <span className="tail-sidebar__label">
                  {selectedAgency ? `สคร.: ${selectedAgency.label_th}` : "เลือก สคร."}
                </span>
                <ChevronIcon isOpen={isAgencyMenuOpen} />
              </>
            )}
          </button>

          {!isCollapsed && isAgencyMenuOpen && (
            <div className="tail-sidebar__submenu" role="group" aria-label="รายชื่อ สคร.">
              {!lockedAgencyCode && (
                <button
                  type="button"
                  className={`tail-sidebar__subitem${isDashboardView && !selectedValue ? " is-active" : ""}`}
                  onClick={handleSelectOverviewView}
                  disabled={isOverviewDisabled}
                >
                  <span className="tail-sidebar__dot" aria-hidden="true" />
                  <span>ทุก สคร. (ภาพรวม)</span>
                </button>
              )}
              {agencies.map((agency) => {
                const isAgencySelected = isDashboardView && selectedValue === agency.code;
                const isAgencyDisabled = Boolean(lockedAgencyCode && lockedAgencyCode !== agency.code);
                return (
                  <button
                    key={agency.code}
                    type="button"
                    className={`tail-sidebar__subitem${isAgencySelected ? " is-active" : ""}`}
                    onClick={() => handleSelectAgencyView(agency.code)}
                    disabled={isAgencyDisabled}
                  >
                    <span className="tail-sidebar__dot" aria-hidden="true" />
                    <span>{agency.label_th}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          className={`tail-sidebar__item${isEvaluationSelected ? " is-active" : ""}`}
          onClick={() => handleSelectInsightView("evaluation")}
          title="ผลการคัดเกณฑ์ประเด็นโรคและภัยสุขภาพ"
        >
          <span className="tail-sidebar__icon">
            <ClipboardChartIcon />
          </span>
          {!isCollapsed && <span className="tail-sidebar__label">ผลการคัดเกณฑ์ฯ</span>}
        </button>

        <button
          type="button"
          className={`tail-sidebar__item${isGroupSelected ? " is-active" : ""}`}
          onClick={() => handleSelectInsightView("group")}
          title="ดูตามกลุ่มรายการ"
        >
          <span className="tail-sidebar__icon">
            <LayersIcon />
          </span>
          {!isCollapsed && <span className="tail-sidebar__label">ดูตามกลุ่มรายการ</span>}
        </button>
      </div>

      {hasAccountMenu && (
        <>
          {isUserLoading ? (
            <div className="tail-sidebar__group tail-sidebar__group--footer">
              {!isCollapsed && <span className="tail-sidebar__group-label">ระบบและบัญชี</span>}
              <div className="tail-sidebar__status">
                {!isCollapsed && <span>กำลังตรวจสอบ...</span>}
              </div>
            </div>
          ) : currentUser ? (
            <>
              {isSuperadmin && (
                <>
                  <div className="tail-sidebar__group tail-sidebar__group--divider">
                    {!isCollapsed && <span className="tail-sidebar__group-label">ระบบจัดการ DHSD</span>}
                    {SUPERADMIN_MANAGEMENT_ITEMS.map((item) => {
                      const isItemActive = activeWorkspaceView === item.view;
                      return (
                        <button
                          key={item.view}
                          type="button"
                          className={`tail-sidebar__item${isItemActive ? " is-active" : ""}`}
                          onClick={() => onSelectWorkspaceView?.(item.view)}
                          title={item.label}
                        >
                          <span className="tail-sidebar__icon">
                            {item.iconKey === "intake" ? <EditNoteIcon /> : <ClipboardListIcon />}
                          </span>
                          {!isCollapsed && <span className="tail-sidebar__label">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="tail-sidebar__group tail-sidebar__group--divider">
                    {!isCollapsed && <span className="tail-sidebar__group-label">สำหรับ Admin</span>}
                    <button
                      type="button"
                      className={`tail-sidebar__item${activeWorkspaceView === "users" ? " is-active" : ""}`}
                      onClick={() => onSelectWorkspaceView?.("users")}
                      title="จัดการผู้ใช้งาน"
                    >
                      <span className="tail-sidebar__icon">
                        <UsersIcon />
                      </span>
                      {!isCollapsed && <span className="tail-sidebar__label">จัดการผู้ใช้งาน</span>}
                    </button>
                  </div>
                </>
              )}

              {isAdmin && (
                <div className="tail-sidebar__group tail-sidebar__group--divider">
                  {!isCollapsed && <span className="tail-sidebar__group-label">ระบบจัดการ DHSD</span>}
                  {ADMIN_WORKSPACE_ITEMS.map((item) => {
                    const isItemActive = activeWorkspaceView === item.view;
                    return (
                      <button
                        key={item.view}
                        type="button"
                        className={`tail-sidebar__item${isItemActive ? " is-active" : ""}`}
                        onClick={() => onSelectWorkspaceView?.(item.view)}
                        title={item.label}
                      >
                        <span className="tail-sidebar__icon">
                          {item.iconKey === "intake" ? (
                            <EditNoteIcon />
                          ) : item.iconKey === "kpi" ? (
                            <ClipboardChartIcon />
                          ) : (
                            <SettingsIcon />
                          )}
                        </span>
                        {!isCollapsed && <span className="tail-sidebar__label">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {isStandardUser && (
                <div className="tail-sidebar__group tail-sidebar__group--divider">
                  {!isCollapsed && <span className="tail-sidebar__group-label">ระบบจัดการ DHSD</span>}
                  <button
                    type="button"
                    className={`tail-sidebar__item${activeWorkspaceView === "workOverview" ? " is-active" : ""}`}
                    onClick={() => onSelectWorkspaceView?.("workOverview")}
                    title="งานของฉัน"
                  >
                    <span className="tail-sidebar__icon">
                      <EditNoteIcon />
                    </span>
                    {!isCollapsed && <span className="tail-sidebar__label">งานของฉัน</span>}
                  </button>
                </div>
              )}

              <div className="tail-sidebar__group tail-sidebar__group--footer">
                {!isCollapsed && <span className="tail-sidebar__group-label">บัญชีผู้ใช้</span>}
                <button
                  type="button"
                  className="tail-sidebar__item tail-sidebar__item--danger"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="ออกจากระบบ"
                >
                  <span className="tail-sidebar__icon">
                    <AuthIcon />
                  </span>
                  {!isCollapsed && (
                    <span className="tail-sidebar__label">
                      {isLoggingOut ? "กำลังออก..." : "ออกจากระบบ"}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="tail-sidebar__group tail-sidebar__group--footer">
              {!isCollapsed && <span className="tail-sidebar__group-label">ระบบและบัญชี</span>}
              <Link
                className="tail-sidebar__item tail-sidebar__item--primary"
                href="/login"
                prefetch={false}
                title="เข้าสู่ระบบ"
              >
                <span className="tail-sidebar__icon">
                  <AuthIcon />
                </span>
                {!isCollapsed && <span className="tail-sidebar__label">เข้าสู่ระบบ</span>}
              </Link>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
