"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RolePageLayout, { type RoleMenuItem } from "@/components/RolePageLayout";
import SuperadminUsersPanel from "@/components/SuperadminUsersPanel";

import IntakeFormSection from "@/components/IntakeFormSection";
import SavedRecordsPanel from "@/components/SavedRecordsPanel";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import type { AppUserRow, IntakeFormData } from "@/types/mvp";

const initialFormData: IntakeFormData = {
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
  evaluationStatus: "",
};

type SuperadminTab = "users" | "intake";

const MENU_ITEMS: RoleMenuItem[] = [
  {
    key: "intake",
    label: "กรอกข้อมูลอำเภอ",
    icon: "📝",
    description: "บันทึกข้อมูล พชอ. รายอำเภอ",
  },

  {
    key: "users",
    label: "จัดการผู้ใช้งาน",
    icon: "👥",
    description: "เพิ่ม แก้ไข และจัดการ allowlist",
    groupLabel: "สำหรับ Admin",
  },
];

export default function SuperadminPage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<SuperadminTab>("intake");
  const router = useRouter();
  const accessScope = buildAccessScope(currentUser);

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
            <h1>📝 กรอกข้อมูล</h1>
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

    </RolePageLayout>
  );
}
