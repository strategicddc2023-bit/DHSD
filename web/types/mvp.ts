export type AgencyOption = {
  code: string;
  label_th: string;
};

export type Province = {
  code: string;
  name_th: string;
};

export type District = {
  code: string;
  name_th: string;
  province_code: string;
};

export type Subdistrict = {
  code: string;
  name_th: string;
  district_code: string;
  province_code: string;
};

export type IntakeFormData = {
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  healthIssue: string;
};

export type IntakeRecordRow = {
  id: string;
  created_at: string;
  health_issue_text: string;
  agency_code: string;
  province_code: string;
  district_code: string;
  subdistrict_code?: string | null;
  master_agencies: { label_th: string } | { label_th: string }[] | null;
  master_provinces: { name_th: string } | { name_th: string }[] | null;
  master_districts: { name_th: string } | { name_th: string }[] | null;
  master_subdistricts?: { name_th: string } | { name_th: string }[] | null;
};

export type AgencyCoverageRow = {
  agency_code: string;
  agency_name: string;
  record_count: number;
};

export type ProvinceCoverageRow = {
  province_code: string;
  province_name: string;
  agency_code: string;
  agency_name: string;
  record_count: number;
};

export type AgencyProvinceMapRow = {
  agency_code: string;
  province_code: string;
};

export type KpiDashboardRow = {
  agency_code: string;
  agency_name: string;
  fiscal_year: number;
  kpi_code: "KPI1" | "KPI2" | "KPI3";
  percent_value: number;
  score_value: number;
  updated_at: string;
};

export type KpiSummaryRow = {
  fiscal_year: number;
  kpi_code: "KPI1" | "KPI2" | "KPI3";
  kpi_name_th: string;
  avg_percent: number;
  avg_score: number;
  agency_count: number;
};

export type AppRole = "superadmin" | "admin" | "user";
export type AppUserStatus = "pending" | "active" | "suspended";

export type AppUserRow = {
  id: string;
  auth_user_id: string | null;
  thai_d_sub: string | null;
  role: AppRole;
  agency_code: string | null;
  province_code: string | null;
  district_code: string | null;
  status: AppUserStatus;
  last_login_at: string | null;
};
