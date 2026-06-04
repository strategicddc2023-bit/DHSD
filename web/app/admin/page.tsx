"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import AccessRibbon from "@/components/AccessRibbon";
import SuperadminUsersPanel from "@/components/SuperadminUsersPanel";
import DashboardSection from "@/components/DashboardSection";
import IntakeFormSection from "@/components/IntakeFormSection";
import KpiInputSection from "@/components/KpiInputSection";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import { supabase } from "@/services/supabase-client";
import type { AgencyOption, AppUserRow, IntakeFormData } from "@/types/mvp";

const initialFormData: IntakeFormData = {
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
};

type AdminTab = "users" | "dashboard" | "intake" | "kpi";

export default function AdminPage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const router = useRouter();
  const accessScope = buildAccessScope(currentUser);
  const intakeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadAgencies = async () => {
      const { data } = await supabase
        .from("master_agencies")
        .select("code,label_th")
        .order("code", { ascending: true });
      setAgencies(data ?? []);
    };
    void loadAgencies();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const user = await loadCurrentAppUser();
      setCurrentUser(user);
      setUserLoaded(true);
    };
    void loadUser();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role !== "superadmin") {
      router.replace("/my-work");
    }
  }, [currentUser, router, userLoaded]);

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: "users", label: "จัดการผู้ใช้งาน", icon: "👥" },
    { key: "dashboard", label: "Dashboard ภาพรวม", icon: "📊" },
    { key: "intake", label: "กรอกข้อมูล", icon: "📝" },
    { key: "kpi", label: "กรอก KPI", icon: "🎯" },
  ];

  if (!userLoaded) {
    return (
      <main>
        <div className="admin-loading">
          <p>กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </main>
    );
  }

  if (!currentUser || currentUser.role !== "superadmin") {
    return null;
  }

  return (
    <main>
      <AppNavigation user={currentUser} />
      <div className="content-wrap">
        <AccessRibbon user={currentUser} />

        {/* Admin Header */}
        <div className="admin-header">
          <div className="admin-header__title">
            <span className="admin-header__badge">⚙️ Superadmin</span>
            <h1>ระบบจัดการ DHSD</h1>
            <p>ศูนย์กลางจัดการระบบ ผู้ใช้งาน และข้อมูล สำหรับผู้ดูแลระบบ</p>
          </div>
          <div className="admin-header__meta">
            <span className="filter-chip">🔐 {currentUser.role}</span>
            <span className="filter-chip">✉️ {currentUser.thai_d_sub ?? "superadmin"}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="admin-tabs" aria-label="เมนูจัดการระบบ">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`admin-tab${activeTab === tab.key ? " admin-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab: จัดการผู้ใช้งาน */}
        {activeTab === "users" && (
          <section className="admin-section">
            <div className="section__header">
              <h2>👥 จัดการผู้ใช้งาน &amp; สิทธิ์การเข้าถึง</h2>
              <p>เพิ่ม แก้ไข และจัดการ allowlist ผู้ใช้งานในระบบ DHSD</p>
            </div>
            <SuperadminUsersPanel accessScope={accessScope ?? undefined} />
          </section>
        )}

        {/* Tab: Dashboard */}
        {activeTab === "dashboard" && (
          <section className="admin-section">
            <div className="section__header">
              <h2>📊 Dashboard ภาพรวมระดับประเทศ</h2>
              <p>ดูข้อมูลและสถิติทั้งหมดในระดับ superadmin</p>
            </div>
            <DashboardSection
              formData={formData}
              refreshKey={refreshKey}
              accessScope={accessScope ?? undefined}
              viewMode="backoffice"
              onSelectDistrictForIntake={(selection) => {
                setFormData((prev) => ({
                  ...prev,
                  agencyCode: selection.agencyCode,
                  provinceCode: selection.provinceCode,
                  districtCode: selection.districtCode,
                }));
                setActiveTab("intake");
              }}
            />
          </section>
        )}

        {/* Tab: กรอกข้อมูล */}
        {activeTab === "intake" && (
          <section className="admin-section" ref={intakeRef}>
            <div className="section__header">
              <h2>📝 กรอกข้อมูลอำเภอ</h2>
              <p>บันทึกข้อมูลการดำเนินงาน พชอ. รายอำเภอ (สามารถกรอกแทนทุกหน่วยงาน)</p>
            </div>
            <IntakeFormSection
              formData={formData}
              onChange={setFormData}
              onSaved={() => setRefreshKey((prev) => prev + 1)}
              accessScope={accessScope ?? undefined}
            />
          </section>
        )}

        {/* Tab: กรอก KPI */}
        {activeTab === "kpi" && (
          <section className="admin-section">
            <div className="section__header">
              <h2>🎯 กรอก KPI รายปีงบประมาณ</h2>
              <p>บันทึกค่า KPI และเป้าหมายรายปีงบประมาณ</p>
            </div>
            <KpiInputSection
              agencies={agencies}
              onSaved={() => setRefreshKey((prev) => prev + 1)}
              accessScope={accessScope ?? undefined}
            />
          </section>
        )}
      </div>
    </main>
  );
}
