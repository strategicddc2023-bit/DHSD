"use client";

import HealthIssueMasterPanel from "@/components/HealthIssueMasterPanel";
import IntakeFormSection from "@/components/IntakeFormSection";
import KpiInputSection from "@/components/KpiInputSection";
import SavedRecordsPanel from "@/components/SavedRecordsPanel";
import SuperadminUsersPanel from "@/components/SuperadminUsersPanel";
import WorkSummary from "@/components/WorkSummary";
import type { AccessScope } from "@/services/access-control";
import type { AgencyOption, AppUserRow, IntakeFormData } from "@/types/mvp";
import type { WorkspaceMenuView } from "./dashboard-shared";

type WorkspaceManagementViewProps = {
  activeView: Exclude<WorkspaceMenuView, "dashboard">;
  currentUser: AppUserRow | null;
  accessScope?: AccessScope;
  agencies: AgencyOption[];
  formData: IntakeFormData;
  refreshKey: number;
  onFormDataChange: (nextFormData: IntakeFormData) => void;
  onDataSaved: () => void;
};

export default function WorkspaceManagementView({
  activeView,
  currentUser,
  accessScope,
  agencies,
  formData,
  refreshKey,
  onFormDataChange,
  onDataSaved,
}: WorkspaceManagementViewProps) {
  const isSuperadmin = currentUser?.role === "superadmin";

  if (activeView === "intake") {
    return (
      <section className="role-section">
        <div className="role-section__header">
          <h1>📝 กรอกข้อมูล</h1>
        </div>
        <IntakeFormSection
          formData={formData}
          onChange={onFormDataChange}
          onSaved={onDataSaved}
          accessScope={accessScope}
        />
        {isSuperadmin && (
          <div style={{ marginTop: "2rem" }}>
            <SavedRecordsPanel refreshKey={refreshKey} accessScope={accessScope} />
          </div>
        )}
      </section>
    );
  }

  if (activeView === "healthIssues") {
    return (
      <section className="role-section">
        <div className="role-section__header">
          <h1>📋 เพิ่มรายการประเด็นโรค/ภัยสุขภาพ</h1>
        </div>
        <HealthIssueMasterPanel />
      </section>
    );
  }

  if (activeView === "users") {
    return (
      <section className="role-section">
        <div className="role-section__header">
          <h1>👥 จัดการผู้ใช้งาน &amp; สิทธิ์การเข้าถึง</h1>
          <p>เพิ่ม แก้ไข และจัดการ allowlist ผู้ใช้งานในระบบ DHSD</p>
        </div>
        <SuperadminUsersPanel accessScope={accessScope} />
      </section>
    );
  }

  if (activeView === "workOverview") {
    return <WorkSummary user={currentUser} scope={accessScope ?? null} />;
  }

  return (
    <section className="role-section">
      <div className="role-section__header">
        <h1>🎯 กรอก KPI</h1>
      </div>
      <KpiInputSection agencies={agencies} onSaved={onDataSaved} accessScope={accessScope} />
    </section>
  );
}
