"use client";

import { useMemo } from "react";
import type { DashboardModel } from "./DashboardSectionImpl";
import styles from "./OverviewIssueDrilldown.module.css";

type ProvinceIssueRow = {
  code: string;
  name: string;
  recordCount: number;
  districtCount: number;
};

export default function OverviewIssueDrilldown({ model }: { model: DashboardModel }) {
  const {
    provinces,
    activeOverviewMapIssue,
    selectedOverviewMapProvinceCode,
    setSelectedOverviewMapProvinceCode,
    selectedOverviewMapDistrictCode,
    setSelectedOverviewMapDistrictCode,
    overviewMapActiveRecords,
    selectedOverviewMapProvinceName,
    selectedOverviewMapDistrictRows,
    selectedOverviewMapDistrictName,
    activeOverviewMapIssueColor,
  } = model;

  const provinceRows = useMemo<ProvinceIssueRow[]>(() => {
    const grouped = new Map<string, { recordCount: number; districtCodes: Set<string> }>();

    overviewMapActiveRecords.forEach((record) => {
      if (!record.provinceCode) return;
      const current = grouped.get(record.provinceCode) ?? { recordCount: 0, districtCodes: new Set<string>() };
      current.recordCount += 1;
      if (record.districtCode) current.districtCodes.add(record.districtCode);
      grouped.set(record.provinceCode, current);
    });

    return [...grouped.entries()]
      .map(([code, summary]) => ({
        code,
        name: provinces.find((province) => province.code === code)?.name_th ?? code,
        recordCount: summary.recordCount,
        districtCount: summary.districtCodes.size,
      }))
      .sort((a, b) => b.districtCount - a.districtCount || b.recordCount - a.recordCount || a.name.localeCompare(b.name, "th"));
  }, [overviewMapActiveRecords, provinces]);

  if (!activeOverviewMapIssue) return null;

  const selectedDistrict = selectedOverviewMapDistrictRows.find((row) => row.code === selectedOverviewMapDistrictCode);
  const selectProvince = (provinceCode: string) => {
    const nextProvinceCode = selectedOverviewMapProvinceCode === provinceCode ? "" : provinceCode;
    setSelectedOverviewMapProvinceCode(nextProvinceCode);
    setSelectedOverviewMapDistrictCode("");
  };

  return (
    <section className={styles.menu} aria-label={`พื้นที่ที่พบ ${activeOverviewMapIssue}`} aria-live="polite">
      <div className={styles.menuHeader}>
        <div><strong>จังหวัดที่พบข้อมูล</strong></div>
        <b>{provinceRows.length.toLocaleString("th-TH")} จังหวัด</b>
      </div>

      <div className={styles.provinceList}>
        {provinceRows.map((province) => {
          const isExpanded = selectedOverviewMapProvinceCode === province.code;
          return (
            <div key={province.code} className={styles.provinceGroup}>
              <button
                type="button"
                className={`${styles.row}${isExpanded ? ` ${styles.active}` : ""}`}
                onClick={() => selectProvince(province.code)}
                aria-expanded={isExpanded}
              >
                <span className={styles.rowLabel}>
                  <i aria-hidden="true">{isExpanded ? "−" : "+"}</i>
                  <b>{province.name}</b>
                </span>
                <strong>{province.districtCount.toLocaleString("th-TH")} อำเภอ</strong>
              </button>

              {isExpanded ? (
                <div className={styles.districtPanel} aria-label={`อำเภอในจังหวัด${province.name}`}>
                  <div className={styles.districtHeader}>
                    <span>อำเภอในจังหวัด{selectedOverviewMapProvinceName}</span>
                    <strong>{selectedOverviewMapDistrictRows.length.toLocaleString("th-TH")} อำเภอ</strong>
                  </div>
                  {selectedOverviewMapDistrictRows.length === 0 ? (
                    <p className={styles.empty}>ยังไม่มีข้อมูลระดับอำเภอในจังหวัดนี้</p>
                  ) : (
                    <div className={styles.districtList}>
                      {selectedOverviewMapDistrictRows.map((district) => (
                        <button
                          key={district.code}
                          type="button"
                          className={`${styles.districtRow}${selectedOverviewMapDistrictCode === district.code ? ` ${styles.active}` : ""}`}
                          onClick={() => setSelectedOverviewMapDistrictCode((current) => current === district.code ? "" : district.code)}
                          aria-pressed={selectedOverviewMapDistrictCode === district.code}
                        >
                          <span><b>{district.name}</b><small>{activeOverviewMapIssue}</small></span>
                          <strong>{district.record_count.toLocaleString("th-TH")} ประเด็น</strong>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {selectedDistrict ? (
        <div className={styles.selectedSummary} style={{ borderColor: activeOverviewMapIssueColor }}>
          <span>ข้อมูลประเด็นโรคของอำเภอที่เลือก</span>
          <strong>อำเภอ{selectedOverviewMapDistrictName} จังหวัด{selectedOverviewMapProvinceName}</strong>
          <p><i style={{ background: activeOverviewMapIssueColor }} />{activeOverviewMapIssue} · {selectedDistrict.record_count.toLocaleString("th-TH")} ประเด็น</p>
        </div>
      ) : null}
    </section>
  );
}
