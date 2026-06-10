"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccessScope } from "@/services/access-control";
import { resolveVisibleAgencyCodes, resolveVisibleProvinceCodes } from "@/services/access-control";
import { supabase } from "@/services/supabase-client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import InteractiveHealthMap from "@/components/InteractiveHealthMap";
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
  IntakeFormData,
  IntakeRecordRow,
  KpiSummaryRow,
  Province,
  ProvinceCoverageRow,
} from "@/types/mvp";

type DashboardSectionProps = {
  formData: IntakeFormData;
  refreshKey: number;
  accessScope?: AccessScope;
  viewMode?: "public" | "backoffice";
  onSelectDistrictForIntake?: (selection: { agencyCode: string; provinceCode: string; districtCode: string }) => void;
};

type SavedRecordDraft = {
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  healthIssue: string;
};

const fiscalYears = [2566, 2567, 2568, 2569, 2570];
const latestRecordsPageSize = 10;

const getRelatedLabel = <T,>(value: T | T[] | null | undefined, picker: (item: T) => string | null | undefined) => {
  const item = Array.isArray(value) ? value[0] : value;
  return item ? picker(item) : undefined;
};

export default function DashboardSection({ formData, refreshKey, accessScope, viewMode = "backoffice", onSelectDistrictForIntake }: DashboardSectionProps) {
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
  const [kpiSummaryRows, setKpiSummaryRows] = useState<KpiSummaryRow[]>([]);
  const [previousKpiSummaryRows, setPreviousKpiSummaryRows] = useState<KpiSummaryRow[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2569);
  const [filterAgency, setFilterAgency] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
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

  useEffect(() => {
    const loadFilterOptions = async () => {
      const [agencyRes, provinceRes, districtRes, mappingRes] = await Promise.all([
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("master_districts").select("code,name_th,province_code").order("name_th", { ascending: true }),
        supabase.from("agency_provinces").select("agency_code,province_code"),
      ]);

      setAgencies(agencyRes.data ?? []);
      setProvinces(provinceRes.data ?? []);
      setDistricts(districtRes.data ?? []);
      setAgencyProvinceMap((mappingRes.data as AgencyProvinceMapRow[]) ?? []);
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
          "id,created_at,health_issue_text,agency_code,province_code,district_code,master_agencies(label_th),master_provinces(name_th),master_districts(name_th)"
        )
        .order("created_at", { ascending: false })
        .range(latestRecordsFrom, latestRecordsTo);

      let countQuery = supabase.from("intake_records").select("*", { count: "exact", head: true });

      if (activeAgencyFilter) query = query.eq("agency_code", activeAgencyFilter);
      if (activeProvinceFilter) query = query.eq("province_code", activeProvinceFilter);
      if (activeAgencyFilter) countQuery = countQuery.eq("agency_code", activeAgencyFilter);
      if (activeProvinceFilter) countQuery = countQuery.eq("province_code", activeProvinceFilter);

      const [{ data }, { count }, intakeSummaryRes, kpiSummaryRes, previousKpiSummaryRes] = await Promise.all([
        canViewSavedRecords ? query : Promise.resolve({ data: [] as IntakeRecordRow[] }),
        countQuery,
        (() => {
          let summaryQuery = supabase
            .from("intake_records")
            .select("agency_code,province_code,master_agencies(label_th),master_provinces(name_th)")
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
              master_agencies: { label_th: string }[] | null;
              master_provinces: { name_th: string }[] | null;
            }>
          | null) ?? [];

      const agencySet = new Set(summaryRows.map((item) => item.agency_code).filter(Boolean));
      const provinceSet = new Set(summaryRows.map((item) => item.province_code).filter(Boolean));
      setAgencyActiveCount(agencySet.size);
      setProvinceActiveCount(provinceSet.size);

      const agencyMap = new Map<string, number>();
      const provinceMap = new Map<string, number>();
      summaryRows.forEach((item) => {
        if (item.agency_code) {
          agencyMap.set(item.agency_code, (agencyMap.get(item.agency_code) ?? 0) + 1);
        }
        if (item.province_code) {
          provinceMap.set(item.province_code, (provinceMap.get(item.province_code) ?? 0) + 1);
        }
      });

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
    return chips;
  }, [agencies, activeAgencyFilter, activeProvinceFilter, provinces]);

  const clearTableFilters = () => {
    if (!accessScope?.agencyCode) {
      setFilterAgency("");
    }
    setFilterProvince("");
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
            <select value={filterAgency} onChange={(event) => setFilterAgency(event.target.value)}>
              <option value="">ทั้งหมด</option>
              {visibleAgencies.map((agency) => (<option key={agency.code} value={agency.code}>{agency.label_th}</option>))}
            </select>
          )}
        </label>

        <label>
          กรองจังหวัด
          <select value={activeProvinceFilter} onChange={(event) => setFilterProvince(event.target.value)} disabled={Boolean(accessScope?.provinceCode)}>
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
                            onChange={(event) => updateEditDraft({ districtCode: event.target.value })}
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
      <div className="section__header">
        <h2>Dashboard Preview</h2>
        <p>โครงแสดงผลแผนที่ สคร. 13 เขต และรายการข้อมูลล่าสุดจากฐานข้อมูล</p>
      </div>

      {savedRecordsPanel}

      <div className="dashboard-grid">
        <article className="panel panel--map">
          <h3>แผนที่เขตสุขภาพ (สคร.1-สคร.13)</h3>
          <InteractiveHealthMap
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
            accessScope={accessScope}
            onSelectDistrictForIntake={onSelectDistrictForIntake}
            onSelectAgency={(agencyCode) =>
              accessScope?.agencyCode
                ? undefined
                : setFilterAgency((current) => (current === agencyCode ? "" : agencyCode))
            }
          />
          <div className="map-actions">
            <p className="inline-message">
              {activeAgencyFilter
                ? "คลิกเขตเดิมซ้ำเพื่อยกเลิกการกรองหน่วยงาน"
                : "คลิกเขตบนแผนที่เพื่อกรองข้อมูล"}
            </p>
            <button type="button" className="cta cta--ghost" onClick={() => setFilterAgency("")} disabled={!filterAgency || Boolean(accessScope?.agencyCode)}>
              ล้างตัวกรองแผนที่
            </button>
          </div>
        </article>

        <article className="panel">
          <h3>ความครอบคลุมข้อมูลตาม สคร.</h3>
          <div style={{ width: "100%", height: 350, marginTop: 16 }}>
            <ResponsiveContainer>
              <BarChart data={visibleAgencyCoverage} margin={{ top: 20, right: 20, bottom: 40, left: -20 }}>
                <XAxis 
                  dataKey="agency_name" 
                  tick={{ fontSize: 12, fill: "#4b647d" }} 
                  interval={0} 
                  angle={-45} 
                  textAnchor="end" 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#4b647d" }} />
                <Tooltip cursor={{ fill: "rgba(16, 36, 62, 0.04)" }} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 30px rgba(16,36,62,0.1)" }} />
                <Bar dataKey="record_count" radius={[6, 6, 0, 0]}>
                  {visibleAgencyCoverage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.agency_code === (activeAgencyFilter || formData.agencyCode) ? "#f9007a" : "#00c4b4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="dashboard-summary">
        <article className="summary-card">
          <p>ปีงบประมาณ KPI</p>
          <h3>{selectedFiscalYear}</h3>
          <span>ใช้สรุปผล KPI Summary</span>
        </article>
        <article className="summary-card">
          <p>ตัวกรองข้อมูล</p>
          <h3>{activeFilterChips.length}</h3>
          <span>{activeFilterChips.length ? activeFilterChips.join(" · ") : "ยังไม่ได้กรองข้อมูล"}</span>
        </article>
        <article className="summary-card">
          <p>หน่วยงานบนแผนที่</p>
          <h3>{selectedMapAgencyLabel}</h3>
          <span>คลิกที่แผนที่เพื่อเปลี่ยนบริบท</span>
        </article>
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

      <div className="metrics-grid">
        <article className="metric-card"><p>จำนวนรายการตามตัวกรอง</p><h3>{totalCount.toLocaleString("th-TH")}</h3></article>
        <article className="metric-card"><p>สคร.ที่มีข้อมูล</p><h3>{agencyActiveCount.toLocaleString("th-TH")}</h3></article>
        <article className="metric-card"><p>จังหวัดที่มีข้อมูล</p><h3>{provinceActiveCount.toLocaleString("th-TH")}</h3></article>
        <article className="metric-card"><p>หน่วยงานข้อมูลสูงสุด</p><h3>{topAgency}</h3></article>
        <article className="metric-card"><p>จังหวัดข้อมูลสูงสุด</p><h3>{topProvince}</h3></article>
      </div>

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

    </section>
  );
}

