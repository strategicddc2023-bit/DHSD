"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavigation from "@/components/AppNavigation";
import AccessRibbon from "@/components/AccessRibbon";
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
};

export default function MyWorkPage() {
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
    if (currentUser?.role === "superadmin") {
      router.replace("/");
      return;
    }
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser?.role, router, userLoaded]);

  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <AppNavigation user={currentUser} />
      <div className="content-wrap">
        <AccessRibbon user={currentUser} />
        <WorkSummary user={currentUser} scope={accessScope} />

        <section className="section work-section">
          <div className="section__header">
            <h2>ขั้นตอนทำงาน</h2>
            <p>นี่คือพื้นที่ที่ `admin` และ `user` ใช้จัดการข้อมูลของหน่วยงานตนเอง</p>
          </div>
          <div className="work-actions">
            <button className="cta cta--solid" onClick={scrollToInput} type="button">
              เริ่มกรอกข้อมูล
            </button>
            <button className="cta cta--ghost" onClick={() => router.replace("/")} type="button">
              ดู dashboard
            </button>
          </div>
        </section>

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

        <DashboardSection
          formData={formData}
          refreshKey={refreshKey}
          accessScope={accessScope ?? undefined}
          viewMode="backoffice"
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
