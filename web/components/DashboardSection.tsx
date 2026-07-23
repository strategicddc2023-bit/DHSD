"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { AccessScope } from "@/services/access-control";
import { resolveVisibleAgencyCodes, resolveVisibleProvinceCodes } from "@/services/access-control";
import { supabase } from "@/services/supabase-client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LabelList } from 'recharts';
import DashboardAgencySelector from "@/components/DashboardAgencySelector";
import InteractiveHealthMap from "@/components/InteractiveHealthMap";
import HealthIssueDistributionMap from "@/components/HealthIssueDistributionMap";
import { loadDistrictHealthIssueSummary } from "@/services/health-issue-service";
import type { DistrictHealthIssueSummary } from "@/services/health-issue-service";
import SuperadminUsersPanel from "@/components/SuperadminUsersPanel";
import {
  forecastLabel,
  forecastPercent,
  overallRiskFromCounts,
  overallRiskLabel,
  overallRiskTone,
  kpiStatusFromPercent,
  kpiStatusLabel,
  kpiStatusTone,
  trendDirectionFromDelta,
  trendLabel,
} from "@/services/dashboard-analytics";
import type { ReadinessCheck } from "@/services/qa-readiness";
import { readinessLabel, readinessTone } from "@/services/qa-readiness";
import type {
  AgencyCoverageRow,
  AgencyProvinceMapRow,
  AgencyOption,
  District,
  IntakeEvaluationStatus,
  IntakeFormData,
  IntakeRecordRow,
  HealthIssueOption,
  KpiSummaryRow,
  Province,
  ProvinceCoverageRow,
} from "@/types/mvp";

type DashboardSectionProps = {
  formData: IntakeFormData;
  refreshKey: number;
  accessScope?: AccessScope;
  viewMode?: "public" | "backoffice";
  hideSavedRecords?: boolean;
  onSelectDistrictForIntake?: (selection: { agencyCode: string; provinceCode: string; districtCode: string }) => void;
};

type SavedRecordDraft = {
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  healthIssue: string;
};

