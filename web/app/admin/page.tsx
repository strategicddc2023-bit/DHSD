"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RolePageLayout, { type RoleMenuItem } from "@/components/RolePageLayout";
import DashboardSection from "@/components/DashboardSection";
import IntakeFormSection from "@/components/IntakeFormSection";
import KpiInputSection from "@/components/KpiInputSection";
import WorkSummary from "@/components/WorkSummary";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import { supabase } from "@/services/supabase-client";
import type { AgencyOption, AppUserRow, IntakeFormData } from "@/types/mvp";

const initialFormData: IntakeFormData = {
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
  evaluationStatus: "",
};

type AdminTab = "overview" | "intake" | "dashboard" | "kpi";

const MENU_ITEMS: RoleMenuItem[] = [
  {
    key: "overview",
    label: "ภาพรวมงานของฉัน",
    icon: "🏥",
    description: "สรุปสถานะงานของหน่วยงาน",
  },
  {
    key: "intake",
    label: "กรอกข้อมูลอำเภอ",
    icon: "📝",
    description: "บันทึกข้อมูล พชอ. รายอำเภอ",
  },
  {
    key: "dashboard",
    label: "ดู Dashboard",
    icon: "📊",
    description: "ดูข้อมูลภาพรวมของ สคร. ตนเอง",
  },
  {
    key: "kpi",
    label: "กรอก KPI",
    icon: "🎯",
    description: "บันทึกค่า KPI รายปีงบประมาณ",
  },
];

export default function AdminPage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const router = useRouter();
  const accessScope = buildAccessScope(currentUser);

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
      // Pre-fill agency from user profile
      const agencyCode = user?.agency_code;
      if (agencyCode) {
        setFormData((prev) =>
          prev.agencyCode === agencyCode
            ? prev
            : { ...prev, agencyCode, provinceCode: "", districtCode: "" }
        );
      }
    };
    void loadUser();
  }, []);

  useEffect(() => {
    if (!userLoaded) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role === "superadmin") {
      router.replace("/superadmin");
      return;
    }
    if (currentUser.role === "user") {
      router.replace("/my-work");
    }
  }, [currentUser, router, userLoaded]);

  if (!userLoaded) {
    return (
      <main>
        <div className="admin-loading">
          <p>กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </main>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <RolePageLayout
      user={currentUser}
      title="หน้างาน Admin"
      subtitle="จัดการข้อมูลและติดตามความคืบหน้าของหน่วยงาน"
      badgeLabel="Admin"
      badgeIcon="🏥"
      menuItems={MENU_ITEMS}
      activeKey={activeTab}
      onMenuChange={(key) => setActiveTab(key as AdminTab)}
    >
      {/* ภาพรวม */}
      {activeTab === "overview" && (
        <section className="role-section">
          <WorkSummary user={currentUser} scope={accessScope} />
          <div className="role-section__actions">
            <button
              type="button"
              className="cta cta--solid"
              onClick={() => setActiveTab("intake")}
            >
              📝 เริ่มกรอกข้อมูล
            </button>
            <button
              type="button"
              className="cta cta--ghost"
              onClick={() => setActiveTab("dashboard")}
            >
              📊 ดู Dashboard
            </button>
          </div>
        </section>
      )}

      {/* กรอกข้อมูล */}
      {activeTab === "intake" && (
        <section className="role-section">
          <div className="role-section__header">
            <h1>📝 กรอกข้อมูลอำเภอ</h1>
            <p>บันทึกข้อมูลการดำเนินงาน พชอ. รายอำเภอของหน่วยงานตนเอง</p>
          </div>
          <IntakeFormSection
            formData={formData}
            onChange={setFormData}
            onSaved={() => setRefreshKey((prev) => prev + 1)}
            accessScope={accessScope ?? undefined}
          />
        </section>
      )}

      {/* Dashboard */}
      {activeTab === "dashboard" && (
        <section className="role-section">
          <div className="role-section__header">
            <h1>📊 Dashboard ของ สคร.</h1>
            <p>ดูข้อมูลและสถิติของหน่วยงานตนเอง</p>
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

      {/* กรอก KPI */}
      {activeTab === "kpi" && (
        <section className="role-section">
          <div className="role-section__header">
            <h1>🎯 กรอก KPI รายปีงบประมาณ</h1>
            <p>บันทึกค่า KPI และเป้าหมายรายปีงบประมาณของหน่วยงาน</p>
          </div>
          <KpiInputSection
            agencies={agencies}
            onSaved={() => setRefreshKey((prev) => prev + 1)}
            accessScope={accessScope ?? undefined}
          />
        </section>
      )}
    </RolePageLayout>
  );
}
