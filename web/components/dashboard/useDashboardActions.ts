"use client";

import { useMemo } from "react";
import { supabase } from "@/services/supabase-client";
import { forecastLabel, forecastPercent, overallRiskFromCounts, kpiStatusFromPercent, kpiStatusLabel, kpiStatusTone, trendDirectionFromDelta, trendLabel } from "@/services/dashboard-analytics";
import type { ReadinessCheck } from "@/services/qa-readiness";
import type { IntakeRecordRow } from "@/types/mvp";
import { getRelatedLabel } from "./dashboard-shared";
import type { CoverageChartRow, DashboardInsightTab, SavedRecordDraft } from "./dashboard-shared";

type DashboardActionInput = ReturnType<typeof import("./useDashboardBase").useDashboardBase> & ReturnType<typeof import("./useDashboardInsights").useDashboardInsights>;

export function useDashboardActions(model: DashboardActionInput) {
  const { accessScope, mapRef, rows, agencies, provinces, districts, agencyProvinceMap, provinceCoverage, kpiSummaryRows, previousKpiSummaryRows, selectedFiscalYear, setFilterAgency, setFilterProvince, setSelectedDistrictCode, setSelectedSubdistrictCode, setDashboardInsightTab, setSelectedHealthIssue, setSelectedOverviewIssue, setSelectedOverviewMapIssue, overviewFilter, setRecordsRefreshKey, editingRecordId, setEditingRecordId, editDraft, setEditDraft, setRecordActionMessage, setSavingRecordId, setDeletingRecordId, activeAgencyFilter, activeProvinceFilter } = model;
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

  return { handleOverviewChartBarClick, handleCoverageChartBarClick, clearMapFilters, clearTableFilters, selectDashboardOverview, selectDashboardAgency, selectDashboardInsight, handleDashboardAgencyChange, handleDashboardProvinceChange, handleDashboardDistrictChange, beginEditRecord, cancelEditRecord, updateEditDraft, saveEditedRecord, deleteRecord, exportLatestRowsCsv, exportKpiSummaryCsv, kpiSummary, previousKpiSummaryMap, kpiStatusRows, kpiAlerts, kpiForecastRows, kpiStatusCounts, overallRiskLevel, readinessChecks };
}
