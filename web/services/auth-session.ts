import { supabase } from "@/services/supabase-client";
import { normalizeAgencyCode, type AccessScope } from "@/services/access-control";
import type { AppUserRow } from "@/types/mvp";

const appUserSelect = "id,auth_user_id,thai_d_sub,role,agency_code,province_code,district_code,status,last_login_at";

export async function loadCurrentAppUser(): Promise<AppUserRow | null> {
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("app_users")
    .select(appUserSelect)
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { ...(data as AppUserRow), agency_code: normalizeAgencyCode(data.agency_code) };
}

export function buildAccessScope(user: AppUserRow | null): AccessScope | null {
  if (!user) {
    return null;
  }

  return {
    role: user.role,
    agencyCode: user.agency_code,
    provinceCode: user.province_code,
  };
}

export function getAccessSummary(user: AppUserRow | null): string {
  if (!user) {
    return "โหมดพรีวิว";
  }

  if (user.role === "superadmin") {
    return "เห็นทุก scope";
  }

  if (user.role === "admin") {
    return user.province_code ? `ดูภาพรวม สคร. ${user.agency_code ?? "-"} / จังหวัด ${user.province_code}` : `ดูภาพรวม สคร. ${user.agency_code ?? "-"}`;
  }

  return `หน่วยงาน ${user.agency_code ?? "-"}`;
}
