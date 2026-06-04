import type { AppRole } from "@/types/mvp";

export type AccessScope = {
  role: AppRole;
  agencyCode?: string | null;
  provinceCode?: string | null;
};

export function canViewAll(scope: AccessScope): boolean {
  return scope.role === "superadmin";
}

export function canViewAgency(scope: AccessScope, agencyCode: string): boolean {
  if (scope.role === "superadmin") return true;
  if (scope.agencyCode && scope.agencyCode === agencyCode) return true;
  return false;
}

export function canViewProvince(scope: AccessScope, provinceCode: string): boolean {
  if (scope.role === "superadmin") return true;
  if (scope.role === "admin" && scope.provinceCode && scope.provinceCode === provinceCode) return true;
  return false;
}

export function canSubmitForOwnAgency(scope: AccessScope, agencyCode: string): boolean {
  if (scope.role === "superadmin") return true;
  return scope.agencyCode === agencyCode;
}

export function isScopedUser(scope: AccessScope): boolean {
  return scope.role !== "superadmin";
}

export function resolveVisibleAgencyCodes(
  scope: AccessScope,
  agencyProvinceMap: Array<{ agency_code: string; province_code: string }>,
  allAgencyCodes: string[]
): string[] {
  if (scope.role === "superadmin") {
    return allAgencyCodes;
  }

  if (scope.agencyCode) {
    return [scope.agencyCode];
  }

  const agencyCodes = new Set<string>();
  agencyProvinceMap.forEach((row) => {
    if (scope.provinceCode && row.province_code === scope.provinceCode) {
      agencyCodes.add(row.agency_code);
    }
  });

  return [...agencyCodes];
}

export function resolveVisibleProvinceCodes(
  scope: AccessScope,
  agencyProvinceMap: Array<{ agency_code: string; province_code: string }>,
  allProvinceCodes: string[]
): string[] {
  if (scope.role === "superadmin") {
    return allProvinceCodes;
  }

  if (scope.provinceCode) {
    return [scope.provinceCode];
  }

  if (scope.agencyCode) {
    return [...new Set(agencyProvinceMap.filter((row) => row.agency_code === scope.agencyCode).map((row) => row.province_code))];
  }

  return [];
}

export type AccessPermissionSnapshot = {
  canViewAll: boolean;
  canViewTargetAgency: boolean;
  canViewTargetProvince: boolean;
  canSubmitTargetAgency: boolean;
  canManageUsers: boolean;
};

export function buildAccessPermissionSnapshot(
  scope: AccessScope,
  targetAgencyCode: string,
  targetProvinceCode: string
): AccessPermissionSnapshot {
  const viewAll = canViewAll(scope);
  const viewTargetAgency = canViewAgency(scope, targetAgencyCode);
  const viewTargetProvince = canViewProvince(scope, targetProvinceCode);
  const submitTargetAgency = canSubmitForOwnAgency(scope, targetAgencyCode);

  return {
    canViewAll: viewAll,
    canViewTargetAgency: viewTargetAgency,
    canViewTargetProvince: viewTargetProvince,
    canSubmitTargetAgency: submitTargetAgency,
    canManageUsers: viewAll,
  };
}