type ProvinceSubmissionProgress = {
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

type AgencySubmissionProgressGroup = {
  agencyCode: string;
  agencyName: string;
  provinces: ProvinceSubmissionProgress[];
};

type CoverageChartRow = {
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

type ProvinceHealthIssueRecord = {
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  districtName: string;
  subdistrictCode?: string;
  subdistrictName?: string;
  healthIssue: string;
  evaluationStatus: IntakeEvaluationStatus | null;
};

type HealthIssueDonutRow = {
  issue: string;
  count: number;
  color: string;
};

type DashboardInsightTab = "assessment" | "evaluation" | "group";

type HealthIssueEvaluationRow = {
  issue: string;
  passCount: number;
  failCount: number;
  unknownCount: number;
  totalCount: number;
  passPercent: number;
  failPercent: number;
};

const fiscalYears = [2566, 2567, 2568, 2569, 2570];
const latestRecordsPageSize = 10;
const healthIssueDonutColors = ["#e11d48", "#2563eb", "#f59e0b", "#16a34a", "#7c3aed", "#0891b2", "#ea580c", "#475569", "#db2777", "#65a30d"];
const healthIssueGroupLabels: Record<string, string> = {
  disease_health_risk: "โรคและภัยสุขภาพ",
  context_driver: "ประเด็นการขับเคลื่อนตามบริบท",
  other: "อื่นๆ / ไม่อยู่ในรายการหลัก",
};
const recordCountLabelFormatter = (value: unknown) => Number(value ?? 0).toLocaleString("th-TH");
const percentLabelFormatter = (value: unknown) => {
  const percent = Number(value ?? 0);
  if (percent <= 0) return "";
  return `${percent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%`;
};
const splitDonutLabel = (text: string, maxLineLength = 16) => {
  const value = text.trim();
  if (value.length <= maxLineLength) return [value];
  const breakAt = value.lastIndexOf(" ", maxLineLength);
  const firstLineEnd = breakAt > 6 ? breakAt : maxLineLength;
  const first = value.slice(0, firstLineEnd).trim();
  const second = value.slice(firstLineEnd).trim();
  return [first, second.length > maxLineLength ? `${second.slice(0, maxLineLength - 1).trim()}...` : second];
};

const donutPercentLabelFormatter = (props: any) => {
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

const recordCountTooltipFormatter = (value: unknown) => [recordCountLabelFormatter(value), "จำนวนข้อมูล"];

const evaluationStatusTooltipFormatter = (value: unknown, name: unknown) => [
  `${recordCountLabelFormatter(value)} ข้อมูล`,
  name === "passCount" ? "ผ่าน" : name === "failCount" ? "ไม่ผ่าน" : "ยังไม่ระบุผล",
];

const getRelatedLabel = <T,>(value: T | T[] | null | undefined, picker: (item: T) => string | null | undefined) => {
  const item = Array.isArray(value) ? value[0] : value;
  return item ? picker(item) : undefined;
};

export default function DashboardSection({ formData, refreshKey, accessScope, viewMode = "backoffice", hideSavedRecords = false, onSelectDistrictForIntake }: DashboardSectionProps) {
  const mapRef = useRef<any>(null);
  const [rows, setRows] = useState<IntakeRecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [agencyActiveCount, setAgencyActiveCount] = useState(0);
  const [provinceActiveCount, setProvinceActiveCount] = useState(0);
  const [topAgency, setTopAgency] = useState("-");
  const [topProvince, setTopProvince] = useState("-");
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [agencyProvinceMap, setAgencyProvinceMap] = useState<AgencyProvinceMapRow[]>([]);
  const [agencyCoverage, setAgencyCoverage] = useState<AgencyCoverageRow[]>([]);
  const [provinceCoverage, setProvinceCoverage] = useState<ProvinceCoverageRow[]>([]);
  const [submittedDistrictCodesByProvince, setSubmittedDistrictCodesByProvince] = useState<Record<string, string[]>>({});
  const [districtRecordCount, setDistrictRecordCount] = useState<Record<string, number>>({});
  // Removed: subdistrictRecordCount - master_subdistricts table doesn't exist
  const [kpiSummaryRows, setKpiSummaryRows] = useState<KpiSummaryRow[]>([]);
  const [previousKpiSummaryRows, setPreviousKpiSummaryRows] = useState<KpiSummaryRow[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2569);
  const [filterAgency, setFilterAgency] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedSubdistrictCode, setSelectedSubdistrictCode] = useState("");

  const selectedDistrictName = useMemo(() => {
    if (!selectedDistrictCode) return "";
    return districts.find((d) => d.code === selectedDistrictCode)?.name_th ?? selectedDistrictCode;
  }, [selectedDistrictCode, districts]);

  const [districtHealthIssueData, setDistrictHealthIssueData] = useState<{ issue: string; count: number }[]>([]);
  const [districtHealthIssueTotal, setDistrictHealthIssueTotal] = useState(0);
  const [districtHealthIssueLoading, setDistrictHealthIssueLoading] = useState(false);
  const [provinceHealthIssueRecords, setProvinceHealthIssueRecords] = useState<ProvinceHealthIssueRecord[]>([]);
  const [healthIssueScopeRecords, setHealthIssueScopeRecords] = useState<ProvinceHealthIssueRecord[]>([]);
  const [masterHealthIssues, setMasterHealthIssues] = useState<HealthIssueOption[]>([]);
  const [dashboardInsightTab, setDashboardInsightTab] = useState<DashboardInsightTab>("assessment");
  const [selectedHealthIssue, setSelectedHealthIssue] = useState("");
  const [selectedOverviewIssue, setSelectedOverviewIssue] = useState("");
  const [selectedOverviewMapIssue, setSelectedOverviewMapIssue] = useState("");
  const [selectedOverviewMapProvinceCode, setSelectedOverviewMapProvinceCode] = useState("");
  const [selectedOverviewMapDistrictCode, setSelectedOverviewMapDistrictCode] = useState("");
  const [issueDetailScope, setIssueDetailScope] = useState<"agency" | "province" | "district">("agency");
  const [overviewFilter, setOverviewFilter] = useState<"agency-order" | "province-active">("agency-order");
  const [latestRecordsPage, setLatestRecordsPage] = useState(1);
  const [recordsRefreshKey, setRecordsRefreshKey] = useState(0);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SavedRecordDraft | null>(null);
  const [recordActionMessage, setRecordActionMessage] = useState("");
  const [savingRecordId, setSavingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const activeAgencyFilter = accessScope?.agencyCode ?? filterAgency;
  const activeProvinceFilter = accessScope?.provinceCode ?? filterProvince;
  const canViewSavedRecords = accessScope?.role === "superadmin" || accessScope?.role === "admin";

  const visibleAgencyCodes = useMemo(
    () => resolveVisibleAgencyCodes(accessScope ?? { role: "superadmin" }, agencyProvinceMap, agencies.map((item) => item.code)),
    [accessScope, agencyProvinceMap, agencies]
  );

  const visibleProvinceCodes = useMemo(
    () =>
      resolveVisibleProvinceCodes(
        accessScope ?? { role: "superadmin" },
        agencyProvinceMap,
        provinces.map((item) => item.code)
      ),
    [accessScope, agencyProvinceMap, provinces]
  );

  const visibleAgencies = useMemo(() => agencies.filter((agency) => visibleAgencyCodes.includes(agency.code)), [agencies, visibleAgencyCodes]);
  const visibleProvinces = useMemo(() => provinces.filter((province) => visibleProvinceCodes.includes(province.code)), [provinces, visibleProvinceCodes]);
  const dashboardProvinceOptions = useMemo(() => {
    if (!activeAgencyFilter) {
      return visibleProvinces;
    }

    const allowedProvinceCodes = new Set(
      agencyProvinceMap.filter((item) => item.agency_code === activeAgencyFilter).map((item) => item.province_code)
    );

    return visibleProvinces.filter((province) => allowedProvinceCodes.has(province.code));
  }, [activeAgencyFilter, agencyProvinceMap, visibleProvinces]);
  const dashboardDistrictOptions = useMemo(() => {
    if (!activeProvinceFilter) {
      return [] as District[];
    }

    return districts
      .filter((district) => district.province_code === activeProvinceFilter)
      .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"));
  }, [activeProvinceFilter, districts]);
  const editProvinceOptions = useMemo(() => {
    if (!editDraft?.agencyCode) {
      return [] as Province[];
    }

    const allowedProvinceCodes = new Set(
      agencyProvinceMap.filter((item) => item.agency_code === editDraft.agencyCode).map((item) => item.province_code)
    );

    return visibleProvinces.filter((province) => allowedProvinceCodes.has(province.code));
  }, [agencyProvinceMap, editDraft?.agencyCode, visibleProvinces]);
  
  const editDistrictOptions = useMemo(() => {
    if (!editDraft?.provinceCode) {
      return [] as District[];
    }

    return districts.filter((district) => district.province_code === editDraft.provinceCode);
  }, [districts, editDraft?.provinceCode]);

  const visibleAgencyCoverage = useMemo(
    () => agencyCoverage.filter((item) => visibleAgencyCodes.includes(item.agency_code)),
    [agencyCoverage, visibleAgencyCodes]
  );
  const visibleProvinceCoverage = useMemo(
    () => provinceCoverage.filter((item) => visibleProvinceCodes.includes(item.province_code)),
    [provinceCoverage, visibleProvinceCodes]
  );
  const showAdvancedPanels = viewMode === "backoffice";
  const latestRecordsPageCount = Math.max(1, Math.ceil(totalCount / latestRecordsPageSize));
  const latestRecordsStart = totalCount === 0 ? 0 : (latestRecordsPage - 1) * latestRecordsPageSize + 1;
  const latestRecordsEnd = Math.min(totalCount, latestRecordsPage * latestRecordsPageSize);
  const dashboardMenuAgencies = useMemo(
    () => visibleAgencies.filter((agency) => /^DPC\d{2}$/.test(agency.code)),
    [visibleAgencies]
  );
  const overviewAreaTotals = useMemo(() => {
    const provinceCodes = new Set(visibleProvinces.map((province) => province.code));
    const visibleDistricts = districts.filter((district) => provinceCodes.has(district.province_code));
    const districtKeys = new Set(visibleDistricts.map((district) => `${district.province_code}::${district.code}`));
    const submittedDistrictKeys = new Set<string>();

    Object.entries(submittedDistrictCodesByProvince).forEach(([provinceCode, districtCodes]) => {
      if (!provinceCodes.has(provinceCode)) return;
      districtCodes.forEach((districtCode) => {
        const key = `${provinceCode}::${districtCode}`;
        if (districtKeys.has(key)) {
          submittedDistrictKeys.add(key);
        }
      });
    });

    const districtCount = visibleDistricts.length;
    const submittedDistrictCount = submittedDistrictKeys.size;
    const pendingDistrictCount = Math.max(0, districtCount - submittedDistrictCount);
    const submittedPercent = districtCount > 0 ? Number(((submittedDistrictCount / districtCount) * 100).toFixed(2)) : 0;
    const pendingPercent = districtCount > 0 ? Number(((pendingDistrictCount / districtCount) * 100).toFixed(2)) : 0;

    return {
      agencyCount: dashboardMenuAgencies.length,
      provinceCount: visibleProvinces.length,
      districtCount,
      submittedDistrictCount,
      pendingDistrictCount,
      submittedPercent,
      pendingPercent,
    };
  }, [dashboardMenuAgencies.length, districts, submittedDistrictCodesByProvince, visibleProvinces]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [agencyRes, provinceRes, districtRes, mappingRes, healthIssueRes] = await Promise.all([
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("master_districts").select("code,name_th,province_code").order("name_th", { ascending: true }),
        supabase.from("agency_provinces").select("agency_code,province_code"),
        supabase
          .from("master_health_issues")
          .select("id,name_th,issue_group,is_active,sort_order,created_at,updated_at")
          .order("issue_group", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("name_th", { ascending: true }),
      ]);

      setAgencies(agencyRes.data ?? []);
      setProvinces(provinceRes.data ?? []);
      setDistricts(districtRes.data ?? []);
      setAgencyProvinceMap((mappingRes.data as AgencyProvinceMapRow[]) ?? []);
      setMasterHealthIssues((healthIssueRes.data as HealthIssueOption[]) ?? []);
    };

    void loadFilterOptions();
  }, []);

  useEffect(() => {
    setLatestRecordsPage(1);
  }, [refreshKey, activeAgencyFilter, activeProvinceFilter]);

  useEffect(() => {
    if (latestRecordsPage > latestRecordsPageCount) {
      setLatestRecordsPage(latestRecordsPageCount);
    }
  }, [latestRecordsPage, latestRecordsPageCount]);

  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);
      const previousFiscalYear = selectedFiscalYear > fiscalYears[0] ? selectedFiscalYear - 1 : null;
      const latestRecordsFrom = (latestRecordsPage - 1) * latestRecordsPageSize;
      const latestRecordsTo = latestRecordsFrom + latestRecordsPageSize - 1;

      let query = supabase
        .from("intake_records")
        .select(
          "id,created_at,health_issue_text,evaluation_status,agency_code,province_code,district_code,master_agencies(label_th),master_provinces(name_th),master_districts(name_th)"
        )
        .order("created_at", { ascending: false })
        .range(latestRecordsFrom, latestRecordsTo);

      let countQuery = supabase.from("intake_records").select("*", { count: "exact", head: true });

      if (activeAgencyFilter) query = query.eq("agency_code", activeAgencyFilter);
      if (activeProvinceFilter) query = query.eq("province_code", activeProvinceFilter);
      if (selectedDistrictCode) query = query.eq("district_code", selectedDistrictCode);

      if (activeAgencyFilter) countQuery = countQuery.eq("agency_code", activeAgencyFilter);
      if (activeProvinceFilter) countQuery = countQuery.eq("province_code", activeProvinceFilter);
      if (selectedDistrictCode) countQuery = countQuery.eq("district_code", selectedDistrictCode);

      const [{ data }, { count }, intakeSummaryRes, kpiSummaryRes, previousKpiSummaryRes] = await Promise.all([
        canViewSavedRecords ? query : Promise.resolve({ data: [] as IntakeRecordRow[] }),
        countQuery,
        (() => {
          let summaryQuery = supabase
            .from("intake_records")
            .select("agency_code,province_code,district_code,health_issue_text,evaluation_status,master_agencies(label_th),master_provinces(name_th),master_districts(name_th)")
            .limit(5000);

          if (activeAgencyFilter) summaryQuery = summaryQuery.eq("agency_code", activeAgencyFilter);
          if (activeProvinceFilter) summaryQuery = summaryQuery.eq("province_code", activeProvinceFilter);

          return summaryQuery;
        })(),
        supabase
          .from("v_kpi_summary_dashboard")
          .select("fiscal_year,kpi_code,kpi_name_th,avg_percent,avg_score,agency_count")
          .eq("fiscal_year", selectedFiscalYear),
        previousFiscalYear
          ? supabase
              .from("v_kpi_summary_dashboard")
              .select("fiscal_year,kpi_code,kpi_name_th,avg_percent,avg_score,agency_count")
              .eq("fiscal_year", previousFiscalYear)
          : Promise.resolve({ data: [] as KpiSummaryRow[] }),
      ]);

      setRows((data as IntakeRecordRow[]) ?? []);
      setTotalCount(count ?? 0);
      setKpiSummaryRows((kpiSummaryRes.data as KpiSummaryRow[]) ?? []);
      setPreviousKpiSummaryRows((previousKpiSummaryRes.data as KpiSummaryRow[]) ?? []);

      const summaryRows =
        (intakeSummaryRes.data as
          | Array<{
              agency_code: string;
              province_code: string;
              district_code: string | null;
              health_issue_text: string | null;
              evaluation_status: IntakeEvaluationStatus | null;
              master_agencies: { label_th: string }[] | null;
              master_provinces: { name_th: string }[] | null;
              master_districts: { name_th: string }[] | null;
            }>
          | null) ?? [];

      const agencySet = new Set(summaryRows.map((item) => item.agency_code).filter(Boolean));
      const provinceSet = new Set(summaryRows.map((item) => item.province_code).filter(Boolean));
      setAgencyActiveCount(agencySet.size);
      setProvinceActiveCount(provinceSet.size);

      const agencyMap = new Map<string, number>();
      const provinceMap = new Map<string, number>();
      const districtMap = new Map<string, number>();
      const submittedDistrictMap = new Map<string, Set<string>>();
      const healthIssueMap = new Map<string, ProvinceHealthIssueRecord>();
      const healthIssueRows: ProvinceHealthIssueRecord[] = [];
      
      summaryRows.forEach((item) => {
        if (item.agency_code) {
          agencyMap.set(item.agency_code, (agencyMap.get(item.agency_code) ?? 0) + 1);
        }
        if (item.province_code) {
          provinceMap.set(item.province_code, (provinceMap.get(item.province_code) ?? 0) + 1);
        }
        if (item.province_code && item.district_code) {
          if (!submittedDistrictMap.has(item.province_code)) {
            submittedDistrictMap.set(item.province_code, new Set<string>());
          }
          submittedDistrictMap.get(item.province_code)?.add(item.district_code);
          const districtKey = `${item.province_code}::${item.district_code}`;
          districtMap.set(districtKey, (districtMap.get(districtKey) ?? 0) + 1);
        }
        const healthIssue = item.health_issue_text?.trim();
        if (item.province_code && item.district_code && healthIssue) {
          const key = `${item.district_code}::${healthIssue.toLocaleLowerCase("th-TH")}`;
          const districtName = getRelatedLabel(item.master_districts, (district) => district.name_th) ?? item.district_code;
          healthIssueRows.push({
            agencyCode: item.agency_code,
            provinceCode: item.province_code,
            districtCode: item.district_code,
            districtName,
            healthIssue,
            evaluationStatus: item.evaluation_status ?? null,
          });
          if (!healthIssueMap.has(key)) {
            healthIssueMap.set(key, {
              agencyCode: item.agency_code,
              provinceCode: item.province_code,
              districtCode: item.district_code,
              districtName,
              healthIssue,
              evaluationStatus: item.evaluation_status ?? null,
            });
          }
        }
      });
      setSubmittedDistrictCodesByProvince(
        Object.fromEntries([...submittedDistrictMap.entries()].map(([provinceCode, districtCodes]) => [provinceCode, [...districtCodes]]))
      );
      setDistrictRecordCount(Object.fromEntries(districtMap));
      setProvinceHealthIssueRecords([...healthIssueMap.values()]);
      setHealthIssueScopeRecords(healthIssueRows);

      const topA = [...agencyMap.entries()].sort((x, y) => y[1] - x[1])[0];
      const topP = [...provinceMap.entries()].sort((x, y) => y[1] - x[1])[0];
      setTopAgency(topA ? `${agencies.find((item) => item.code === topA[0])?.label_th ?? topA[0]} (${topA[1]})` : "-");
      setTopProvince(topP ? `${provinces.find((item) => item.code === topP[0])?.name_th ?? topP[0]} (${topP[1]})` : "-");

      const coverageRows: AgencyCoverageRow[] = agencies.map((agency) => ({
        agency_code: agency.code,
        agency_name: agency.label_th,
        record_count: agencyMap.get(agency.code) ?? 0,
      }));
      setAgencyCoverage(coverageRows);

      const provinceCoverageRows: ProvinceCoverageRow[] = provinces.map((province) => {
        const agencyCode = agencyProvinceMap.find((item) => item.province_code === province.code)?.agency_code ?? "";
        const agencyName = agencies.find((item) => item.code === agencyCode)?.label_th ?? "-";
        return {
          province_code: province.code,
          province_name: province.name_th,
          agency_code: agencyCode,
          agency_name: agencyName,
          record_count: provinceMap.get(province.code) ?? 0,
        };
      });
      setProvinceCoverage(provinceCoverageRows);

      setLoading(false);
    };

    void loadRows();
  }, [
    refreshKey,
    recordsRefreshKey,
    activeAgencyFilter,
    activeProvinceFilter,
    selectedDistrictCode,
    agencies,
    provinces,
    agencyProvinceMap,
    selectedFiscalYear,
    latestRecordsPage,
    canViewSavedRecords,
  ]);

  const selectedAgencyLabel = useMemo(() => {
    return agencies.find((item) => item.code === formData.agencyCode)?.label_th ?? formData.agencyCode ?? "-";
  }, [agencies, formData.agencyCode]);

  const selectedProvinceLabel = useMemo(() => {
    return provinces.find((item) => item.code === formData.provinceCode)?.name_th ?? formData.provinceCode ?? "-";
  }, [provinces, formData.provinceCode]);

  const selectedMapAgencyLabel = useMemo(() => {
    const agencyCode = activeAgencyFilter || formData.agencyCode;
    return agencies.find((item) => item.code === agencyCode)?.label_th ?? agencyCode ?? "-";
  }, [agencies, activeAgencyFilter, formData.agencyCode]);

  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (activeAgencyFilter) chips.push(`หน่วยงาน: ${agencies.find((item) => item.code === activeAgencyFilter)?.label_th ?? activeAgencyFilter}`);
    if (activeProvinceFilter) chips.push(`จังหวัด: ${provinces.find((item) => item.code === activeProvinceFilter)?.name_th ?? activeProvinceFilter}`);
    if (selectedDistrictCode) chips.push(`อำเภอ: ${districts.find((d) => d.code === selectedDistrictCode)?.name_th ?? selectedDistrictCode}`);
    return chips;
  }, [agencies, activeAgencyFilter, activeProvinceFilter, provinces, selectedDistrictCode, districts]);

  const districtCountByProvince = useMemo(() => {
    return districts.reduce((acc, district) => {
      acc.set(district.province_code, (acc.get(district.province_code) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());
  }, [districts]);

  // Sync active filters to clear invalid child selections
  useEffect(() => {
    if (!activeAgencyFilter) {
      setFilterProvince("");
      setSelectedDistrictCode("");
      return;
    }

    if (activeProvinceFilter) {
      // Validate that the active province belongs to the active agency
      const isProvinceValid = agencyProvinceMap.some(
        (item) => item.agency_code === activeAgencyFilter && item.province_code === activeProvinceFilter
      );
      if (!isProvinceValid) {
        setFilterProvince("");
        setSelectedDistrictCode("");
      }
    } else {
      setSelectedDistrictCode("");
    }
  }, [activeAgencyFilter, activeProvinceFilter, agencyProvinceMap]);

  // Sync district when province changes
  useEffect(() => {
    if (selectedDistrictCode) {
      const belongsToProvince = districts.find((d) => d.code === selectedDistrictCode)?.province_code === activeProvinceFilter;
      if (!belongsToProvince) {
        setSelectedDistrictCode("");
      }
    }
  }, [activeProvinceFilter, selectedDistrictCode, districts]);

  const provinceSubmissionGroups = useMemo<AgencySubmissionProgressGroup[]>(() => {
    const scopedProvinces = visibleProvinceCoverage
      .filter((province) => !activeAgencyFilter || province.agency_code === activeAgencyFilter)
      .filter((province) => !activeProvinceFilter || province.province_code === activeProvinceFilter);

    const groups = new Map<string, AgencySubmissionProgressGroup>();
    scopedProvinces.forEach((province) => {
      const agencyCode = province.agency_code || "UNMAPPED";
      const agencyName = province.agency_name || "ยังไม่ผูก สคร.";
      const totalDistricts = districtCountByProvince.get(province.province_code) ?? 0;
      const submittedDistricts = Math.min(submittedDistrictCodesByProvince[province.province_code]?.length ?? 0, totalDistricts);
      const pendingDistricts = Math.max(0, totalDistricts - submittedDistricts);
      const submittedPercent = totalDistricts > 0 ? Number(((submittedDistricts / totalDistricts) * 100).toFixed(2)) : 0;
      const pendingPercent = totalDistricts > 0 ? Number((100 - submittedPercent).toFixed(2)) : 0;

      if (!groups.has(agencyCode)) {
        groups.set(agencyCode, {
          agencyCode,
          agencyName,
          provinces: [],
        });
      }

      groups.get(agencyCode)?.provinces.push({
        provinceCode: province.province_code,
        provinceName: province.province_name,
        agencyCode,
        agencyName,
        totalDistricts,
        submittedDistricts,
        pendingDistricts,
        submittedPercent,
        pendingPercent,
      });
    });

    const agencyOrder = new Map(agencies.map((agency, index) => [agency.code, index]));
    return [...groups.values()]
      .map((group) => ({
        ...group,
        provinces: group.provinces.sort((a, b) => a.provinceName.localeCompare(b.provinceName, "th")),
      }))
      .sort((a, b) => (agencyOrder.get(a.agencyCode) ?? 999) - (agencyOrder.get(b.agencyCode) ?? 999));
  }, [
    activeAgencyFilter,
    activeProvinceFilter,
    agencies,
    districtCountByProvince,
    submittedDistrictCodesByProvince,
    visibleProvinceCoverage,
  ]);

  const selectedIssueProvinceCode = activeProvinceFilter;

  const selectedAgencyAreaTotals = useMemo(() => {
    if (!activeAgencyFilter) {
      return {
        provinceCount: agencyActiveCount,
        districtCount: provinceActiveCount,
        submittedDistrictCount: 0,
        pendingDistrictCount: 0,
        submittedPercent: 0,
        pendingPercent: 0,
      };
    }

    const provinceCodes = new Set(
      agencyProvinceMap
        .filter((item) => item.agency_code === activeAgencyFilter)
        .map((item) => item.province_code)
    );
    const agencyDistricts = districts.filter((district) => provinceCodes.has(district.province_code));
    const districtKeys = new Set(agencyDistricts.map((district) => `${district.province_code}::${district.code}`));
    const submittedDistrictKeys = new Set<string>();

    Object.entries(submittedDistrictCodesByProvince).forEach(([provinceCode, districtCodes]) => {
      if (!provinceCodes.has(provinceCode)) return;
      districtCodes.forEach((districtCode) => {
        const key = `${provinceCode}::${districtCode}`;
        if (districtKeys.has(key)) {
          submittedDistrictKeys.add(key);
        }
      });
    });

    const districtCount = agencyDistricts.length;
    const submittedDistrictCount = submittedDistrictKeys.size;
    const pendingDistrictCount = Math.max(0, districtCount - submittedDistrictCount);
    const submittedPercent = districtCount > 0 ? Number(((submittedDistrictCount / districtCount) * 100).toFixed(2)) : 0;
    const pendingPercent = districtCount > 0 ? Number(((pendingDistrictCount / districtCount) * 100).toFixed(2)) : 0;

    return {
      provinceCount: provinceCodes.size,
      districtCount,
      submittedDistrictCount,
      pendingDistrictCount,
      submittedPercent,
      pendingPercent,
    };
  }, [activeAgencyFilter, agencyActiveCount, agencyProvinceMap, districts, provinceActiveCount, submittedDistrictCodesByProvince]);

  // Load district health issues
  useEffect(() => {
    if (!selectedDistrictCode) {
      setDistrictHealthIssueData([]);
      setDistrictHealthIssueTotal(0);
      setDistrictHealthIssueLoading(false);
      return;
    }

    let mounted = true;
    setDistrictHealthIssueLoading(true);

    const load = async () => {
      try {
        const summary = await loadDistrictHealthIssueSummary(selectedDistrictCode);
        if (!mounted) return;
        setDistrictHealthIssueData(summary.issues);
        setDistrictHealthIssueTotal(summary.totalCount);
      } catch {
        if (!mounted) return;
        setDistrictHealthIssueData([]);
        setDistrictHealthIssueTotal(0);
      } finally {
        if (mounted) setDistrictHealthIssueLoading(false);
      }
    };

    void load();
    return () => { mounted = false; };
  }, [selectedDistrictCode]);

  const coverageChartRows = useMemo<CoverageChartRow[]>(() => {
    // Drill-down to districts: when agency AND province are selected
    if (activeAgencyFilter && selectedIssueProvinceCode) {
      return districts
        .filter((district) => district.province_code === selectedIssueProvinceCode)
        .sort((a, b) => a.name_th.localeCompare(b.name_th, "th"))
        .map((district) => ({
          code: district.code,
          name: district.name_th,
          record_count: districtRecordCount[`${selectedIssueProvinceCode}::${district.code}`] ?? 0,
          selected: selectedDistrictCode === district.code,
        }));
    }

    if (activeAgencyFilter) {
      return visibleProvinceCoverage
        .filter((province) => province.agency_code === activeAgencyFilter)
        .filter((province) => !activeProvinceFilter || province.province_code === activeProvinceFilter)
        .sort((a, b) => a.province_name.localeCompare(b.province_name, "th"))
        .map((province) => {
          const totalDistricts = districtCountByProvince.get(province.province_code) ?? 0;
          const submittedDistricts = Math.min(submittedDistrictCodesByProvince[province.province_code]?.length ?? 0, totalDistricts);
          const pendingDistricts = Math.max(0, totalDistricts - submittedDistricts);

          return {
            code: province.province_code,
            name: province.province_name,
            record_count: submittedDistricts,
            submitted_count: submittedDistricts,
            pending_count: pendingDistricts,
            total_count: totalDistricts,
            selected: selectedIssueProvinceCode === province.province_code,
          };
        });
    }

    return visibleAgencyCoverage.map((agency) => ({
      code: agency.agency_code,
      name: agency.agency_name,
      record_count: agency.record_count,
      selected: agency.agency_code === formData.agencyCode,
    }));
  }, [activeAgencyFilter, activeProvinceFilter, formData.agencyCode, selectedIssueProvinceCode, visibleAgencyCoverage, visibleProvinceCoverage, districts, districtRecordCount, selectedDistrictCode, districtCountByProvince, submittedDistrictCodesByProvince]);

  const selectedIssueProvinceName = selectedIssueProvinceCode
    ? provinces.find((province) => province.code === selectedIssueProvinceCode)?.name_th ?? selectedIssueProvinceCode
    : "";

  const isDistrictMode = Boolean(activeAgencyFilter && selectedIssueProvinceCode);

  const healthIssueDonutScopeLabel = selectedDistrictCode
    ? `อำเภอ${selectedDistrictName}`
    : activeProvinceFilter
      ? `จังหวัด${selectedIssueProvinceName}`
      : activeAgencyFilter
        ? agencies.find((item) => item.code === activeAgencyFilter)?.label_th ?? activeAgencyFilter
        : "ภาพรวมทั้งประเทศ";

  const healthIssueDonutData = useMemo<HealthIssueDonutRow[]>(() => {
    const issueMap = new Map<string, number>();

    if (selectedDistrictCode) {
      districtHealthIssueData.forEach((item) => {
        issueMap.set(item.issue, (issueMap.get(item.issue) ?? 0) + item.count);
      });
    } else {
      healthIssueScopeRecords.forEach((record) => {
        issueMap.set(record.healthIssue, (issueMap.get(record.healthIssue) ?? 0) + 1);
      });
    }

    return [...issueMap.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"))
      .slice(0, 7)
      .map(([issue, count], index) => ({
        issue,
        count,
        color: healthIssueDonutColors[index % healthIssueDonutColors.length],
      }));
  }, [districtHealthIssueData, healthIssueScopeRecords, selectedDistrictCode]);

  const healthIssueDonutTotal = healthIssueDonutData.reduce((total, item) => total + item.count, 0);
  const overviewIssueTableRows = useMemo(() => {
    const grouped = new Map<string, { issue: string; count: number; provinceCodes: Set<string>; districtCodes: Set<string> }>();

    healthIssueScopeRecords.forEach((record) => {
      const key = record.healthIssue.trim();
      if (!key) return;
      if (!grouped.has(key)) {
        grouped.set(key, { issue: key, count: 0, provinceCodes: new Set<string>(), districtCodes: new Set<string>() });
      }
      const row = grouped.get(key);
      if (!row) return;
      row.count += 1;
      row.provinceCodes.add(record.provinceCode);
      row.districtCodes.add(record.districtCode);
    });

    return [...grouped.values()]
      .sort((a, b) => b.count - a.count || a.issue.localeCompare(b.issue, "th"))
      .slice(0, 8)
      .map((row) => {
        const totalDistrictCount = [...row.provinceCodes].reduce((total, provinceCode) => total + (districtCountByProvince.get(provinceCode) ?? 0), 0);
        const districtCount = row.districtCodes.size;
        return {
          issue: row.issue,
          count: row.count,
          provinceCount: row.provinceCodes.size,
          totalDistrictCount,
          districtCount,
          percent: totalDistrictCount > 0 ? Number(((districtCount / totalDistrictCount) * 100).toFixed(2)) : 0,
        };
      });
  }, [districtCountByProvince, healthIssueScopeRecords]);

  const overviewIssueChartRows = useMemo(
    () => [...overviewIssueTableRows].sort((a, b) => b.districtCount - a.districtCount || b.count - a.count || a.issue.localeCompare(b.issue, "th")),
    [overviewIssueTableRows]
  );
  const overviewIssueDonutRows = useMemo(
    () => overviewIssueChartRows.map((row, index) => ({
      ...row,
      color: healthIssueDonutColors[index % healthIssueDonutColors.length],
    })),
    [overviewIssueChartRows]
  );

  const healthIssueGroupRows = useMemo(() => {
    const issueGroupByName = new Map(masterHealthIssues.map((issue) => [issue.name_th.trim().toLocaleLowerCase("th-TH"), issue.issue_group]));
    const grouped = new Map<string, { group: string; label: string; recordCount: number; issueNames: Set<string>; provinceCodes: Set<string>; districtKeys: Set<string> }>();

    healthIssueScopeRecords.forEach((record) => {
      const issueName = record.healthIssue.trim();
      if (!issueName) return;
      const group = issueGroupByName.get(issueName.toLocaleLowerCase("th-TH")) ?? "other";
      const row = grouped.get(group) ?? {
        group,
        label: healthIssueGroupLabels[group] ?? group,
        recordCount: 0,
        issueNames: new Set<string>(),
        provinceCodes: new Set<string>(),
        districtKeys: new Set<string>(),
      };
      row.recordCount += 1;
      row.issueNames.add(issueName);
      row.provinceCodes.add(record.provinceCode);
      row.districtKeys.add(`${record.provinceCode}::${record.districtCode}`);
      grouped.set(group, row);
    });

    return [...grouped.values()]
      .sort((a, b) => b.recordCount - a.recordCount || a.label.localeCompare(b.label, "th"))
      .map((row, index) => ({
        group: row.group,
        label: row.label,
        recordCount: row.recordCount,
        issueCount: row.issueNames.size,
        provinceCount: row.provinceCodes.size,
        districtCount: row.districtKeys.size,
        color: healthIssueDonutColors[index % healthIssueDonutColors.length],
      }));
  }, [healthIssueScopeRecords, masterHealthIssues]);
  const healthIssueGroupTotal = healthIssueGroupRows.reduce((total, row) => total + row.recordCount, 0);

  const healthIssueEvaluationRows = useMemo<HealthIssueEvaluationRow[]>(() => {
    const grouped = new Map<string, { issue: string; passCount: number; failCount: number; unknownCount: number; totalCount: number }>();

    healthIssueScopeRecords.forEach((record) => {
      const issue = record.healthIssue.trim();
      if (!issue) return;
      const row = grouped.get(issue) ?? { issue, passCount: 0, failCount: 0, unknownCount: 0, totalCount: 0 };
      if (record.evaluationStatus === "pass") {
        row.passCount += 1;
      } else if (record.evaluationStatus === "fail") {
        row.failCount += 1;
      } else {
        row.unknownCount += 1;
      }
      row.totalCount += 1;
      grouped.set(issue, row);
    });

    return [...grouped.values()]
      .sort((a, b) => b.totalCount - a.totalCount || b.failCount - a.failCount || a.issue.localeCompare(b.issue, "th"))
      .slice(0, 8)
      .map((row) => ({
        ...row,
        passPercent: row.totalCount > 0 ? Number(((row.passCount / row.totalCount) * 100).toFixed(2)) : 0,
        failPercent: row.totalCount > 0 ? Number(((row.failCount / row.totalCount) * 100).toFixed(2)) : 0,
      }));
  }, [healthIssueScopeRecords]);

  const healthIssueEvaluationChartHeight = Math.max(260, healthIssueEvaluationRows.length * 42 + 72);
  const selectedOverviewIssueRecords = useMemo(() => {
    if (!selectedOverviewIssue) {
      return [] as ProvinceHealthIssueRecord[];
    }

    return healthIssueScopeRecords.filter((record) => record.healthIssue === selectedOverviewIssue);
  }, [healthIssueScopeRecords, selectedOverviewIssue]);
  const selectedOverviewIssueAgencyRows = useMemo<CoverageChartRow[]>(() => {
    const grouped = new Map<string, CoverageChartRow>();
    selectedOverviewIssueRecords.forEach((record) => {
      const agencyName = agencies.find((agency) => agency.code === record.agencyCode)?.label_th ?? record.agencyCode;
      const row = grouped.get(record.agencyCode) ?? { code: record.agencyCode, name: agencyName, record_count: 0, selected: false };
      row.record_count += 1;
      grouped.set(record.agencyCode, row);
    });
    return [...grouped.values()].sort((a, b) => b.record_count - a.record_count || a.name.localeCompare(b.name, "th"));
  }, [agencies, selectedOverviewIssueRecords]);
  const selectedOverviewIssueProvinceRows = useMemo<CoverageChartRow[]>(() => {
    const grouped = new Map<string, CoverageChartRow>();
    selectedOverviewIssueRecords.forEach((record) => {
      const provinceName = provinces.find((province) => province.code === record.provinceCode)?.name_th ?? record.provinceCode;
      const row = grouped.get(record.provinceCode) ?? { code: record.provinceCode, name: provinceName, record_count: 0, selected: false };
      row.record_count += 1;
      grouped.set(record.provinceCode, row);
    });
    return [...grouped.values()].sort((a, b) => b.record_count - a.record_count || a.name.localeCompare(b.name, "th"));
  }, [provinces, selectedOverviewIssueRecords]);
  const selectedOverviewIssueDistrictRows = useMemo<CoverageChartRow[]>(() => {
    const grouped = new Map<string, CoverageChartRow>();
    selectedOverviewIssueRecords.forEach((record) => {
      const provinceName = provinces.find((province) => province.code === record.provinceCode)?.name_th ?? record.provinceCode;
      const key = `${record.provinceCode}::${record.districtCode}`;
      const row = grouped.get(key) ?? { code: key, name: `${provinceName} / ${record.districtName}`, record_count: 0, selected: false };
      row.record_count += 1;
      grouped.set(key, row);
    });
    return [...grouped.values()].sort((a, b) => b.record_count - a.record_count || a.name.localeCompare(b.name, "th"));
  }, [provinces, selectedOverviewIssueRecords]);
  const issueDetailScopeOptions = [
    { key: "agency" as const, label: "สคร.", title: "พบใน สคร. ใดบ้าง", detail: "เรียงตามจำนวนข้อมูลของประเด็นนี้", color: "#1d9bf0", rows: selectedOverviewIssueAgencyRows, axisWidth: 62 },
    { key: "province" as const, label: "จังหวัด", title: "พบในจังหวัดใดบ้าง", detail: "จังหวัดที่มีรายการของประเด็นนี้", color: "#00c4b4", rows: selectedOverviewIssueProvinceRows, axisWidth: 96 },
    { key: "district" as const, label: "อำเภอ", title: "พบในอำเภอใดบ้าง", detail: "แสดง 20 อำเภอแรกที่มีจำนวนข้อมูลสูงสุด", color: "#f59e0b", rows: selectedOverviewIssueDistrictRows.slice(0, 20), axisWidth: 160 },
  ];
  const activeIssueDetailScope = issueDetailScopeOptions.find((option) => option.key === issueDetailScope) ?? issueDetailScopeOptions[0];
  const overviewIssueColorMap = useMemo(
    () => Object.fromEntries(overviewIssueDonutRows.map((item) => [item.issue, item.color])),
    [overviewIssueDonutRows]
  );
  const activeOverviewMapIssue = selectedOverviewIssue || selectedOverviewMapIssue;
  const selectedOverviewIssueColor = overviewIssueColorMap[selectedOverviewIssue] ?? "#1d9bf0";
  const activeOverviewMapIssueColor = activeOverviewMapIssue ? overviewIssueColorMap[activeOverviewMapIssue] ?? "#1d9bf0" : "#1d9bf0";
  const overviewMapRecords = useMemo(
    () => healthIssueScopeRecords.map((record) => ({
      provinceCode: record.provinceCode,
      districtCode: record.districtCode,
      districtName: record.districtName,
      issue: record.healthIssue,
    })),
    [healthIssueScopeRecords]
  );
  const overviewMapActiveRecords = useMemo(() => {
    if (!activeOverviewMapIssue) return healthIssueScopeRecords;
    return healthIssueScopeRecords.filter((record) => record.healthIssue === activeOverviewMapIssue);
  }, [activeOverviewMapIssue, healthIssueScopeRecords]);
  const selectedOverviewMapProvinceName = selectedOverviewMapProvinceCode
    ? provinces.find((province) => province.code === selectedOverviewMapProvinceCode)?.name_th ?? selectedOverviewMapProvinceCode
    : "";
  const selectedOverviewMapDistrictRows = useMemo<CoverageChartRow[]>(() => {
    if (!selectedOverviewMapProvinceCode) return [];
    const grouped = new Map<string, CoverageChartRow>();
    overviewMapActiveRecords
      .filter((record) => record.provinceCode === selectedOverviewMapProvinceCode)
      .forEach((record) => {
        const selected = selectedOverviewMapDistrictCode === record.districtCode;
        const row = grouped.get(record.districtCode) ?? { code: record.districtCode, name: record.districtName, record_count: 0, selected };
        row.record_count += 1;
        row.selected = selected;
        grouped.set(record.districtCode, row);
      });
    return [...grouped.values()].sort((a, b) => b.record_count - a.record_count || a.name.localeCompare(b.name, "th"));
  }, [overviewMapActiveRecords, selectedOverviewMapDistrictCode, selectedOverviewMapProvinceCode]);
  const selectedOverviewMapDistrictName = selectedOverviewMapDistrictCode
    ? selectedOverviewMapDistrictRows.find((row) => row.code === selectedOverviewMapDistrictCode)?.name ?? selectedOverviewMapDistrictCode
    : "";
  const selectedOverviewIssueChartHeight = (rows: CoverageChartRow[]) => Math.max(260, rows.length * 34 + 58);
  const selectedHealthIssueCount = healthIssueDonutData.find((item) => item.issue === selectedHealthIssue)?.count ?? 0;
  const selectedHealthIssueRecords = useMemo(() => {
    if (!selectedHealthIssue || selectedDistrictCode) {
      return [] as ProvinceHealthIssueRecord[];
    }

    return healthIssueScopeRecords
      .filter((record) => record.healthIssue === selectedHealthIssue)
      .sort((a, b) => {
        const provinceCompare = a.provinceCode.localeCompare(b.provinceCode, "th");
        if (provinceCompare !== 0) return provinceCompare;
        return a.districtName.localeCompare(b.districtName, "th");
      })
      .slice(0, 6);
  }, [healthIssueScopeRecords, selectedDistrictCode, selectedHealthIssue]);

  useEffect(() => {
    if (selectedHealthIssue && !healthIssueDonutData.some((item) => item.issue === selectedHealthIssue)) {
      setSelectedHealthIssue("");
    }
  }, [healthIssueDonutData, selectedHealthIssue]);

  useEffect(() => {
    setSelectedOverviewMapProvinceCode("");
    setSelectedOverviewMapDistrictCode("");
  }, [selectedOverviewIssue, selectedOverviewMapIssue]);

  const overviewFilterOptions = [
    { key: "agency-order" as const, label: "สคร.ตามลำดับ" },
    { key: "province-active" as const, label: "จังหวัดที่มีข้อมูล" },
  ];
  const overviewChartRows = useMemo<CoverageChartRow[]>(() => {
    const agencyCodeOrder = (code: string) => Number(code.replace(/\D/g, "")) || 999;
    const buildSubmissionCounts = (provinceCodes: string[]) => {
      const scopedProvinceCodes = [...new Set(provinceCodes)];
      const totalDistricts = scopedProvinceCodes.reduce((total, provinceCode) => total + (districtCountByProvince.get(provinceCode) ?? 0), 0);
      const submittedDistrictKeys = new Set<string>();

      scopedProvinceCodes.forEach((provinceCode) => {
        const districtTotal = districtCountByProvince.get(provinceCode) ?? 0;
        const submittedDistricts = submittedDistrictCodesByProvince[provinceCode] ?? [];
        submittedDistricts.slice(0, districtTotal).forEach((districtCode) => {
          submittedDistrictKeys.add(`${provinceCode}::${districtCode}`);
        });
      });

      const submittedDistricts = Math.min(submittedDistrictKeys.size, totalDistricts);
      const pendingDistricts = Math.max(0, totalDistricts - submittedDistricts);

      const submittedPercent = totalDistricts > 0 ? Number(((submittedDistricts / totalDistricts) * 100).toFixed(2)) : 0;
      const pendingPercent = totalDistricts > 0 ? Number((100 - submittedPercent).toFixed(2)) : 0;

      return { totalDistricts, submittedDistricts, pendingDistricts, submittedPercent, pendingPercent };
    };

    const agencyRowsByCode = visibleAgencyCoverage
      .map((agency) => {
        const provinceCodes = agencyProvinceMap
          .filter((item) => item.agency_code === agency.agency_code)
          .map((item) => item.province_code);
        const counts = buildSubmissionCounts(provinceCodes);

        return {
          code: agency.agency_code,
          name: agency.agency_name,
          record_count: counts.submittedDistricts,
          submitted_count: counts.submittedDistricts,
          pending_count: counts.pendingDistricts,
          total_count: counts.totalDistricts,
          submitted_percent: counts.submittedPercent,
          pending_percent: counts.pendingPercent,
          selected: false,
        };
      })
      .sort((a, b) => agencyCodeOrder(a.code) - agencyCodeOrder(b.code) || a.name.localeCompare(b.name, "th"));
    const agencyRowsByCount = [...agencyRowsByCode].sort((a, b) => b.record_count - a.record_count || agencyCodeOrder(a.code) - agencyCodeOrder(b.code));
    const provinceRows = visibleProvinceCoverage
      .map((province) => {
        const counts = buildSubmissionCounts([province.province_code]);

        return {
          code: province.province_code,
          name: province.province_name,
          record_count: counts.submittedDistricts,
          submitted_count: counts.submittedDistricts,
          pending_count: counts.pendingDistricts,
          total_count: counts.totalDistricts,
          submitted_percent: counts.submittedPercent,
          pending_percent: counts.pendingPercent,
          selected: false,
        };
      })
      .sort((a, b) => b.record_count - a.record_count || a.name.localeCompare(b.name, "th"));

    switch (overviewFilter) {
      case "province-active":
        return provinceRows.filter((row) => row.record_count > 0);
      case "agency-order":
      default:
        return agencyRowsByCode;
    }
  }, [agencyProvinceMap, districtCountByProvince, overviewFilter, submittedDistrictCodesByProvince, visibleAgencyCoverage, visibleProvinceCoverage]);
  const overviewChartTitle = overviewFilterOptions.find((item) => item.key === overviewFilter)?.label ?? "รายการตาม สคร.";
  const isOverviewMode = !activeAgencyFilter && !activeProvinceFilter && !selectedDistrictCode;
  const coverageChartTitle = isDistrictMode
    ? `จำนวนข้อมูลตามอำเภอในจังหวัด${selectedIssueProvinceName}`
    : activeAgencyFilter
      ? `ความครอบคลุมข้อมูลรายจังหวัดใน ${agencies.find((item) => item.code === activeAgencyFilter)?.label_th ?? activeAgencyFilter}`
      : "ความครอบคลุมข้อมูลตาม สคร.";

  const dashboardContextLabel = selectedDistrictCode
    ? `อำเภอ${selectedDistrictName}`
    : activeProvinceFilter
      ? `จังหวัด${selectedIssueProvinceName}`
      : activeAgencyFilter
        ? agencies.find((item) => item.code === activeAgencyFilter)?.label_th ?? activeAgencyFilter
        : "ภาพรวมทั้งหมด";

  const selectedProvinceIssueRecords = useMemo(() => {
    if (!selectedIssueProvinceCode) {
      return [] as ProvinceHealthIssueRecord[];
    }

    return provinceHealthIssueRecords
      .filter((record) => record.provinceCode === selectedIssueProvinceCode)
      .sort((a, b) => {
        const districtCompare = a.districtName.localeCompare(b.districtName, "th");
        if (districtCompare !== 0) return districtCompare;
        return a.healthIssue.localeCompare(b.healthIssue, "th");
      });
  }, [provinceHealthIssueRecords, selectedIssueProvinceCode]);

  const handleOverviewChartBarClick = (entry: { payload?: CoverageChartRow }) => {
    const code = entry.payload?.code;
    if (!code) {
      return;
    }

    if (overviewFilter.includes("province")) {
      const agencyCode = agencyProvinceMap.find((item) => item.province_code === code)?.agency_code;
      if (agencyCode && !accessScope?.agencyCode) {
        setFilterAgency(agencyCode);
      }
      if (!accessScope?.provinceCode) {
        setFilterProvince(code);
      }
      setSelectedDistrictCode("");
      setSelectedSubdistrictCode("");
      setSelectedHealthIssue("");
      return;
    }

    if (!accessScope?.agencyCode) {
      setFilterAgency(code);
    }
    setFilterProvince("");
    setSelectedDistrictCode("");
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
  };

  const handleCoverageChartBarClick = (entry: { payload?: CoverageChartRow }) => {
    const code = entry.payload?.code;
    if (!code) {
      return;
    }

    // 1. Level 1: No agency selected (showing agencies) -> select agency
    if (!activeAgencyFilter) {
      if (!accessScope?.agencyCode) {
        setFilterAgency(code);
      }
      return;
    }

    // 2. Level 2: Agency selected (showing provinces) -> select province
    if (!activeProvinceFilter) {
      setFilterProvince(code);
      return;
    }

    // 3. Level 3: Province selected (showing districts) -> select district
    setSelectedDistrictCode((current) => (current === code ? "" : code));
  };

  const clearMapFilters = () => {
    if (!accessScope?.provinceCode) {
      setFilterProvince("");
    }
    setSelectedDistrictCode("");
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
    setSelectedOverviewIssue("");
    setSelectedOverviewMapIssue("");
    if (mapRef.current) {
      mapRef.current.resetView();
    }
  };

  const clearTableFilters = () => {
    if (!accessScope?.agencyCode) {
      setFilterAgency("");
    }
    setFilterProvince("");
    setSelectedDistrictCode("");
  };

  const selectDashboardOverview = () => {
    setDashboardInsightTab("assessment");
    if (!accessScope?.agencyCode) {
      setFilterAgency("");
    }
    if (!accessScope?.provinceCode) {
      setFilterProvince("");
    }
    setSelectedDistrictCode("");
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
    setSelectedOverviewIssue("");
    setSelectedOverviewMapIssue("");
  };

  const selectDashboardAgency = (agencyCode: string) => {
    setDashboardInsightTab("assessment");
    if (!accessScope?.agencyCode) {
      setFilterAgency(agencyCode);
    }
    if (!accessScope?.provinceCode) {
      setFilterProvince("");
    }
    setSelectedDistrictCode("");
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
    setSelectedOverviewIssue("");
    setSelectedOverviewMapIssue("");
  };


  const selectDashboardInsight = (tab: Exclude<DashboardInsightTab, "assessment">) => {
    if (!accessScope?.agencyCode) {
      setFilterAgency("");
    }
    if (!accessScope?.provinceCode) {
      setFilterProvince("");
    }
    setSelectedDistrictCode("");
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
    setSelectedOverviewIssue("");
    setSelectedOverviewMapIssue("");
    setDashboardInsightTab(tab);
  };
  const handleDashboardAgencyChange = (agencyCode: string) => {
    if (!agencyCode) {
      selectDashboardOverview();
      return;
    }

    selectDashboardAgency(agencyCode);
  };

  const handleDashboardProvinceChange = (provinceCode: string) => {
    if (!accessScope?.provinceCode) {
      setFilterProvince(provinceCode);
    }
    setSelectedDistrictCode("");
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
    setSelectedOverviewIssue("");
    setSelectedOverviewMapIssue("");
  };

  const handleDashboardDistrictChange = (districtCode: string) => {
    setSelectedDistrictCode(districtCode);
    setSelectedSubdistrictCode("");
    setSelectedHealthIssue("");
    setSelectedOverviewIssue("");
    setSelectedOverviewMapIssue("");
  };

  const beginEditRecord = (row: IntakeRecordRow) => {
    setRecordActionMessage("");
    setEditingRecordId(row.id);
    setEditDraft({
      agencyCode: row.agency_code,
      provinceCode: row.province_code,
      districtCode: row.district_code,
      healthIssue: row.health_issue_text ?? "",
    });
  };

  const cancelEditRecord = () => {
    setEditingRecordId(null);
    setEditDraft(null);
  };

  const updateEditDraft = (next: Partial<SavedRecordDraft>) => {
    setEditDraft((current) => (current ? { ...current, ...next } : current));
  };

  const saveEditedRecord = async () => {
    if (!editingRecordId || !editDraft) return;
    if (!editDraft.agencyCode || !editDraft.provinceCode || !editDraft.districtCode || editDraft.healthIssue.trim().length < 3) {
      setRecordActionMessage("กรอกข้อมูลให้ครบก่อนบันทึกการแก้ไข");
      return;
    }

    setSavingRecordId(editingRecordId);
    setRecordActionMessage("");

    const { error } = await supabase
      .from("intake_records")
      .update({
        agency_code: editDraft.agencyCode,
        province_code: editDraft.provinceCode,
        district_code: editDraft.districtCode,
        health_issue_text: editDraft.healthIssue.trim(),
      })
      .eq("id", editingRecordId);

    setSavingRecordId(null);

    if (error) {
      setRecordActionMessage(`แก้ไขไม่สำเร็จ: ${error.message}`);
      return;
    }

    setRecordActionMessage("แก้ไขรายการสำเร็จแล้ว");
    cancelEditRecord();
    setRecordsRefreshKey((current) => current + 1);
  };

  const deleteRecord = async (row: IntakeRecordRow) => {
    const confirmed = window.confirm("ยืนยันลบรายการนี้ออกจาก Supabase?");
    if (!confirmed) return;

    setDeletingRecordId(row.id);
    setRecordActionMessage("");

    const { error } = await supabase.from("intake_records").delete().eq("id", row.id);

    setDeletingRecordId(null);

    if (error) {
      setRecordActionMessage(`ลบไม่สำเร็จ: ${error.message}`);
      return;
    }

    setRecordActionMessage("ลบรายการสำเร็จแล้ว");
    if (editingRecordId === row.id) {
      cancelEditRecord();
    }
    setRecordsRefreshKey((current) => current + 1);
  };

  const exportLatestRowsCsv = () => {
    if (rows.length === 0) return;
    const headers = ["เวลา", "หน่วยงาน", "จังหวัด", "อำเภอ", "ประเด็นโรค/ภัยสุขภาพ"];
    const body = rows.map((row) => [
      new Date(row.created_at).toLocaleString("th-TH"),
      getRelatedLabel(row.master_agencies, (agency) => agency.label_th) ?? row.agency_code ?? "-",
      getRelatedLabel(row.master_provinces, (province) => province.name_th) ?? row.province_code ?? "-",
      getRelatedLabel(row.master_districts, (district) => district.name_th) ?? row.district_code ?? "-",
      row.health_issue_text ?? "-",
    ]);
    const csvLines = [headers, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csvLines}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dhsd-latest-records-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportKpiSummaryCsv = () => {
    const headers = ["ปีงบประมาณ", "KPI", "ค่าเฉลี่ยร้อยละ", "ค่าเฉลี่ยคะแนน", "จำนวน สคร. ที่มีข้อมูล"];
    const body = kpiSummary.map((item) => [
      selectedFiscalYear,
      item.kpi_name_th,
      item.avg_percent.toFixed(2),
      item.avg_score.toFixed(2),
      item.agency_count,
    ]);
    const csvLines = [headers, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csvLines}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dhsd-kpi-summary-${selectedFiscalYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const kpiSummary = useMemo(() => {
    const ordered = ["KPI1", "KPI2", "KPI3"] as const;
    return ordered.map((kpiCode) => {
      return (
        kpiSummaryRows.find((item) => item.kpi_code === kpiCode) ?? {
          fiscal_year: selectedFiscalYear,
          kpi_code: kpiCode,
          kpi_name_th: kpiCode,
          avg_percent: 0,
          avg_score: 0,
          agency_count: 0,
        }
      );
    });
  }, [kpiSummaryRows, selectedFiscalYear]);

  const previousKpiSummaryMap = useMemo(() => {
    return new Map(previousKpiSummaryRows.map((item) => [item.kpi_code, item]));
  }, [previousKpiSummaryRows]);

  const kpiStatusRows = useMemo(() => {
    return kpiSummary.map((item) => {
      const previous = previousKpiSummaryMap.get(item.kpi_code);
      const delta = previous ? item.avg_percent - previous.avg_percent : null;
      const status = kpiStatusFromPercent(item.avg_percent);
      const trendDirection = trendDirectionFromDelta(delta);
      const forecast = forecastPercent(item.avg_percent, delta);
      return {
        ...item,
        status,
        statusLabel: kpiStatusLabel(status),
        statusTone: kpiStatusTone(status),
        trendDirection,
        trendLabel: trendLabel(trendDirection),
        forecast,
        forecastLabel: forecastLabel(forecast),
        delta,
      };
    });
  }, [kpiSummary, previousKpiSummaryMap]);

  const kpiAlerts = useMemo(() => {
    return kpiStatusRows.filter((item) => item.status !== "good");
  }, [kpiStatusRows]);

  const kpiForecastRows = useMemo(() => {
    return kpiStatusRows.map((item) => ({
      ...item,
      forecastTone:
        item.forecast === null ? "trend-pill" : item.forecast >= 50 ? "status-badge status-badge--good" : item.forecast >= 40 ? "status-badge status-badge--warning" : "status-badge status-badge--critical",
    }));
  }, [kpiStatusRows]);

  const kpiStatusCounts = useMemo(() => {
    return kpiStatusRows.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { good: 0, warning: 0, critical: 0 }
    );
  }, [kpiStatusRows]);

  const overallRiskLevel = useMemo(() => overallRiskFromCounts(kpiStatusCounts), [kpiStatusCounts]);

  const readinessChecks = useMemo(() => {
    const checks: ReadinessCheck[] = [
      {
        key: "master-agencies",
        label: "Master agencies",
        detail: `${agencies.length.toLocaleString("th-TH")} หน่วยงาน`,
        severity: agencies.length >= 13 ? "pass" : "warn",
      },
      {
        key: "province-coverage",
        label: "Province coverage",
        detail: `${provinceCoverage.filter((item) => item.record_count > 0).length.toLocaleString("th-TH")} จังหวัดที่มีข้อมูล`,
        severity: provinceCoverage.length > 0 ? "pass" : "warn",
      },
      {
        key: "kpi-summary",
        label: "KPI summary",
        detail: `${kpiSummaryRows.length.toLocaleString("th-TH")} แถวสรุป`,
        severity: kpiSummaryRows.length > 0 ? "pass" : "warn",
      },
      {
        key: "alert-panel",
        label: "Alert panel",
        detail: kpiAlerts.length > 0 ? `${kpiAlerts.length} KPI ต้องตรวจสอบ` : "ไม่มีรายการผิดปกติ",
        severity: kpiAlerts.length > 0 ? "warn" : "pass",
      },
      {
        key: "auth-model",
        label: "Auth model",
        detail: "มีโครง app_users + role helper แล้ว",
        severity: "pass",
      },
    ];

    return checks;
  }, [agencies.length, kpiAlerts.length, kpiSummaryRows.length, provinceCoverage]);

  const savedRecordsPanel = canViewSavedRecords ? (
    <article className="panel table-panel">
      <div className="section-row">
        <div>
          <h3>รายการที่บันทึกสำเร็จ</h3>
          <p className="section-row__subtitle">
            แสดง {latestRecordsStart.toLocaleString("th-TH")}-{latestRecordsEnd.toLocaleString("th-TH")} จาก {totalCount.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        <div className="section-row__actions">
          <span className="filter-chip">หน้า {latestRecordsPage.toLocaleString("th-TH")} / {latestRecordsPageCount.toLocaleString("th-TH")}</span>
        </div>
      </div>
      <div className="actions-row">
        <button type="button" className="cta cta--solid" onClick={exportLatestRowsCsv} disabled={rows.length === 0}>
          Export CSV
        </button>
      </div>
      <div className="filter-row">
        <label>
          กรองหน่วยงาน
          {accessScope?.agencyCode ? (
            <input value={agencies.find((agency) => agency.code === accessScope.agencyCode)?.label_th ?? accessScope.agencyCode} disabled />
          ) : (
            <select value={filterAgency} onChange={(event) => {
              setFilterAgency(event.target.value);
              setFilterProvince("");
              setSelectedDistrictCode("");
              setSelectedSubdistrictCode("");
            }}>
              <option value="">ทั้งหมด</option>
              {visibleAgencies.map((agency) => (<option key={agency.code} value={agency.code}>{agency.label_th}</option>))}
            </select>
          )}
        </label>

        <label>
          กรองจังหวัด
          <select value={activeProvinceFilter} onChange={(event) => {
            setFilterProvince(event.target.value);
            setSelectedDistrictCode("");
            setSelectedSubdistrictCode("");
          }} disabled={Boolean(accessScope?.provinceCode)}>
            <option value="">ทั้งหมด</option>
            {visibleProvinces.map((province) => (<option key={province.code} value={province.code}>{province.name_th}</option>))}
          </select>
        </label>
      </div>

      {activeFilterChips.length ? (
        <div className="filter-chips" aria-label="ตัวกรองที่ใช้งานอยู่">
          {activeFilterChips.map((chip) => (
            <span key={chip} className="filter-chip">
              {chip}
            </span>
          ))}
        </div>
      ) : null}

      {recordActionMessage ? <p className="inline-message">{recordActionMessage}</p> : null}
      {loading ? <p>กำลังโหลดข้อมูล...</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>เวลา</th><th>หน่วยงาน</th><th>จังหวัด</th><th>อำเภอ</th><th>ประเด็นโรค/ภัยสุขภาพ</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6}>ยังไม่มีข้อมูล</td></tr>
            ) : (
              rows.map((row) => {
                const isEditing = editingRecordId === row.id && editDraft;
                return (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString("th-TH")}</td>
                    {isEditing ? (
                      <>
                        <td>
                          {accessScope?.agencyCode ? (
                            <input className="table-input" value={agencies.find((agency) => agency.code === accessScope.agencyCode)?.label_th ?? accessScope.agencyCode} disabled />
                          ) : (
                            <select
                              className="table-input"
                              value={editDraft.agencyCode}
                              onChange={(event) =>
                                setEditDraft({
                                  ...editDraft,
                                  agencyCode: event.target.value,
                                  provinceCode: "",
                                  districtCode: "",
                                })
                              }
                            >
                              <option value="">เลือกหน่วยงาน</option>
                              {visibleAgencies.map((agency) => (
                                <option key={agency.code} value={agency.code}>{agency.label_th}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <select
                            className="table-input"
                            value={editDraft.provinceCode}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                provinceCode: event.target.value,
                                districtCode: "",
                              })
                            }
                            disabled={Boolean(accessScope?.provinceCode)}
                          >
                            <option value="">เลือกจังหวัด</option>
                            {editProvinceOptions.map((province) => (
                              <option key={province.code} value={province.code}>{province.name_th}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="table-input"
                            value={editDraft.districtCode}
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                districtCode: event.target.value,
                              })
                            }
                          >
                            <option value="">เลือกอำเภอ</option>
                            {editDistrictOptions.map((district) => (
                              <option key={district.code} value={district.code}>{district.name_th}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <textarea
                            className="table-textarea"
                            value={editDraft.healthIssue}
                            onChange={(event) => updateEditDraft({ healthIssue: event.target.value })}
                            rows={3}
                            placeholder="ระบุประเด็นโรค/ภัยสุขภาพ"
                          />
                        </td>
                        <td>
                          <div className="record-actions">
                            <button type="button" className="cta cta--solid" onClick={saveEditedRecord} disabled={savingRecordId === row.id}>
                              {savingRecordId === row.id ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                            <button type="button" className="cta cta--ghost" onClick={cancelEditRecord} disabled={savingRecordId === row.id}>
                              ยกเลิก
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{getRelatedLabel(row.master_agencies, (agency) => agency.label_th) ?? row.agency_code ?? "-"}</td>
                        <td>{getRelatedLabel(row.master_provinces, (province) => province.name_th) ?? row.province_code ?? "-"}</td>
                        <td>{getRelatedLabel(row.master_districts, (district) => district.name_th) ?? row.district_code ?? "-"}</td>
                        <td>{row.health_issue_text}</td>
                        <td>
                          <div className="record-actions">
                            <button type="button" className="cta cta--ghost" onClick={() => beginEditRecord(row)} disabled={Boolean(savingRecordId || deletingRecordId)}>
                              แก้ไข
                            </button>
                            <button type="button" className="cta cta--ghost" onClick={() => deleteRecord(row)} disabled={deletingRecordId === row.id || Boolean(savingRecordId)}>
                              {deletingRecordId === row.id ? "กำลังลบ..." : "ลบ"}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-row" aria-label="เปลี่ยนหน้ารายการที่บันทึกสำเร็จ">
        <button
          type="button"
          className="cta cta--ghost"
          onClick={() => setLatestRecordsPage((page) => Math.max(1, page - 1))}
          disabled={loading || latestRecordsPage <= 1}
        >
          หน้าก่อนหน้า
        </button>
        <span className="inline-message">
          หน้า {latestRecordsPage.toLocaleString("th-TH")} จาก {latestRecordsPageCount.toLocaleString("th-TH")}
        </span>
        <button
          type="button"
          className="cta cta--ghost"
          onClick={() => setLatestRecordsPage((page) => Math.min(latestRecordsPageCount, page + 1))}
          disabled={loading || latestRecordsPage >= latestRecordsPageCount}
        >
          หน้าถัดไป
        </button>
      </div>
    </article>
  ) : null;

  return (
    <section className="section" id="dashboard-section">
      {!hideSavedRecords && savedRecordsPanel}

      <div className="dashboard-workspace">
        <DashboardAgencySelector
          agencies={dashboardMenuAgencies}
          selectedAgencyCode={activeAgencyFilter}
          isOverviewActive={!activeAgencyFilter && !activeProvinceFilter && !selectedDistrictCode}
          isOverviewDisabled={Boolean(accessScope?.agencyCode)}
          lockedAgencyCode={accessScope?.agencyCode ?? null}
          activeInsightTab={isOverviewMode && dashboardInsightTab !== "assessment" ? dashboardInsightTab : null}
          onSelectInsight={selectDashboardInsight}
          onSelectOverview={selectDashboardOverview}
          onSelectAgency={selectDashboardAgency}
        />
        <div className="dashboard-workspace__main">

          {isOverviewMode ? (
            <div className="dashboard-overview">
              {selectedOverviewIssue ? (
                <div className="issue-detail-view">
                  <div className="issue-detail-view__header">
                    <div>
                      <span>รายละเอียดประเด็นโรคและสุขภาพ</span>
                      <h3>{selectedOverviewIssue}</h3>
                      <p>{selectedOverviewIssueRecords.length.toLocaleString("th-TH")} ข้อมูล จาก {selectedOverviewIssueAgencyRows.length.toLocaleString("th-TH")} สคร. / {selectedOverviewIssueProvinceRows.length.toLocaleString("th-TH")} จังหวัด / {selectedOverviewIssueDistrictRows.length.toLocaleString("th-TH")} อำเภอ</p>
                    </div>
                    <button type="button" className="cta cta--ghost" onClick={() => setSelectedOverviewIssue("")}>กลับสรุปภาพรวม</button>
                  </div>

                  <div className="issue-detail-view__metrics">
                    <article><span>จำนวนข้อมูล</span><strong>{selectedOverviewIssueRecords.length.toLocaleString("th-TH")}</strong></article>
                    <article><span>สคร.ที่พบ</span><strong>{selectedOverviewIssueAgencyRows.length.toLocaleString("th-TH")}</strong></article>
                    <article><span>จังหวัดที่พบ</span><strong>{selectedOverviewIssueProvinceRows.length.toLocaleString("th-TH")}</strong></article>
                    <article><span>อำเภอที่พบ</span><strong>{selectedOverviewIssueDistrictRows.length.toLocaleString("th-TH")}</strong></article>
                  </div>

                  <div className="issue-detail-view__spatial-grid">
                    <article className="panel issue-detail-map-panel">
                      <div className="dashboard-overview__section-head">
                        <div>
                          <h3>แผนที่การกระจาย {selectedOverviewIssue}</h3>
                          <p>สีบนแผนที่ใช้สีของประเด็นที่เลือก และแสดงเฉพาะพื้นที่ที่มีข้อมูลประเด็นนี้</p>
                        </div>
                        <span style={{ background: selectedOverviewIssueColor, color: "#ffffff" }}>{selectedOverviewIssueRecords.length.toLocaleString("th-TH")} รายการ</span>
                      </div>
                      <HealthIssueDistributionMap
                        selectedIssue={selectedOverviewIssue}
                        issueColor={selectedOverviewIssueColor}
                        issueColorMap={overviewIssueColorMap}
                        records={selectedOverviewIssueRecords.map((record) => ({
                          provinceCode: record.provinceCode,
                          districtCode: record.districtCode,
                          districtName: record.districtName,
                          issue: record.healthIssue,
                        }))}
                        selectedProvinceCode={selectedOverviewMapProvinceCode}
                        selectedDistrictCode={selectedOverviewMapDistrictCode}
                        onSelectProvince={(provinceCode) => {
                          setSelectedOverviewMapProvinceCode(provinceCode);
                          setSelectedOverviewMapDistrictCode("");
                          setIssueDetailScope("district");
                        }}
                        onSelectDistrict={(districtCode) => {
                          setSelectedOverviewMapDistrictCode(districtCode);
                        }}
                        onClearProvince={() => {
                          setSelectedOverviewMapProvinceCode("");
                          setSelectedOverviewMapDistrictCode("");
                        }}
                      />
                    </article>

                    <aside className="panel issue-detail-side-panel">
                      <div className="issue-detail-selected-area">
                        <span>พื้นที่ที่เลือกจากแผนที่</span>
                        <strong>{selectedOverviewMapDistrictName || selectedOverviewMapProvinceName || "ทั้งประเทศ"}</strong>
                        <p>
                          {selectedOverviewMapDistrictName
                            ? `${selectedOverviewMapDistrictName} ในจังหวัด${selectedOverviewMapProvinceName}`
                            : selectedOverviewMapProvinceName
                              ? `แสดงอำเภอในจังหวัด${selectedOverviewMapProvinceName}ที่มีประเด็นนี้`
                              : "คลิกจังหวัดบนแผนที่เพื่อดูการกระจายรายอำเภอ"}
                        </p>
                      </div>

                      {selectedOverviewMapProvinceCode ? (
                        <div className="issue-detail-district-list">
                          <h4>อำเภอในจังหวัด{selectedOverviewMapProvinceName}</h4>
                          {selectedOverviewMapDistrictRows.map((row) => (
                            <button
                              key={row.code}
                              type="button"
                              className={row.selected ? "is-active" : ""}
                              onClick={() => setSelectedOverviewMapDistrictCode(row.code)}
                            >
                              <span>{row.name}</span>
                              <strong>{row.record_count.toLocaleString("th-TH")} รายการ</strong>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <div className="dashboard-overview__section-head issue-detail-side-panel__head">
                        <div><h3>{activeIssueDetailScope.title}</h3><p>{activeIssueDetailScope.detail}</p></div>
                      </div>
                      <div className="issue-detail-tabs" aria-label="เลือกมุมมองพื้นที่ของประเด็น">
                        {issueDetailScopeOptions.map((option) => (
                          <button key={option.key} type="button" className={issueDetailScope === option.key ? "is-active" : ""} onClick={() => setIssueDetailScope(option.key)}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                      <div style={{ width: "100%", height: selectedOverviewIssueChartHeight(activeIssueDetailScope.rows) }}>
                        <ResponsiveContainer>
                          <BarChart layout="vertical" data={activeIssueDetailScope.rows} margin={{ top: 12, right: 46, bottom: 12, left: 0 }}>
                            <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b647d" }} />
                            <YAxis type="category" dataKey="name" width={activeIssueDetailScope.axisWidth} interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b647d" }} />
                            <Tooltip cursor={{ fill: "rgba(16, 36, 62, 0.04)" }} formatter={recordCountTooltipFormatter} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(16,36,62,0.1)" }} />
                            <Bar dataKey="record_count" radius={[0, 8, 8, 0]} barSize={22}>{activeIssueDetailScope.rows.map((entry) => (<Cell key={entry.code} fill={activeIssueDetailScope.color} />))}<LabelList dataKey="record_count" position="right" formatter={recordCountLabelFormatter} /></Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </aside>
                  </div>
                </div>
              ) : (
              <>
              <div className="dashboard-overview__hero">
                <div>
                  <h2>ภาพรวมประเด็นการขับเคลื่อนงาน พชอ/พชข ด้านการป้องกันควบคุมโรคและภัยสุขภาพ</h2>
                </div>
              </div>

              <div className="dashboard-overview__metrics" aria-label="ตัวชี้วัดภาพรวม">
                <article>
                  <span>จังหวัดทั้งหมด</span>
                  <strong>{overviewAreaTotals.provinceCount.toLocaleString("th-TH")}</strong>
                </article>
                <article>
                  <span>อำเภอทั้งหมด</span>
                  <strong>{overviewAreaTotals.districtCount.toLocaleString("th-TH")}</strong>
                </article>
                <article>
                  <span>ภาพรวมประเด็นการขับเคลื่อนงาน พชอ/พชข</span>
                  <strong>{healthIssueDonutTotal.toLocaleString("th-TH")}</strong>
                </article>
                <article>
                  <span>ภาพรวมร้อยละการรายงานของอำเภอ</span>
                  <strong>{overviewAreaTotals.submittedPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</strong>
                  <p>ส่ง {overviewAreaTotals.submittedDistrictCount.toLocaleString("th-TH")} อำเภอ</p>
                </article>
                <article>
                  <span>ร้อยละอำเภอที่ยังไม่ส่ง</span>
                  <strong>{overviewAreaTotals.pendingPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</strong>
                  <p>ยังไม่ส่ง {overviewAreaTotals.pendingDistrictCount.toLocaleString("th-TH")} อำเภอ</p>
                </article>
              </div>

              {dashboardInsightTab === "assessment" ? (
                  <div className="dashboard-overview__content dashboard-overview__content--distribution">
                    <div className="overview-distribution-grid dashboard-overview__chart--full">
                      <article className="panel issue-detail-map-panel overview-distribution-map-panel">
                        <div className="dashboard-overview__section-head">
                          <div>
                            <h3>{selectedOverviewMapIssue ? `แผนที่การกระจาย ${selectedOverviewMapIssue}` : "แผนที่การกระจายทุกประเด็น"}</h3>
                            <p>แสดงพื้นที่ที่พบรายการประเด็นโรคและภัยสุขภาพตามสีของรายการ</p>
                          </div>
                          <span style={{ background: selectedOverviewMapIssue ? activeOverviewMapIssueColor : "#0f3349", color: "#ffffff" }}>
                            {selectedOverviewMapIssue ? selectedOverviewMapIssue : "ทุกประเด็น"}
                          </span>
                        </div>
                        <HealthIssueDistributionMap
                          selectedIssue={selectedOverviewMapIssue}
                          issueColor={activeOverviewMapIssueColor}
                          issueColorMap={overviewIssueColorMap}
                          records={overviewMapRecords}
                          selectedProvinceCode={selectedOverviewMapProvinceCode}
                          selectedDistrictCode={selectedOverviewMapDistrictCode}
                          onSelectProvince={(provinceCode) => {
                            setSelectedOverviewMapProvinceCode(provinceCode);
                            setSelectedOverviewMapDistrictCode("");
                          }}
                          onSelectDistrict={(districtCode) => {
                            setSelectedOverviewMapDistrictCode(districtCode);
                          }}
                          onClearProvince={() => {
                            setSelectedOverviewMapProvinceCode("");
                            setSelectedOverviewMapDistrictCode("");
                          }}
                        />
                        <section className="overview-map-progress" aria-label="ภาพรวมการรายงานแบ่งตามรายเขต สคร.">
                          <div className="dashboard-overview__filters" aria-label="กรองรายการหน้าแรก">
                            {overviewFilterOptions.map((option) => (
                              <button
                                key={option.key}
                                type="button"
                                className={overviewFilter === option.key ? "is-active" : ""}
                                onClick={() => setOverviewFilter(option.key)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div className="province-progress-list province-progress-list--expanded dashboard-overview-progress-list">
                            {overviewChartRows.length === 0 ? (
                              <p className="province-progress-empty">ยังไม่มีข้อมูลในขอบเขตนี้</p>
                            ) : (
                              overviewChartRows.map((row) => {
                                const submittedCount = row.submitted_count ?? row.record_count ?? 0;
                                const pendingCount = row.pending_count ?? 0;
                                const totalCount = row.total_count ?? submittedCount + pendingCount;
                                const submittedPercent = row.submitted_percent ?? (totalCount > 0 ? Number(((submittedCount / totalCount) * 100).toFixed(2)) : 0);
                                const pendingPercent = row.pending_percent ?? (totalCount > 0 ? Number((100 - submittedPercent).toFixed(2)) : 0);
                                return (
                                  <div
                                    key={row.code}
                                    className="province-progress-row province-progress-row--clickable"
                                    onClick={() => handleOverviewChartBarClick({ payload: row })}
                                  >
                                    <div className="province-progress-row__meta">
                                      <strong>{row.name}</strong>
                                    </div>
                                    <div
                                      className="province-progress-bar"
                                      role="img"
                                      aria-label={`${row.name} รายงานแล้ว ${submittedPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })} เปอร์เซ็นต์ ยังไม่รายงาน ${pendingPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })} เปอร์เซ็นต์`}
                                    >
                                      <div className="province-progress-bar__sent" style={{ width: `${submittedPercent}%` }}>
                                        {submittedPercent > 10 ? `${submittedPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%` : ""}
                                      </div>
                                      <div className="province-progress-bar__pending" style={{ width: `${pendingPercent}%` }}>
                                        {pendingPercent > 10 ? `${pendingPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%` : ""}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </section>
                      </article>

                      <aside className="panel overview-issue-control-panel">
                        <div className="dashboard-overview__section-head overview-issue-control-panel__head">
                          <div>
                            <h3>รายการประเด็นโรคและภัยสุขภาพ</h3>
                            <p>กดรายการเพื่อกรองสีบนแผนที่ด้านซ้าย</p>
                          </div>
                          <button
                            type="button"
                            className="overview-issue-clear-button"
                            onClick={() => {
                              setSelectedOverviewMapIssue("");
                              setSelectedOverviewMapProvinceCode("");
                              setSelectedOverviewMapDistrictCode("");
                            }}
                            disabled={!selectedOverviewMapIssue && !selectedOverviewMapProvinceCode && !selectedOverviewMapDistrictCode}
                          >
                            ล้างข้อมูล
                          </button>
                        </div>
                        {overviewIssueDonutRows.length === 0 ? (
                          <p className="province-issue-empty">ยังไม่มีข้อมูลประเด็นโรค/ภัยสุขภาพ</p>
                        ) : (
                          <div className="overview-issue-control-panel__body">
                            <div className="overview-issue-donut-chart">
                              <ResponsiveContainer width="100%" height={400}>
                                <PieChart margin={{ top: 12, right: 56, bottom: 18, left: 56 }}>
                                  <Pie
                                    data={overviewIssueDonutRows}
                                    dataKey="districtCount"
                                    nameKey="issue"
                                    innerRadius={90}
                                    outerRadius={138}
                                    paddingAngle={2}
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    label={donutPercentLabelFormatter}
                                    labelLine={false}
                                    onClick={(item: any) => {
                                      setSelectedOverviewMapIssue((current) => (current === item.issue ? "" : item.issue));
                                    }}
                                  >
                                    {overviewIssueDonutRows.map((entry) => (
                                      <Cell key={entry.issue} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    content={(props: any) => {
                                      const item = props.payload?.[0]?.payload;
                                      if (!props.active || !item) return null;
                                      return (
                                        <div className="overview-issue-donut-tooltip">
                                          <strong>{item.issue}</strong>
                                          <span>{item.percent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</span>
                                        </div>
                                      );
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="overview-issue-donut-detail">
                              {overviewIssueDonutRows.map((item) => (
                                <button
                                  key={item.issue}
                                  type="button"
                                  className={`overview-issue-donut-detail__item${selectedOverviewMapIssue === item.issue ? " is-active" : ""}`}
                                  onClick={() => setSelectedOverviewMapIssue((current) => (current === item.issue ? "" : item.issue))}
                                >
                                  <span className="overview-issue-donut-detail__swatch" style={{ background: item.color }} />
                                  <span className="overview-issue-donut-detail__name">{item.issue}</span>
                                  <strong>{item.districtCount.toLocaleString("th-TH")} รายการ</strong>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}


                      </aside>
                    </div>
                  </div>
                ) : null}

                {dashboardInsightTab === "evaluation" ? (
                  <article className="dashboard-overview__table panel health-issue-evaluation-panel">
                    <div className="dashboard-overview__section-head">
                      <div>
                        <h3>ผลการคัดเกณฑ์ประเด็นโรคและภัยสุขภาพ</h3>
                        <p>แยกจำนวนรายการที่ผ่านและไม่ผ่านตามประเด็นที่รายงานเข้ามา</p>
                      </div>
                    </div>
                    {healthIssueEvaluationRows.length === 0 ? (
                      <p className="province-issue-empty">ยังไม่มีข้อมูลผลการคัดเกณฑ์ประเด็นโรค/ภัยสุขภาพ</p>
                    ) : (
                      <div className="health-issue-evaluation">
                        <div className="health-issue-evaluation__chart" style={{ height: healthIssueEvaluationChartHeight }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={healthIssueEvaluationRows} margin={{ top: 12, right: 56, bottom: 12, left: 0 }}>
                              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b647d" }} />
                              <YAxis type="category" dataKey="issue" width={170} interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#334155" }} />
                              <Tooltip cursor={{ fill: "rgba(16, 36, 62, 0.04)" }} formatter={evaluationStatusTooltipFormatter} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(16,36,62,0.1)" }} />
                              <Bar dataKey="passCount" stackId="evaluation" fill="#10b981" radius={[8, 0, 0, 8]} barSize={22}>
                                <LabelList dataKey="passCount" position="insideRight" formatter={recordCountLabelFormatter} fill="#ffffff" />
                              </Bar>
                              <Bar dataKey="failCount" stackId="evaluation" fill="#ef4444" radius={[0, 8, 8, 0]} barSize={22}>
                                <LabelList dataKey="failCount" position="right" formatter={recordCountLabelFormatter} fill="#10243e" />
                              </Bar>
                              <Bar dataKey="unknownCount" stackId="evaluation" fill="#94a3b8" radius={[0, 8, 8, 0]} barSize={22}>
                                <LabelList dataKey="unknownCount" position="right" formatter={recordCountLabelFormatter} fill="#10243e" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="health-issue-evaluation__legend" aria-label="คำอธิบายสีผลการคัดเกณฑ์">
                          <span><i style={{ background: "#10b981" }} />ผ่าน</span>
                          <span><i style={{ background: "#ef4444" }} />ไม่ผ่าน</span>
                          <span><i style={{ background: "#94a3b8" }} />ยังไม่ระบุผล</span>
                        </div>
                      </div>
                    )}
                  </article>
                ) : null}

                {dashboardInsightTab === "group" ? (
                  <article className="dashboard-overview__table panel health-issue-group-panel">
                    <div className="dashboard-overview__section-head">
                      <div>
                        <h3>ดูตามกลุ่มรายการ</h3>
                        <p>สรุปจำนวนรายการตามกลุ่มประเด็นโรคและภัยสุขภาพที่ตั้งไว้หลังบ้าน</p>
                      </div>
                    </div>
                    {healthIssueGroupRows.length === 0 ? (
                      <p className="province-issue-empty">ยังไม่มีข้อมูลกลุ่มประเด็นโรค/ภัยสุขภาพ</p>
                    ) : (
                      <div className="health-issue-group-list">
                        {healthIssueGroupRows.map((row) => {
                          const percent = healthIssueGroupTotal > 0 ? Number(((row.recordCount / healthIssueGroupTotal) * 100).toFixed(2)) : 0;
                          return (
                            <article key={row.group} className="health-issue-group-card">
                              <div className="health-issue-group-card__head">
                                <span style={{ background: row.color }} />
                                <strong>{row.label}</strong>
                                <b>{row.recordCount.toLocaleString("th-TH")} รายการ</b>
                              </div>
                              <div
                                className="health-issue-group-bar"
                                role="img"
                                aria-label={`${row.label} ${percent.toLocaleString("th-TH", { maximumFractionDigits: 2 })} เปอร์เซ็นต์`}
                              >
                                <span style={{ width: `${percent}%`, background: row.color }}>
                                  {percent > 10 ? `${percent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%` : ""}
                                </span>
                              </div>
                              <p>
                                {row.issueCount.toLocaleString("th-TH")} ประเด็น · {row.provinceCount.toLocaleString("th-TH")} จังหวัด · {row.districtCount.toLocaleString("th-TH")} อำเภอ
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </article>
                ) : null}
              </>
              )}
            </div>
          ) : (
      <div className="dashboard-grid">
        <article className="panel panel--map">
          <div className="map-panel-header">
            <h3>แผนที่เขตสุขภาพ</h3>
          </div>
          <InteractiveHealthMap
            ref={mapRef}
            coverage={visibleAgencies.map((agency) => ({
              agency_code: agency.code,
              agency_name: agency.label_th,
              record_count: agencyCoverage.find((item) => item.agency_code === agency.code)?.record_count ?? 0,
            }))}
            provinceCoverage={visibleProvinces.map((province) => {
              const row = provinceCoverage.find((item) => item.province_code === province.code);
              return row ?? {
                province_code: province.code,
                province_name: province.name_th,
                agency_code: "",
                agency_name: "-",
                record_count: 0,
              };
            })}
            agencyProvinceMap={agencyProvinceMap}
            selectedAgencyCode={activeAgencyFilter || formData.agencyCode}
            selectedProvinceFromChart={activeProvinceFilter}
            selectedDistrictFromMap={selectedDistrictCode}
            accessScope={accessScope}
            onSelectDistrictForIntake={onSelectDistrictForIntake}
            onSelectAgency={(agencyCode) => {
              if (accessScope?.agencyCode) return;
              setFilterAgency((current) => {
                const next = current === agencyCode ? "" : agencyCode;
                if (!next) {
                  setFilterProvince("");
                  setSelectedDistrictCode("");
                }
                return next;
              });
            }}
            onSelectProvince={(provinceCode) => {
              if (accessScope?.provinceCode) return;
              setFilterProvince((current) => (current === provinceCode ? "" : provinceCode));
              setSelectedDistrictCode("");
            }}
            onSelectDistrict={(districtCode) => {
              setSelectedDistrictCode((current) => (current === districtCode ? "" : districtCode));
            }}
          />
          <div className="health-issue-donut-panel" aria-label="สัดส่วนประเด็นโรคภัยสุขภาพ">
            <div className="health-issue-donut-panel__header">
              <div>
                <h4>ประเด็นโรค/ภัยสุขภาพ</h4>
                <p>{healthIssueDonutScopeLabel}</p>
              </div>
              <span>{healthIssueDonutTotal.toLocaleString("th-TH")} ข้อมูล</span>
            </div>

            {healthIssueDonutData.length === 0 ? (
              <p className="province-issue-empty">ยังไม่มีข้อมูลประเด็นโรค/ภัยสุขภาพในขอบเขตนี้</p>
            ) : (
              <>
                <div className="health-issue-donut">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={healthIssueDonutData}
                        dataKey="count"
                        nameKey="issue"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={3}
                        onClick={(entry: unknown) => {
                          const issue = (entry as { issue?: string }).issue;
                          if (issue) {
                            setSelectedHealthIssue((current) => (current === issue ? "" : issue));
                          }
                        }}
                      >
                        {healthIssueDonutData.map((entry) => (
                          <Cell
                            key={entry.issue}
                            fill={entry.color}
                            opacity={!selectedHealthIssue || selectedHealthIssue === entry.issue ? 1 : 0.38}
                            style={{ cursor: "pointer" }}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${Number(value ?? 0).toLocaleString("th-TH")} ข้อมูล`, name]}
                        contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(16,36,62,0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="health-issue-donut__center" aria-hidden="true">
                    <strong>{healthIssueDonutTotal.toLocaleString("th-TH")}</strong>
                    <span>รายการ</span>
                  </div>
                </div>

                <div className="health-issue-donut-legend">
                  {healthIssueDonutData.map((item) => (
                    <button
                      key={item.issue}
                      type="button"
                      className={`health-issue-donut-legend__item${selectedHealthIssue === item.issue ? " is-active" : ""}`}
                      onClick={() => setSelectedHealthIssue((current) => (current === item.issue ? "" : item.issue))}
                    >
                      <span className="health-issue-donut-legend__swatch" style={{ background: item.color }} />
                      <span>{item.issue}</span>
                      <strong>{item.count.toLocaleString("th-TH")}</strong>
                    </button>
                  ))}
                </div>

                {selectedHealthIssue ? (
                  <div className="health-issue-donut-detail">
                    <strong>{selectedHealthIssue}</strong>
                    <span>{selectedHealthIssueCount.toLocaleString("th-TH")} ข้อมูล</span>
                    {selectedHealthIssueRecords.length > 0 ? (
                      <div className="health-issue-donut-detail__list">
                        {selectedHealthIssueRecords.map((record, index) => (
                          <p key={`${record.provinceCode}-${record.districtCode}-${index}`}>
                            {provinces.find((province) => province.code === record.provinceCode)?.name_th ?? record.provinceCode} / {record.districtName}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="dashboard-context-head">
            <div>
              <h3>{coverageChartTitle}</h3>
            </div>
            {activeAgencyFilter && (activeProvinceFilter || selectedDistrictCode || selectedSubdistrictCode || selectedHealthIssue || selectedOverviewIssue) ? (
              <button
                type="button"
                className="cta cta--ghost"
                onClick={clearMapFilters}
              >
                ล้างตัวกรอง
              </button>
            ) : null}
          </div>

          <div className="dashboard-context-metrics" aria-label="ตัวชี้วัดตามบริบท Dashboard">
            <div>
              <span>{activeAgencyFilter ? "จังหวัดใน สคร." : "สคร.ที่มีข้อมูล"}</span>
              <strong>{selectedAgencyAreaTotals.provinceCount.toLocaleString("th-TH")}</strong>
            </div>
            <div>
              <span>{activeAgencyFilter ? "อำเภอทั้งหมดใน สคร." : "จังหวัดที่มีข้อมูล"}</span>
              <strong>{selectedAgencyAreaTotals.districtCount.toLocaleString("th-TH")}</strong>
            </div>
            <div>
              <span>ประเด็นการขับเคลื่อนงาน พชอ/พชข</span>
              <strong>{healthIssueDonutTotal.toLocaleString("th-TH")}</strong>
            </div>
            <div>
              <span>ร้อยละการรายงานของอำเภอ</span>
              <strong>{selectedAgencyAreaTotals.submittedPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</strong>
              <p>ส่ง {selectedAgencyAreaTotals.submittedDistrictCount.toLocaleString("th-TH")} อำเภอ</p>
            </div>
            <div>
              <span>ร้อยละอำเภอที่ยังไม่ส่ง</span>
              <strong>{selectedAgencyAreaTotals.pendingPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</strong>
              <p>ยังไม่ส่ง {selectedAgencyAreaTotals.pendingDistrictCount.toLocaleString("th-TH")} อำเภอ</p>
            </div>
          </div>

          {selectedDistrictCode ? (
            // District mode: show ONLY district health issues
            <div className="province-issue-panel" aria-label="ประเด็นโรคภัยสุขภาพของอำเภอที่เลือก">
              <div className="province-issue-panel__header">
                <div>
                  <h4>ประเด็นโรค/ภัยสุขภาพ</h4>
                  <p>
                    {districtHealthIssueLoading
                      ? "กำลังโหลดข้อมูล..."
                      : districtHealthIssueTotal > 0
                        ? `อำเภอ${selectedDistrictName} — ${districtHealthIssueTotal.toLocaleString("th-TH")} รายการ`
                        : `อำเภอ${selectedDistrictName} — ยังไม่มีข้อมูล`}
                  </p>
                </div>
                <button type="button" className="cta cta--ghost" onClick={() => setSelectedDistrictCode("")}>
                  กลับไปดูจังหวัด
                </button>
              </div>

              {districtHealthIssueLoading ? (
                <p className="province-issue-empty">กำลังโหลดประเด็นโรค/ภัยสุขภาพ...</p>
              ) : districtHealthIssueData.length === 0 ? (
                <p className="province-issue-empty">ยังไม่มีประเด็นโรค/ภัยสุขภาพของอำเภอที่เลือก</p>
              ) : (
                <div className="province-issue-list">
                  {districtHealthIssueData.map((item) => (
                    <div key={item.issue} className="province-issue-item">
                      <strong>{item.issue}</strong>
                      <span>{item.count.toLocaleString("th-TH")} ข้อมูล</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isDistrictMode ? (
            // Province mode (no district selected): show province issues + district progress
            <>
              <div className="province-issue-panel" style={{ border: "none", padding: 0, marginTop: 0 }} aria-label="ประเด็นโรคภัยสุขภาพของจังหวัดที่เลือก">
                <div className="province-progress-panel__header">
                  <div>
                    <h4>ประเด็นโรค/ภัยสุขภาพ</h4>
                    <p>จังหวัด{selectedIssueProvinceName}{selectedProvinceIssueRecords.length > 0 ? ` — ${selectedProvinceIssueRecords.length.toLocaleString("th-TH")} ข้อมูล` : ""}</p>
                  </div>
                </div>

                {selectedProvinceIssueRecords.length === 0 ? (
                  <p className="province-issue-empty">ยังไม่มีประเด็นโรค/ภัยสุขภาพของจังหวัด{selectedIssueProvinceName}</p>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>ลำดับที่</th><th>อำเภอ</th><th>ประเด็นโรคและสุขภาพ</th></tr>
                      </thead>
                      <tbody>
                        {selectedProvinceIssueRecords.map((record, index) => (
                          <tr key={`${record.districtCode}-${record.healthIssue}-${index}`}>
                            <td>{(index + 1).toLocaleString("th-TH")}</td>
                            <td>{record.districtName}</td>
                            <td>{record.healthIssue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="province-progress-panel" aria-label="ความคืบหน้าการส่งงานรายอำเภอ">
                <div className="province-progress-panel__header">
                  <div>
                    <h4>ความคืบหน้าการส่งงานรายอำเภอ</h4>
                    <p>สถานะการส่งงานของแต่ละอำเภอในจังหวัด{selectedIssueProvinceName}</p>
                  </div>
                  <button type="button" className="cta cta--ghost" onClick={() => {
                    setFilterProvince("");
                    setSelectedDistrictCode("");
                  }}>
                    กลับไปดูจังหวัด
                  </button>
                </div>
                <div className="province-progress-list province-progress-list--compact">
                  {coverageChartRows.length === 0 ? (
                    <p className="province-progress-empty">ยังไม่มีอำเภอในจังหวัดนี้</p>
                  ) : (
                    coverageChartRows.map((district) => {
                      const submitted = district.record_count > 0;
                      const percent = submitted ? 100 : 0;
                      return (
                        <div 
                          key={district.code} 
                          className="province-progress-row province-progress-row--clickable"
                        onClick={() => {
                          setSelectedDistrictCode(district.code);
                        }}
                        >
                          <div className="province-progress-row__meta">
                            <strong>{district.name}</strong>
                            <span>
                              {submitted ? `ส่งแล้ว ${district.record_count} ข้อมูล` : "ยังไม่มีข้อมูล"}
                            </span>
                          </div>
                          <div
                            className="province-progress-bar"
                            role="img"
                            aria-label={`อำเภอ${district.name} ${submitted ? `ส่งแล้ว 100%` : "ยังไม่ส่ง"}`}
                          >
                            <div className="province-progress-bar__sent" style={{ width: `${percent}%` }}>
                              {submitted ? "มีข้อมูล" : ""}
                            </div>
                            <div className="province-progress-bar__pending" style={{ width: `${100 - percent}%` }}>
                              {submitted ? "" : "ไม่มีข้อมูล"}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}
          {!selectedDistrictCode && !isDistrictMode ? (
            <div className="province-progress-panel" aria-label="ความคืบหน้าการส่งงานรายจังหวัดตาม สคร.">
              <div className="province-progress-panel__header">
                <div>
                  <h4>ความคืบหน้าการส่งงานรายจังหวัด</h4>
                  <p>นับอำเภอที่มีรายการส่งงานแล้ว เทียบกับอำเภอทั้งหมดในจังหวัด</p>
                </div>

              </div>

              <div className="province-progress-list province-progress-list--expanded province-progress-list--compact">
                {provinceSubmissionGroups.length === 0 ? (
                  <p className="province-progress-empty">ยังไม่มีจังหวัดในขอบเขตที่เลือก</p>
                ) : (
                  provinceSubmissionGroups.map((group) => (
                    <section key={group.agencyCode} className="province-progress-group" aria-label={group.agencyName}>
                      {!activeAgencyFilter ? (
                        <div className="province-progress-group__title">
                          <strong>{group.agencyName}</strong>
                          <span>{group.provinces.length.toLocaleString("th-TH")} จังหวัด</span>
                        </div>
                      ) : null}
                      <div className="province-progress-group__rows">
                        {group.provinces.map((province) => (
                          <div 
                            key={province.provinceCode} 
                            className="province-progress-row province-progress-row--clickable"
                            onClick={() => {
                              if (!accessScope?.agencyCode) {
                                setFilterAgency(province.agencyCode);
                              }
                              if (!accessScope?.provinceCode) {
                                setFilterProvince(province.provinceCode);
                              }
                              setSelectedDistrictCode("");
                            }}
                          >
                            <div className="province-progress-row__meta">
                              <strong>{province.provinceName}</strong>
                              <span>
                                {province.agencyName} · ส่งแล้ว {province.submittedDistricts.toLocaleString("th-TH")} / {province.totalDistricts.toLocaleString("th-TH")} อำเภอ
                              </span>
                            </div>
                            <div
                              className="province-progress-bar"
                              role="img"
                              aria-label={`จังหวัด${province.provinceName} ส่งแล้ว ${province.submittedPercent.toLocaleString("th-TH")} เปอร์เซ็นต์ ค้างส่ง ${province.pendingPercent.toLocaleString("th-TH")} เปอร์เซ็นต์`}
                            >
                              <div className="province-progress-bar__sent" style={{ width: `${province.submittedPercent}%` }}>
                                {province.submittedPercent > 10 ? `${province.submittedPercent.toLocaleString("th-TH")}%` : ""}
                              </div>
                              <div className="province-progress-bar__pending" style={{ width: `${province.pendingPercent}%` }}>
                                {province.pendingPercent > 10 ? `${province.pendingPercent.toLocaleString("th-TH")}%` : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </div>
          ) : null}
          {!selectedDistrictCode && !isDistrictMode ? (
            <div className="province-issue-panel" aria-label="ประเด็นโรคภัยสุขภาพของจังหวัดที่เลือก">
              <div className="province-issue-panel__header">
                <div>
                  <h4>ประเด็นโรค/ภัยสุขภาพ</h4>
                  <p>
                    {selectedIssueProvinceName
                      ? `จังหวัด${selectedIssueProvinceName}`
                      : activeAgencyFilter
                        ? "เลือกแท่งจังหวัดจากกราฟเพื่อดูรายการ"
                        : "เลือก สคร. จากแผนที่ก่อน แล้วคลิกแท่งจังหวัด"}
                  </p>
                </div>
                {selectedIssueProvinceName ? <span>{selectedProvinceIssueRecords.length.toLocaleString("th-TH")} ข้อมูล</span> : null}
              </div>

              {!activeAgencyFilter ? (
                <p className="province-issue-empty">เลือก สคร. จากแผนที่ เพื่อเปลี่ยนกราฟเป็นรายจังหวัด</p>
              ) : !selectedIssueProvinceCode ? (
                <p className="province-issue-empty">คลิกแท่งจังหวัดในกราฟด้านบนเพื่อดูชื่อประเด็นโรค/ภัยสุขภาพ</p>
              ) : selectedProvinceIssueRecords.length === 0 ? (
                <p className="province-issue-empty">ยังไม่มีประเด็นโรค/ภัยสุขภาพของจังหวัด{selectedIssueProvinceName}</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>ลำดับที่</th><th>อำเภอ</th><th>ประเด็นโรคและสุขภาพ</th></tr>
                    </thead>
                    <tbody>
                      {selectedProvinceIssueRecords.map((record, index) => (
                        <tr key={`${record.districtCode}-${record.healthIssue}-${index}`}>
                          <td>{(index + 1).toLocaleString("th-TH")}</td>
                          <td>{record.districtName}</td>
                          <td>{record.healthIssue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </article>
      </div>
          )}
        </div>
      </div>

      {accessScope?.agencyCode ? (
        <p className="inline-message">กำลังแสดงข้อมูลภายใต้สิทธิ์ {accessScope.role} ของ {accessScope.agencyCode}</p>
      ) : null}

      {showAdvancedPanels ? (
        <article className="panel alert-panel">
        <div className="section-row">
          <div>
            <h3>สถานะและสัญญาณเตือน</h3>
            <p className="section-row__subtitle">สีของสถานะอิงจากค่าเฉลี่ย KPI และเทียบกับปีก่อนอัตโนมัติ</p>
          </div>
          <div className="section-row__actions">
            <span className="filter-chip">ปีนี้ {selectedFiscalYear}</span>
            <span className="filter-chip">ปีก่อน {previousKpiSummaryRows[0]?.fiscal_year ?? "-"}</span>
            <span className={`status-badge ${overallRiskTone(overallRiskLevel)}`}>{overallRiskLabel(overallRiskLevel)}</span>
          </div>
        </div>

        <div className="alert-summary-grid">
          <div className="summary-mini">
            <strong>{kpiStatusCounts.good}</strong>
            <span>บรรลุ</span>
          </div>
          <div className="summary-mini">
            <strong>{kpiStatusCounts.warning}</strong>
            <span>เฝ้าระวัง</span>
          </div>
          <div className="summary-mini">
            <strong>{kpiStatusCounts.critical}</strong>
            <span>ต่ำกว่าเป้า</span>
          </div>
        </div>

        {kpiAlerts.length === 0 ? (
          <p className="inline-message">ทุก KPI อยู่ในสถานะบรรลุเป้าหมายของรอบนี้</p>
        ) : (
          <div className="alert-list">
            {kpiAlerts.map((item) => (
              <div key={item.kpi_code} className="alert-item">
                <div>
                  <strong>{item.kpi_name_th}</strong>
                  <p>
                    ค่าเฉลี่ย {item.avg_percent.toFixed(2)}% {item.delta !== null ? `(${item.delta > 0 ? "+" : ""}${item.delta.toFixed(2)} จากปีก่อน)` : ""}
                  </p>
                </div>
                <div className="alert-item__meta">
                  <span className={`status-badge ${item.statusTone}`}>{item.statusLabel}</span>
                  <span className="trend-pill">{item.trendLabel}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        </article>
      ) : null}

      {showAdvancedPanels ? (
        <article className="panel table-panel">
        <div className="section-row">
          <h3>Phase 7 Readiness</h3>
          <p className="section-row__subtitle">ชุดตรวจความพร้อมพื้นฐานก่อนเข้าสู่ UAT</p>
        </div>
        <div className="readiness-grid">
          {readinessChecks.map((check) => (
            <div key={check.key} className="readiness-card">
              <div className="readiness-card__top">
                <strong>{check.label}</strong>
                <span className={`status-badge ${readinessTone(check.severity)}`}>{readinessLabel(check.severity)}</span>
              </div>
              <p>{check.detail}</p>
            </div>
          ))}
        </div>
        </article>
      ) : null}

      {showAdvancedPanels ? <SuperadminUsersPanel accessScope={accessScope} /> : null}

      {/*
      <article className="panel table-panel">
        <div className="section-row">
          <h3>Forecast เบื้องต้น</h3>
          <p className="section-row__subtitle">คาดการณ์รอบถัดไปจากส่วนต่างระหว่างปีปัจจุบันกับปีก่อน</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>KPI</th>
                <th>คาดการณ์</th>
                <th>สถานะคาดการณ์</th>
              </tr>
            </thead>
            <tbody>
              {kpiForecastRows.map((item) => (
                <tr key={item.kpi_code}>
                  <td>{item.kpi_name_th}</td>
                  <td>{item.forecastLabel}</td>
                  <td>
                    <span className={item.forecastTone}>{item.forecast === null ? "ไม่มีข้อมูลพอคาดการณ์" : item.forecast >= 50 ? "น่าจะบรรลุ" : item.forecast >= 40 ? "เฝ้าระวัง" : "เสี่ยงต่ำกว่าเป้า"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      */}


      {/*
      <article className="panel table-panel">
        <div className="section-row">
          <h3>KPI Summary (Phase 4)</h3>
          <div className="section-row__actions">
            <label>
              ปีงบประมาณ
              <select value={selectedFiscalYear} onChange={(e) => setSelectedFiscalYear(Number(e.target.value))}>
                {fiscalYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </label>
            <button type="button" className="cta cta--ghost" onClick={clearTableFilters} disabled={!filterAgency && !filterProvince}>
              ล้างตัวกรองตาราง
            </button>
            <button type="button" className="cta cta--solid" onClick={exportKpiSummaryCsv}>
              Export KPI CSV
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>KPI</th>
                <th>สถานะ</th>
                <th>แนวโน้ม</th>
                <th>ค่าเฉลี่ยร้อยละ</th>
                <th>ค่าเฉลี่ยคะแนน</th>
                <th>จำนวน สคร. ที่มีข้อมูล</th>
              </tr>
            </thead>
            <tbody>
              {kpiStatusRows.map((item) => (
                <tr key={item.kpi_code}>
                  <td>{item.kpi_name_th}</td>
                  <td><span className={`status-badge ${item.statusTone}`}>{item.statusLabel}</span></td>
                  <td><span className="trend-pill">{item.trendLabel}</span></td>
                  <td>{item.avg_percent.toFixed(2)}</td>
                  <td>{item.avg_score.toFixed(2)}</td>
                  <td>{item.agency_count}</td>
                </tr>
              ))}
              {kpiSummaryRows.length === 0 ? (
                <tr><td colSpan={6}>ยังไม่มีข้อมูล KPI จริงสำหรับปี {selectedFiscalYear}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel table-panel">
        <h3>ความครอบคลุมข้อมูลตาม สคร.</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>หน่วยงาน</th><th>จำนวนรายการ</th></tr></thead>
            <tbody>
              {visibleAgencyCoverage.map((item) => (
                <tr key={item.agency_code}><td>{item.agency_name}</td><td>{item.record_count.toLocaleString("th-TH")}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="panel table-panel">
        <h3>ความครอบคลุมระดับจังหวัด</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>จังหวัด</th>
                <th>สคร.</th>
                <th>จำนวนรายการ</th>
              </tr>
            </thead>
            <tbody>
              {visibleProvinceCoverage.map((item) => (
                <tr key={item.province_code}>
                  <td>{item.province_name}</td>
                  <td>{item.agency_name}</td>
                  <td>{item.record_count.toLocaleString("th-TH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      */}

    </section>
  );
}

