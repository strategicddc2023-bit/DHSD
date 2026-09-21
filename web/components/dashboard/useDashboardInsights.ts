"use client";

import { useEffect, useMemo } from "react";
import type { CoverageChartRow, HealthIssueDonutRow, HealthIssueEvaluationRow, ProvinceHealthIssueRecord } from "./dashboard-shared";
import { healthIssueDonutColors, healthIssueGroupLabels } from "./dashboard-shared";

export function useDashboardInsights(model: ReturnType<typeof import("./useDashboardBase").useDashboardBase>) {
  const { formData, rows, totalCount, agencies, provinces, districts, agencyProvinceMap, submittedDistrictCodesByProvince, districtRecordCount, selectedDistrictCode, selectedDistrictName, districtHealthIssueData, provinceHealthIssueRecords, healthIssueScopeRecords, masterHealthIssues, selectedHealthIssue, setSelectedHealthIssue, selectedOverviewIssue, selectedOverviewMapIssue, selectedOverviewMapProvinceCode, setSelectedOverviewMapProvinceCode, selectedOverviewMapDistrictCode, setSelectedOverviewMapDistrictCode, issueDetailScope, overviewFilter, activeAgencyFilter, activeProvinceFilter, visibleAgencyCoverage, visibleProvinceCoverage, overviewAreaTotals, districtCountByProvince, selectedIssueProvinceCode } = model;
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
    () => {
      const scopedRecords = healthIssueScopeRecords.filter((record) => {
        if (selectedOverviewMapProvinceCode && record.provinceCode !== selectedOverviewMapProvinceCode) return false;
        if (selectedOverviewMapDistrictCode && record.districtCode !== selectedOverviewMapDistrictCode) return false;
        return true;
      });
      const grouped = new Map<string, { issue: string; count: number; provinceCodes: Set<string>; districtCodes: Set<string> }>();

      scopedRecords.forEach((record) => {
        const issue = record.healthIssue.trim();
        if (!issue) return;
        const row = grouped.get(issue) ?? { issue, count: 0, provinceCodes: new Set<string>(), districtCodes: new Set<string>() };
        row.count += 1;
        row.provinceCodes.add(record.provinceCode);
        row.districtCodes.add(record.districtCode);
        grouped.set(issue, row);
      });

      const baseColorByIssue = new Map(
        overviewIssueChartRows.map((row, index) => [row.issue, healthIssueDonutColors[index % healthIssueDonutColors.length]])
      );

      return [...grouped.values()]
        .map((row) => {
          const totalDistrictCount = selectedOverviewMapDistrictCode
            ? 1
            : selectedOverviewMapProvinceCode
              ? districtCountByProvince.get(selectedOverviewMapProvinceCode) ?? 0
              : [...row.provinceCodes].reduce((total, provinceCode) => total + (districtCountByProvince.get(provinceCode) ?? 0), 0);
          const districtCount = row.districtCodes.size;
          return {
            issue: row.issue,
            count: row.count,
            provinceCount: row.provinceCodes.size,
            totalDistrictCount,
            districtCount,
            percent: totalDistrictCount > 0 ? Number(((districtCount / totalDistrictCount) * 100).toFixed(2)) : 0,
            color: baseColorByIssue.get(row.issue) ?? healthIssueDonutColors[0],
          };
        })
        .sort((a, b) => b.districtCount - a.districtCount || b.count - a.count || a.issue.localeCompare(b.issue, "th"))
        .slice(0, 8);
    },
    [districtCountByProvince, healthIssueScopeRecords, overviewIssueChartRows, selectedOverviewMapDistrictCode, selectedOverviewMapProvinceCode]
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
  const overviewMetricTotals = useMemo(() => {
    const hasFocusedMapSelection = Boolean(activeOverviewMapIssue || selectedOverviewMapProvinceCode || selectedOverviewMapDistrictCode);
    if (!hasFocusedMapSelection) {
      return {
        ...overviewAreaTotals,
        issueCount: healthIssueDonutTotal,
      };
    }

    const scopedRecords = overviewMapActiveRecords.filter((record) => {
      if (selectedOverviewMapProvinceCode && record.provinceCode !== selectedOverviewMapProvinceCode) return false;
      if (selectedOverviewMapDistrictCode && record.districtCode !== selectedOverviewMapDistrictCode) return false;
      return true;
    });

    const recordProvinceCodes = new Set(scopedRecords.map((record) => record.provinceCode).filter(Boolean));
    const scopedProvinceCodes = selectedOverviewMapProvinceCode
      ? [selectedOverviewMapProvinceCode]
      : [...recordProvinceCodes];
    const scopedProvinceCodeSet = new Set(scopedProvinceCodes);
    const scopedDistricts = selectedOverviewMapDistrictCode
      ? districts.filter((district) => district.province_code === selectedOverviewMapProvinceCode && district.code === selectedOverviewMapDistrictCode)
      : districts.filter((district) => scopedProvinceCodeSet.has(district.province_code));
    const scopedDistrictKeys = new Set(scopedDistricts.map((district) => `${district.province_code}::${district.code}`));
    const submittedDistrictKeys = new Set<string>();

    scopedRecords.forEach((record) => {
      const key = `${record.provinceCode}::${record.districtCode}`;
      if (selectedOverviewMapDistrictCode || scopedDistrictKeys.has(key)) {
        submittedDistrictKeys.add(key);
      }
    });

    const provinceCount = selectedOverviewMapDistrictCode || selectedOverviewMapProvinceCode
      ? scopedProvinceCodes.length
      : recordProvinceCodes.size;
    const districtCount = selectedOverviewMapDistrictCode ? 1 : scopedDistricts.length;
    const submittedDistrictCount = selectedOverviewMapDistrictCode
      ? Math.min(submittedDistrictKeys.size, 1)
      : Math.min(submittedDistrictKeys.size, districtCount);
    const pendingDistrictCount = Math.max(0, districtCount - submittedDistrictCount);
    const submittedPercent = districtCount > 0 ? Number(((submittedDistrictCount / districtCount) * 100).toFixed(2)) : 0;
    const pendingPercent = districtCount > 0 ? Number((100 - submittedPercent).toFixed(2)) : 0;

    return {
      agencyCount: overviewAreaTotals.agencyCount,
      provinceCount,
      districtCount,
      submittedDistrictCount,
      pendingDistrictCount,
      submittedPercent,
      pendingPercent,
      issueCount: scopedRecords.length,
    };
  }, [activeOverviewMapIssue, districts, healthIssueDonutTotal, overviewAreaTotals, overviewMapActiveRecords, selectedOverviewMapDistrictCode, selectedOverviewMapProvinceCode]);
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
    { key: "agency-order" as const, label: "ภาพรวม สคร." },
    { key: "province-active" as const, label: "ภาพรวมจังหวัด" },
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


  return { coverageChartRows, selectedIssueProvinceName, isDistrictMode, healthIssueDonutScopeLabel, healthIssueDonutData, healthIssueDonutTotal, overviewIssueTableRows, overviewIssueChartRows, overviewIssueDonutRows, healthIssueGroupRows, healthIssueGroupTotal, healthIssueEvaluationRows, healthIssueEvaluationChartHeight, selectedOverviewIssueRecords, selectedOverviewIssueAgencyRows, selectedOverviewIssueProvinceRows, selectedOverviewIssueDistrictRows, issueDetailScopeOptions, activeIssueDetailScope, overviewIssueColorMap, activeOverviewMapIssue, selectedOverviewIssueColor, activeOverviewMapIssueColor, overviewMapRecords, overviewMapActiveRecords, overviewMetricTotals, selectedOverviewMapProvinceName, selectedOverviewMapDistrictRows, selectedOverviewMapDistrictName, selectedOverviewIssueChartHeight, selectedHealthIssueCount, selectedHealthIssueRecords, overviewFilterOptions, overviewChartRows, overviewChartTitle, isOverviewMode, coverageChartTitle, dashboardContextLabel, selectedProvinceIssueRecords };
}
