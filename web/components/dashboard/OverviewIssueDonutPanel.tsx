"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { HEALTH_ISSUE_GROUPS } from "../../types/mvp";
import type { DashboardModel } from "./DashboardSectionImpl";
import OverviewIssueDrilldown from "./OverviewIssueDrilldown";
import { donutPercentLabelFormatter } from "./dashboard-shared";
import styles from "./OverviewIssueDonutPanel.module.css";

type OverviewIssueDonutPanelProps = {
  model: DashboardModel;
};

export default function OverviewIssueDonutPanel({ model }: OverviewIssueDonutPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const {
    overviewIssueDonutRows,
    overviewIssueTotal,
    masterHealthIssues,
    selectedOverviewMapDistrictName,
    selectedOverviewMapProvinceName,
    selectedOverviewMapIssue,
    setSelectedOverviewMapIssue,
    setSelectedOverviewMapProvinceCode,
    setSelectedOverviewMapDistrictCode,
  } = model;
  const availableGroupOptions = useMemo(() => {
    const availableGroups = new Set(
      masterHealthIssues
        .filter((issue) => issue.is_active && issue.is_ddc_approved)
        .map((issue) => issue.issue_group)
    );
    return HEALTH_ISSUE_GROUPS.filter((option) => availableGroups.has(option.value));
  }, [masterHealthIssues]);
  const rankedIssueRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("th-TH");
    return overviewIssueDonutRows
      .filter((item) => selectedGroup === "all" || item.group === selectedGroup)
      .filter((item) => !normalizedSearch || item.issue.toLocaleLowerCase("th-TH").includes(normalizedSearch))
      .sort((a, b) => b.districtCount - a.districtCount || b.count - a.count || a.issue.localeCompare(b.issue, "th"))
      .slice(0, 10);
  }, [overviewIssueDonutRows, searchTerm, selectedGroup]);
  const pieIssueRows = useMemo(() => {
    const visibleTotal = rankedIssueRows.reduce((total, item) => total + item.districtCount, 0);
    const otherTotal = Math.max(0, overviewIssueTotal - visibleTotal);
    const visibleRows = rankedIssueRows.map((item) => ({ ...item, isOther: false }));
    if (otherTotal === 0) return visibleRows;
    return [
      ...visibleRows,
      {
        issue: "ประเด็นอื่นๆ / นอกเงื่อนไข",
        count: otherTotal,
        group: "other",
        groupLabel: "ประเด็นอื่นๆ / นอกเงื่อนไข",
        provinceCount: 0,
        totalDistrictCount: 0,
        districtCount: otherTotal,
        percent: overviewIssueTotal > 0 ? Number(((otherTotal / overviewIssueTotal) * 100).toFixed(2)) : 0,
        color: "#cbd5e1",
        isOther: true,
      },
    ];
  }, [overviewIssueTotal, rankedIssueRows]);
  const overviewPercentLabelFormatter = (props: any) => {
    const districtCount = Number(props.payload?.districtCount ?? props.value ?? 0);
    const percent = overviewIssueTotal > 0 ? districtCount / overviewIssueTotal : 0;
    return donutPercentLabelFormatter({ ...props, percent });
  };

  return (
    <aside className="panel overview-issue-control-panel">
      <div className="dashboard-overview__section-head overview-issue-control-panel__head">
        <div>
          <h3>
            สรุปภาพรวมประเด็นขับเคลื่อนงาน พชอ./พชข. ด้านป้องกันควบคุมโรคและภัยสุขภาพ
            {selectedOverviewMapDistrictName
              ? ` อำเภอ${selectedOverviewMapDistrictName}`
              : selectedOverviewMapProvinceName
                ? ` จังหวัด${selectedOverviewMapProvinceName}`
                : ""}
          </h3>
          <p>กดชิ้นกราฟเพื่อดูรายละเอียด หรือกดจำนวนตรงกลางเพื่อกลับสู่ภาพรวม</p>
        </div>
        <button
          type="button"
          className="overview-issue-clear-button"
          onClick={() => {
            setSelectedOverviewMapIssue("");
            setSelectedOverviewMapProvinceCode("");
            setSelectedOverviewMapDistrictCode("");
            setSearchTerm("");
            setSelectedGroup("all");
          }}
          disabled={!selectedOverviewMapIssue && !selectedOverviewMapProvinceName && !selectedOverviewMapDistrictName && !searchTerm && selectedGroup === "all"}
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
              <PieChart margin={{ top: 12, right: 24, bottom: 18, left: 24 }}>
                <Pie
                  data={pieIssueRows}
                  dataKey="districtCount"
                  nameKey="issue"
                  innerRadius={90}
                  outerRadius={138}
                  paddingAngle={2}
                  stroke="#ffffff"
                  strokeWidth={3}
                  label={overviewPercentLabelFormatter}
                  labelLine={false}
                  onClick={(item: any) => {
                    if (item.isOther) return;
                    setSelectedOverviewMapIssue((current) => (current === item.issue ? "" : item.issue));
                  }}
                >
                  {pieIssueRows.map((entry) => (
                    <Cell key={entry.issue} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props: any) => {
                    const item = props.payload?.[0]?.payload;
                    if (!props.active || !item) return null;
                    const percent = overviewIssueTotal > 0 ? (item.districtCount / overviewIssueTotal) * 100 : 0;
                    return (
                      <div className="overview-issue-donut-tooltip">
                        <strong>{item.issue}</strong>
                        <span>
                          {item.districtCount.toLocaleString("th-TH")} อำเภอ-ประเด็น · {percent.toLocaleString("th-TH", { maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <button
              type="button"
              className="overview-issue-donut-center"
              onClick={() => setSelectedOverviewMapIssue("")}
              aria-label={`กลับสู่ภาพรวมทั้งหมด ${overviewIssueTotal.toLocaleString("th-TH")} ประเด็น`}
              title="กลับสู่ภาพรวมทั้งหมด"
            >
              <strong>{overviewIssueTotal.toLocaleString("th-TH")}</strong>
              <span>ประเด็น</span>
              <small>ภาพรวม พชอ./พชข.</small>
            </button>
          </div>

          <div className={styles.filters} aria-label="ค้นหาและกรองอันดับประเด็นโรคและภัยสุขภาพ">
            <label className={styles.filterLabel}>
              ค้นหาประเด็นโรค/ภัยสุขภาพ
              <input
                className={styles.control}
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSelectedOverviewMapIssue("");
                }}
                placeholder="พิมพ์ชื่อประเด็นที่ต้องการค้นหา..."
              />
            </label>
            <label className={styles.filterLabel}>
              กลุ่มรายการ
              <select
                className={styles.control}
                value={selectedGroup}
                onChange={(event) => {
                  setSelectedGroup(event.target.value);
                  setSelectedOverviewMapIssue("");
                }}
              >
                <option value="all">ทุกกลุ่มรายการ</option>
                {availableGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <p className={styles.hint}>แสดงสูงสุด 10 อันดับ เรียงตามจำนวนอำเภอจากมากไปน้อย</p>
          </div>

          <div className="overview-issue-donut-detail">
            {rankedIssueRows.length === 0 ? (
              <p className="province-issue-empty">ไม่พบประเด็นโรค/ภัยสุขภาพที่ตรงกับเงื่อนไข</p>
            ) : rankedIssueRows.map((item) => {
              const isExpanded = selectedOverviewMapIssue === item.issue;
              return (
                <div key={item.issue} className="overview-issue-donut-detail__group">
                  <button
                    type="button"
                    className={`overview-issue-donut-detail__item${isExpanded ? " is-active" : ""}`}
                    onClick={() => setSelectedOverviewMapIssue((current) => (current === item.issue ? "" : item.issue))}
                    aria-expanded={isExpanded}
                  >
                    <span className="overview-issue-donut-detail__swatch" style={{ background: item.color }} />
                    <span className="overview-issue-donut-detail__name">{item.issue}</span>
                    <strong>{item.districtCount.toLocaleString("th-TH")} อำเภอ</strong>
                  </button>
                  {isExpanded ? <OverviewIssueDrilldown model={model} /> : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
