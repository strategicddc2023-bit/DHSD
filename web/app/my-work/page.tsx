"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import AccessRibbon from "@/components/AccessRibbon";
import IntakeFormSection from "@/components/IntakeFormSection";
import WorkSummary from "@/components/WorkSummary";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import type { AppUserRow, IntakeFormData } from "@/types/mvp";

const initialFormData: IntakeFormData = {
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
};

type UserTab = "overview" | "intake";

export default function MyWorkPage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<UserTab>("overview");
  const router = useRouter();
  const accessScope = buildAccessScope(currentUser);

  useEffect(() => {
    const loadUser = async () => {
      const user = await loadCurrentAppUser();
      setCurrentUser(user);
      setUserLoaded(true);
      const agencyCode = user?.agency_code;
      if (agencyCode) {
        setFormData((prev) =>
          prev.agencyCode === user.agency_code
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
    if (currentUser.role === "admin") {
      router.replace("/admin");
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

  if (!currentUser || currentUser.role !== "user") {
    return null;
  }

  return (
    <main>
      <AppNavigation user={currentUser} />
      <div className="content-wrap">
        <AccessRibbon user={currentUser} />

        {/* Tab bar */}
        <nav className="user-tabs" aria-label="เมนูงานของฉัน">
          <button
            type="button"
            className={`user-tab${activeTab === "overview" ? " user-tab--active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            🏠 ภาพรวม
          </button>
          <button
            type="button"
            className={`user-tab${activeTab === "intake" ? " user-tab--active" : ""}`}
            onClick={() => setActiveTab("intake")}
          >
            📝 กรอกข้อมูล
          </button>
        </nav>

        {/* Tab: ภาพรวม */}
        {activeTab === "overview" && (
          <section className="section">
            <WorkSummary user={currentUser} scope={accessScope} />
            <div className="work-actions" style={{ marginTop: "18px" }}>
              <button
                type="button"
                className="cta cta--solid"
                onClick={() => setActiveTab("intake")}
              >
                📝 เริ่มกรอกข้อมูล
              </button>
            </div>
          </section>
        )}

        {/* Tab: กรอกข้อมูล */}
        {activeTab === "intake" && (
          <section className="section">
            <div className="section__header">
              <h2>📝 กรอกข้อมูลอำเภอ</h2>
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
      </div>
    </main>
  );
}
