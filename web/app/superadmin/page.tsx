"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RolePageLayout, { type RoleMenuItem } from "@/components/RolePageLayout";
import SuperadminUsersPanel from "@/components/SuperadminUsersPanel";

import IntakeFormSection from "@/components/IntakeFormSection";
import KpiInputSection from "@/components/KpiInputSection";
import SavedRecordsPanel from "@/components/SavedRecordsPanel";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import { supabase } from "@/services/supabase-client";
import type { AgencyOption, AppUserRow, IntakeFormData } from "@/types/mvp";

const initialFormData: IntakeFormData = {
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
};

type SuperadminTab = "users" | "intake" | "kpi";

const MENU_ITEMS: RoleMenuItem[] = [
  {
    key: "users",
    label: "จัดการผู้ใช้งาน",
    icon: "👥",
    description: "เพิ่ม แก้ไข และจัดการ allowlist",
  },

  {
    key: "intake",
    label: "กรอกข้อมูลอำเภอ",
    icon: "📝",
    description: "บันทึกข้อมูล พชอ. รายอำเภอ",
  },
  {
    key: "kpi",
    label: "กรอก KPI",
    icon: "🎯",
    description: "บันทึกค่า KPI รายปีงบประมาณ",
  },
];

export default function SuperadminPage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<SuperadminTab>("users");
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
      if (currentUser.role === "admin") router.replace("/admin");
      else router.replace("/my-work");
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

  if (!currentUser || currentUser.role !== "superadmin") {
    return null;
  }

  return (
    <RolePageLayout
      user={currentUser}
      title="ระบบจัดการ DHSD"
      subtitle="ศูนย์กลางจัดการระบบ ผู้ใช้งาน และข้อมูล"
      badgeLabel="Superadmin"
      badgeIcon="⚙️"
      menuItems={MENU_ITEMS}
      activeKey={activeTab}
      onMenuChange={(key) => setActiveTab(key as SuperadminTab)}
    >
      {/* จัดการผู้ใช้งาน */}
      {activeTab === "users" && (
        <section className="role-section">
          <div className="role-section__header">
            <h1>👥 จัดการผู้ใช้งาน &amp; สิทธิ์การเข้าถึง</h1>
            <p>เพิ่ม แก้ไข และจัดการ allowlist ผู้ใช้งานในระบบ DHSD</p>
          </div>
          <SuperadminUsersPanel accessScope={accessScope ?? undefined} />
        </section>
      )}


      {/* กรอกข้อมูล */}
      {activeTab === "intake" && (
        <section className="role-section">
          <div className="role-section__header">
            <h1>📝 กรอกข้อมูลอำเภอ</h1>
            <p>บันทึกข้อมูลการดำเนินงาน พชอ. รายอำเภอ (สามารถกรอกแทนทุกหน่วยงาน)</p>
          </div>
          <IntakeFormSection
            formData={formData}
            onChange={setFormData}
            onSaved={() => setRefreshKey((prev) => prev + 1)}
            accessScope={accessScope ?? undefined}
          />
          <div style={{ marginTop: "2rem" }}>
            <SavedRecordsPanel
              refreshKey={refreshKey}
              accessScope={accessScope ?? undefined}
            />
          </div>
        </section>
      )}

      {/* กรอก KPI */}
      {activeTab === "kpi" && (
        <section className="role-section">
          <div className="role-section__header">
            <h1>🎯 กรอก KPI รายปีงบประมาณ</h1>
            <p>บันทึกค่า KPI และเป้าหมายรายปีงบประมาณ</p>
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
