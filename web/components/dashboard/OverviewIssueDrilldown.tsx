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
    selectedOverviewMapIssue,
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

  if (!selectedOverviewMapIssue) return null;

  const selectedDistrict = selectedOverviewMapDistrictRows.find((row) => row.code === selectedOverviewMapDistrictCode);
  const selectProvince = (provinceCode: string) => {
    const nextProvinceCode = selectedOverviewMapProvinceCode === provinceCode ? "" : provinceCode;
    setSelectedOverviewMapProvinceCode(nextProvinceCode);
    setSelectedOverviewMapDistrictCode("");
  };

  return (
    <section className={`panel ${styles.panel}`} aria-label={`พื้นที่ที่พบ ${selectedOverviewMapIssue}`} aria-live="polite">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>เจาะข้อมูลตามพื้นที่</span>
          <h3>{selectedOverviewMapIssue}</h3>
          <p>เลือกจังหวัด แล้วเลือกอำเภอเพื่อดูข้อมูลประเด็นโรคของพื้นที่นั้น</p>
        </div>
        <span className={styles.issueBadge} style={{ background: activeOverviewMapIssueColor }}>
          {provinceRows.length.toLocaleString("th-TH")} จังหวัด
        </span>
      </header>

      <div className={styles.columns}>
        <section className={styles.column} aria-label="จังหวัดที่พบประเด็นโรค">
          <div className={styles.columnHeader}>
            <div><span>ขั้นที่ 1</span><h4>จังหวัดที่พบข้อมูล</h4></div>
            <strong>{provinceRows.length.toLocaleString("th-TH")} จังหวัด</strong>
          </div>
          <div className={styles.list}>
            {provinceRows.map((province) => (
              <button
                key={province.code}
                type="button"
                className={`${styles.row}${selectedOverviewMapProvinceCode === province.code ? ` ${styles.active}` : ""}`}
                onClick={() => selectProvince(province.code)}
              >
                <span><b>{province.name}</b></span>
                <strong>{province.districtCount.toLocaleString("th-TH")} อำเภอ</strong>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.column} aria-label="อำเภอที่พบประเด็นโรค">
          <div className={styles.columnHeader}>
            <div><span>ขั้นที่ 2</span><h4>{selectedOverviewMapProvinceName ? `อำเภอในจังหวัด${selectedOverviewMapProvinceName}` : "เลือกจังหวัด"}</h4></div>
            {selectedOverviewMapProvinceCode ? <strong>{selectedOverviewMapDistrictRows.length.toLocaleString("th-TH")} อำเภอ</strong> : null}
          </div>
          {!selectedOverviewMapProvinceCode ? (
            <p className={styles.empty}>กดจังหวัดทางซ้ายเพื่อแสดงอำเภอที่มีประเด็นนี้</p>
          ) : selectedOverviewMapDistrictRows.length === 0 ? (
            <p className={styles.empty}>ยังไม่มีข้อมูลระดับอำเภอในจังหวัดนี้</p>
          ) : (
            <div className={styles.list}>
              {selectedOverviewMapDistrictRows.map((district) => (
                <button
                  key={district.code}
                  type="button"
                  className={`${styles.row}${selectedOverviewMapDistrictCode === district.code ? ` ${styles.active}` : ""}`}
                  onClick={() => setSelectedOverviewMapDistrictCode((current) => current === district.code ? "" : district.code)}
                >
                  <span><b>{district.name}</b><small>{selectedOverviewMapIssue}</small></span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedDistrict ? (
        <div className={styles.selectedSummary} style={{ borderColor: activeOverviewMapIssueColor }}>
          <span>ข้อมูลประเด็นโรคของอำเภอที่เลือก</span>
          <strong>อำเภอ{selectedOverviewMapDistrictName} จังหวัด{selectedOverviewMapProvinceName}</strong>
          <p><i style={{ background: activeOverviewMapIssueColor }} />{selectedOverviewMapIssue} · {selectedDistrict.record_count.toLocaleString("th-TH")} รายการ</p>
        </div>
      ) : null}
    </section>
  );
}
