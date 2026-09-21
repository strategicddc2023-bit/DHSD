"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { resolveVisibleAgencyCodes, resolveVisibleProvinceCodes } from "@/services/access-control";
import { supabase } from "@/services/supabase-client";
import { loadDistrictHealthIssueSummary } from "@/services/health-issue-service";
import type { AgencyCoverageRow, AgencyProvinceMapRow, AgencyOption, District, HealthIssueOption, IntakeEvaluationStatus, IntakeRecordRow, KpiSummaryRow, Province, ProvinceCoverageRow } from "@/types/mvp";
import { fiscalYears, getRelatedLabel, latestRecordsPageSize } from "./dashboard-shared";
import type { AgencySubmissionProgressGroup, DashboardInsightTab, DashboardSectionProps, ProvinceHealthIssueRecord, SavedRecordDraft } from "./dashboard-shared";

export function useDashboardBase(props: DashboardSectionProps) {
  const { formData, refreshKey, accessScope, viewMode = "backoffice", hideSavedRecords = false, onSelectDistrictForIntake } = props;
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


  return { formData, refreshKey, accessScope, viewMode, hideSavedRecords, onSelectDistrictForIntake, mapRef, rows, setRows, loading, setLoading, totalCount, setTotalCount, agencyActiveCount, setAgencyActiveCount, provinceActiveCount, setProvinceActiveCount, topAgency, setTopAgency, topProvince, setTopProvince, agencies, setAgencies, provinces, setProvinces, districts, setDistricts, agencyProvinceMap, setAgencyProvinceMap, agencyCoverage, setAgencyCoverage, provinceCoverage, setProvinceCoverage, submittedDistrictCodesByProvince, setSubmittedDistrictCodesByProvince, districtRecordCount, setDistrictRecordCount, kpiSummaryRows, setKpiSummaryRows, previousKpiSummaryRows, setPreviousKpiSummaryRows, selectedFiscalYear, setSelectedFiscalYear, filterAgency, setFilterAgency, filterProvince, setFilterProvince, selectedDistrictCode, setSelectedDistrictCode, selectedSubdistrictCode, setSelectedSubdistrictCode, selectedDistrictName, districtHealthIssueData, setDistrictHealthIssueData, districtHealthIssueTotal, setDistrictHealthIssueTotal, districtHealthIssueLoading, setDistrictHealthIssueLoading, provinceHealthIssueRecords, setProvinceHealthIssueRecords, healthIssueScopeRecords, setHealthIssueScopeRecords, masterHealthIssues, setMasterHealthIssues, dashboardInsightTab, setDashboardInsightTab, selectedHealthIssue, setSelectedHealthIssue, selectedOverviewIssue, setSelectedOverviewIssue, selectedOverviewMapIssue, setSelectedOverviewMapIssue, selectedOverviewMapProvinceCode, setSelectedOverviewMapProvinceCode, selectedOverviewMapDistrictCode, setSelectedOverviewMapDistrictCode, issueDetailScope, setIssueDetailScope, overviewFilter, setOverviewFilter, latestRecordsPage, setLatestRecordsPage, recordsRefreshKey, setRecordsRefreshKey, editingRecordId, setEditingRecordId, editDraft, setEditDraft, recordActionMessage, setRecordActionMessage, savingRecordId, setSavingRecordId, deletingRecordId, setDeletingRecordId, activeAgencyFilter, activeProvinceFilter, canViewSavedRecords, visibleAgencyCodes, visibleProvinceCodes, visibleAgencies, visibleProvinces, dashboardProvinceOptions, dashboardDistrictOptions, editProvinceOptions, editDistrictOptions, visibleAgencyCoverage, visibleProvinceCoverage, showAdvancedPanels, latestRecordsPageCount, latestRecordsStart, latestRecordsEnd, dashboardMenuAgencies, overviewAreaTotals, selectedAgencyLabel, selectedProvinceLabel, selectedMapAgencyLabel, activeFilterChips, districtCountByProvince, provinceSubmissionGroups, selectedIssueProvinceCode, selectedAgencyAreaTotals };
}
