"use client";

import { useEffect, useState } from "react";
import AppNavigation from "@/components/AppNavigation";
import AccessDeniedPanel from "@/components/AccessDeniedPanel";
import AccessRibbon from "@/components/AccessRibbon";
import AccessSmokeTestPanel from "@/components/AccessSmokeTestPanel";
import MapSmokeTestPanel from "@/components/MapSmokeTestPanel";
import { buildAccessScope, loadCurrentAppUser } from "@/services/auth-session";
import type { AppUserRow } from "@/types/mvp";

export default function SmokeTestPage() {
  const [currentUser, setCurrentUser] = useState<AppUserRow | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await loadCurrentAppUser();
      setCurrentUser(user);
    };

    void loadUser();
  }, []);

  const accessScope = buildAccessScope(currentUser);
  const isSuperadmin = currentUser?.role === "superadmin";

  return (
    <main>
      <AppNavigation user={currentUser} />
      <div className="content-wrap">
        <AccessRibbon user={currentUser} />
        {!isSuperadmin ? (
          <AccessDeniedPanel />
        ) : (
          <section className="section">
            <div className="section__header">
              <h1>Access Smoke Test</h1>
              <p>หน้าทดสอบสิทธิ์สำหรับ superadmin / admin / user ก่อนเข้า production flow</p>
            </div>
            <AccessSmokeTestPanel currentScope={accessScope ?? undefined} />
            <MapSmokeTestPanel />
          </section>
        )}
      </div>
    </main>
  );
}
