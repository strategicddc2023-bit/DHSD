"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import DashboardSection from "@/components/DashboardSection";
import HeroSection from "@/components/HeroSection";
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

export default function HomePage() {
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [refreshKey, setRefreshKey] = useState(0);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const inputRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!userLoaded) return;
    if (currentUser?.role === "admin" || currentUser?.role === "user") {
      router.replace("/my-work");
    }
  }, [currentUser?.role, router, userLoaded]);

  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <AppNavigation user={currentUser} />
      <HeroSection onScrollToForm={scrollToInput} />
      <div className="content-wrap">
        {currentUser?.role === "superadmin" ? (
          <>
            <div ref={inputRef}>
              <IntakeFormSection
                formData={formData}
                onChange={setFormData}
                onSaved={() => setRefreshKey((prev) => prev + 1)}
                accessScope={accessScope ?? undefined}
              />
            </div>

            <KpiInputSection
              agencies={agencies}
              onSaved={() => setRefreshKey((prev) => prev + 1)}
              accessScope={accessScope ?? undefined}
            />
          </>
        ) : null}

        <DashboardSection
          formData={formData}
          refreshKey={refreshKey}
          accessScope={accessScope ?? undefined}
          viewMode={currentUser?.role === "superadmin" ? "backoffice" : "public"}
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
