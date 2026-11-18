import type { AccessScope } from "@/services/access-control";
import { FISCAL_YEARS } from "@/services/fiscal-year";
import type {
  AgencyCoverageRow,
  AgencyOption,
  District,
  IntakeEvaluationStatus,
  IntakeFormData,
  IntakeRecordRow,
  Province,
  ProvinceCoverageRow,
} from "@/types/mvp";

export type DashboardSectionProps = {
  formData: IntakeFormData;
  refreshKey: number;
  accessScope?: AccessScope;
  viewMode?: "public" | "backoffice";
  hideSavedRecords?: boolean;
  onSelectDistrictForIntake?: (selection: { agencyCode: string; provinceCode: string; districtCode: string }) => void;
};

export type SavedRecordDraft = {
  fiscalYear: number;
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  healthIssue: string;
};

export type ProvinceSubmissionProgress = {
  provinceCode: string;
  provinceName: string;
  agencyCode: string;
  agencyName: string;
  totalDistricts: number;
  submittedDistricts: number;
  pendingDistricts: number;
  submittedPercent: number;
  pendingPercent: number;
};

export type AgencySubmissionProgressGroup = {
  agencyCode: string;
  agencyName: string;
  provinces: ProvinceSubmissionProgress[];
};

export type CoverageChartRow = {
  code: string;
  name: string;
  record_count: number;
  submitted_count?: number;
  pending_count?: number;
  total_count?: number;
  submitted_percent?: number;
  pending_percent?: number;
  selected: boolean;
};

export type ProvinceHealthIssueRecord = {
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  districtName: string;
  subdistrictCode?: string;
  subdistrictName?: string;
  healthIssue: string;
  evaluationStatus: IntakeEvaluationStatus | null;
};

export type HealthIssueDonutRow = {
  issue: string;
  count: number;
  color: string;
};

export type DashboardInsightTab = "assessment" | "evaluation" | "group";

export type HealthIssueEvaluationRow = {
  issue: string;
  passCount: number;
  failCount: number;
  unknownCount: number;
  totalCount: number;
  passPercent: number;
  failPercent: number;
};

export const fiscalYears = [...FISCAL_YEARS];
export const latestRecordsPageSize = 10;
export const healthIssueDonutColors = ["#e11d48", "#2563eb", "#f59e0b", "#16a34a", "#7c3aed", "#0891b2", "#ea580c", "#475569", "#db2777", "#65a30d"];
export const healthIssueGroupLabels: Record<string, string> = {
  disease_health_risk: "โรคและภัยสุขภาพ",
  context_driver: "ประเด็นการขับเคลื่อนตามบริบท",
  other: "อื่นๆ / ไม่อยู่ในรายการหลัก",
};
export const recordCountLabelFormatter = (value: unknown) => Number(value ?? 0).toLocaleString("th-TH");
export const percentLabelFormatter = (value: unknown) => {
  const percent = Number(value ?? 0);
  if (percent <= 0) return "";
  return `${percent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%`;
};
export const donutPercentLabelFormatter = (props: any) => {
  const rawPercent = Number(props.percent ?? 0);
  const value = rawPercent > 1 ? rawPercent : rawPercent * 100;
  if (value <= 0) return null;

  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const radius = innerRadius + (outerRadius - innerRadius) * 0.52;
  const radians = -midAngle * (Math.PI / 180);
  const x = cx + radius * Math.cos(radians);
  const y = cy + radius * Math.sin(radians);
  const percent = value < 1
    ? "<1%"
    : `${value.toLocaleString("th-TH", { maximumFractionDigits: value < 10 ? 1 : 0 })}%`;

  return (
    <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" className="overview-issue-donut-label">
      {percent}
    </text>
  );
};

export const recordCountTooltipFormatter = (value: unknown) => [recordCountLabelFormatter(value), "จำนวนข้อมูล"];

export const evaluationStatusTooltipFormatter = (value: unknown, name: unknown) => [
  `${recordCountLabelFormatter(value)} ข้อมูล`,
  name === "passCount" ? "ผ่าน" : name === "failCount" ? "ไม่ผ่าน" : "ยังไม่ระบุผล",
];

export const getRelatedLabel = <T,>(value: T | T[] | null | undefined, picker: (item: T) => string | null | undefined) => {
  const item = Array.isArray(value) ? value[0] : value;
  return item ? picker(item) : undefined;
};
