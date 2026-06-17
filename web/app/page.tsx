"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import DashboardSection from "@/components/DashboardSection";
import HeroSection from "@/components/HeroSection";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import { supabase } from "@/services/supabase-client";
import type { AgencyOption, AppUserRow, IntakeFormData } from "@/types/mvp";

const initialFormData: IntakeFormData = {
  agencyCode: "",
  provinceCode: "",
  districtCode: "",
  healthIssue: "",
};

export default function HomePage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
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
    <main>
      <AppNavigation user={currentUser} />
      <HeroSection />
      <div className="content-wrap">
        <DashboardSection
          formData={formData}
          refreshKey={refreshKey}
          accessScope={accessScope ?? undefined}
          viewMode="public"
          hideSavedRecords={true}
          onSelectDistrictForIntake={(selection) =>
            setFormData((prev) => ({
              ...prev,
              agencyCode: selection.agencyCode,
              provinceCode: selection.provinceCode,
              districtCode: selection.districtCode,
            }))
          }
        />
      </div>
    </main>
  );
}
