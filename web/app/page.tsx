"use client";

import { useEffect, useState } from "react";
import DashboardSection from "@/components/DashboardSection";
import type { WorkspaceMenuView } from "@/components/dashboard/dashboard-shared";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import { getDefaultFiscalYear } from "@/services/fiscal-year";
import type { AppUserRow, IntakeFormData } from "@/types/mvp";
import styles from "./page.module.css";

const initialFormData: IntakeFormData = {
  fiscalYear: getDefaultFiscalYear(),
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
  healthIssueId: "",
  healthIssueMembershipId: "",
  healthIssueGroup: "",
  evaluationStatus: "",
};

export default function HomePage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [activeWorkspaceView, setActiveWorkspaceView] = useState<WorkspaceMenuView>("dashboard");
  const accessScope = buildAccessScope(currentUser);

  useEffect(() => {
    const loadUser = async () => {
      const user = await loadCurrentAppUser();
      setCurrentUser(user);
      setIsUserLoaded(true);
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

  return (
    <main className={styles.dashboardPage}>
      <DashboardSection
        formData={formData}
        refreshKey={refreshKey}
        accessScope={accessScope ?? undefined}
        viewMode="public"
        hideSavedRecords={true}
        currentUser={currentUser}
        isUserLoading={!isUserLoaded}
        activeWorkspaceView={activeWorkspaceView}
        onSelectWorkspaceView={setActiveWorkspaceView}
        onFormDataChange={setFormData}
        onDataSaved={() => setRefreshKey((prev) => prev + 1)}
        onLoggedOut={() => {
          setCurrentUser(null);
          setActiveWorkspaceView("dashboard");
          setFormData(initialFormData);
        }}
        onSelectDistrictForIntake={(selection) =>
          setFormData((prev) => ({
            ...prev,
            agencyCode: selection.agencyCode,
            provinceCode: selection.provinceCode,
            districtCode: selection.districtCode,
          }))
        }
      />
    </main>
  );
}
