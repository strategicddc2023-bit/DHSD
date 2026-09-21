import type { AccessScope } from "@/services/access-control";
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

export const fiscalYears = [2566, 2567, 2568, 2569, 2570];
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
export const splitDonutLabel = (text: string, maxLineLength = 16) => {
  const value = text.trim();
  if (value.length <= maxLineLength) return [value];
  const breakAt = value.lastIndexOf(" ", maxLineLength);
  const firstLineEnd = breakAt > 6 ? breakAt : maxLineLength;
  const first = value.slice(0, firstLineEnd).trim();
  const second = value.slice(firstLineEnd).trim();
  return [first, second.length > maxLineLength ? `${second.slice(0, maxLineLength - 1).trim()}...` : second];
};

export const donutPercentLabelFormatter = (props: any) => {
  const rawPercent = Number(props.payload?.percent ?? props.percent ?? 0);
  const value = rawPercent > 1 ? rawPercent : rawPercent * 100;
  if (value < 5) return null;

  const issue = props.payload?.issue ?? props.issue ?? "";
  const percent = `${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  const lines = splitDonutLabel(issue);
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const cx = Number(props.cx ?? 0);
  const fill = props.fill ?? "#0f3349";
  const textAnchor = x >= cx ? "start" : "end";

  return (
    <text x={x} y={y} fill={fill} textAnchor={textAnchor} dominantBaseline="central" className="overview-issue-donut-label">
      <tspan x={x} dy={lines.length > 1 ? "-0.55em" : "0"}>{lines[0]}</tspan>
      <tspan x={x} dy="1.15em">{lines.length > 1 ? `${lines[1]} ${percent}` : percent}</tspan>
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
