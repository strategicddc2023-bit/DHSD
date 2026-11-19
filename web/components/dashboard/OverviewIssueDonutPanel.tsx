"use client";

import { useMemo, useState } from "react";
import { HEALTH_ISSUE_GROUPS } from "../../types/mvp";
import { healthIssueGroupLabels } from "./dashboard-shared";
import type { DashboardModel } from "./DashboardSectionImpl";
import OverviewIssueDrilldown from "./OverviewIssueDrilldown";
import styles from "./OverviewIssueDonutPanel.module.css";

type OverviewIssueDonutPanelProps = {
  model: DashboardModel;
};

type RoseSliceRow = {
  issue: string;
  count: number;
  group: string;
  groupLabel: string;
  provinceCount: number;
  totalDistrictCount: number;
  districtCount: number;
  percent: number;
  color: string;
  isOther: boolean;
};

const SVG_WIDTH = 440;
const SVG_HEIGHT = 400;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const INNER_RADIUS = 82;
const MIN_OUTER_RADIUS = 124;
const MAX_OUTER_RADIUS = 180;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function buildRoseArcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngleDeg: number,
  endAngleDeg: number
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngleDeg);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngleDeg);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngleDeg);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngleDeg);
  const isLargeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${isLargeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${isLargeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function formatSlicePercent(value: number) {
  if (value <= 0) return "";
  if (value < 1) return "<1%";
  return `${value.toLocaleString("th-TH", { maximumFractionDigits: value < 10 ? 1 : 0 })}%`;
}

export default function OverviewIssueDonutPanel({ model }: OverviewIssueDonutPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [isShowingOtherIssues, setIsShowingOtherIssues] = useState(false);
  const [hoveredSlice, setHoveredSlice] = useState<RoseSliceRow | null>(null);
  const {
    overviewIssueDonutRows,
    overviewIssueTotal,
    overviewMetricTotals,
    masterHealthIssues,
    selectedOverviewMapDistrictName,
    selectedOverviewMapProvinceName,
    selectedOverviewMapIssue,
    setSelectedOverviewMapIssue,
    setSelectedOverviewMapProvinceCode,
    setSelectedOverviewMapDistrictCode,
  } = model;

  const availableGroupOptions = useMemo(() => {
    const availableGroups = new Set<string>(
      masterHealthIssues
        .filter((issue) => issue.is_active && issue.is_ddc_approved)
        .map((issue) => issue.issue_group)
    );
    overviewIssueDonutRows.forEach((item) => availableGroups.add(item.group));
    const options: Array<{ value: string; label: string }> = HEALTH_ISSUE_GROUPS.filter((option) => availableGroups.has(option.value));
    if (availableGroups.has("legacy_unresolved")) {
      options.push({ value: "legacy_unresolved", label: healthIssueGroupLabels.legacy_unresolved });
    }
    return options;
  }, [masterHealthIssues, overviewIssueDonutRows]);

  const rankedIssueRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("th-TH");
    return overviewIssueDonutRows
      .filter((item) => selectedGroup === "all" || item.group === selectedGroup)
      .filter((item) => !normalizedSearch || item.issue.toLocaleLowerCase("th-TH").includes(normalizedSearch))
      .sort((a, b) => b.districtCount - a.districtCount || b.count - a.count || a.issue.localeCompare(b.issue, "th"))
      .slice(0, 10);
  }, [overviewIssueDonutRows, searchTerm, selectedGroup]);

  const otherIssueRows = useMemo(() => {
    const visibleIssueSet = new Set(rankedIssueRows.map((item) => `${item.issue}:${item.group}`));
    return overviewIssueDonutRows
      .filter((item) => !visibleIssueSet.has(`${item.issue}:${item.group}`))
      .sort((a, b) => b.districtCount - a.districtCount || b.count - a.count || a.issue.localeCompare(b.issue, "th"));
  }, [overviewIssueDonutRows, rankedIssueRows]);

  const pieIssueRows = useMemo<RoseSliceRow[]>(() => {
    const visibleTotal = rankedIssueRows.reduce((total, item) => total + item.districtCount, 0);
    const otherTotal = Math.max(0, overviewIssueTotal - visibleTotal);
    const visibleRows: RoseSliceRow[] = rankedIssueRows.map((item) => ({ ...item, isOther: false }));
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

  const roseSlices = useMemo(() => {
    const sliceCount = pieIssueRows.length;
    if (sliceCount === 0) return [];
    const maxDistrictCount = Math.max(...pieIssueRows.map((item) => item.districtCount), 1);
    const angleStep = 360 / sliceCount;

    return pieIssueRows.map((item, index) => {
      const startAngle = -90 + index * angleStep;
      const endAngle = startAngle + angleStep;
      const midAngle = (startAngle + endAngle) / 2;
      const ratio = Math.sqrt(Math.max(item.districtCount, 0) / maxDistrictCount);
      const outerRadius = MIN_OUTER_RADIUS + (MAX_OUTER_RADIUS - MIN_OUTER_RADIUS) * ratio;
      const labelRadius = INNER_RADIUS + (outerRadius - INNER_RADIUS) * 0.56;
      const labelPos = polarToCartesian(CENTER_X, CENTER_Y, labelRadius, midAngle);
      const percentValue = overviewIssueTotal > 0 ? (item.districtCount / overviewIssueTotal) * 100 : 0;

      return {
        row: item,
        path: buildRoseArcPath(CENTER_X, CENTER_Y, INNER_RADIUS, outerRadius, startAngle, endAngle),
        labelX: labelPos.x,
        labelY: labelPos.y,
        labelText: formatSlicePercent(percentValue),
        labelFill: item.isOther ? "#0f172a" : "#ffffff",
      };
    });
  }, [overviewIssueTotal, pieIssueRows]);

  const isClearDisabled =
    !selectedOverviewMapIssue &&
    !selectedOverviewMapProvinceName &&
    !selectedOverviewMapDistrictName &&
    !searchTerm &&
    selectedGroup === "all" &&
    !isShowingOtherIssues;

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
          <p>กดชิ้นกราฟเพื่อดูรายละเอียด หรือกดค่าร้อยละตรงกลางเพื่อกลับสู่ภาพรวม</p>
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
            setIsShowingOtherIssues(false);
          }}
          disabled={isClearDisabled}
        >
          ล้างข้อมูล
        </button>
      </div>

      {overviewIssueDonutRows.length === 0 ? (
        <p className="province-issue-empty">ยังไม่มีข้อมูลประเด็นโรค/ภัยสุขภาพ</p>
      ) : (
        <div className="overview-issue-control-panel__body">
          <div className="overview-issue-donut-chart">
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="overview-rose-chart__svg"
              role="img"
              aria-label="กราฟสรุปภาพรวมประเด็นขับเคลื่อนงาน พชอ./พชข."
            >
              {roseSlices.map(({ row, path, labelX, labelY, labelText, labelFill }) => {
                const isSelected = row.isOther
                  ? isShowingOtherIssues
                  : selectedOverviewMapIssue === row.issue;
                const isHovered = hoveredSlice?.issue === row.issue && hoveredSlice?.group === row.group;
                const hasSelection = Boolean(selectedOverviewMapIssue) || isShowingOtherIssues;
                const isDimmed = hasSelection && !isSelected;
                return (
                  <g
                    key={`${row.issue}:${row.group}`}
                    style={{
                      cursor: "pointer",
                      opacity: isDimmed && !isHovered ? 0.45 : 1,
                      transition: "opacity 0.18s ease",
                    }}
                    onMouseEnter={() => setHoveredSlice(row)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => {
                      if (row.isOther) {
                        setSelectedOverviewMapIssue("");
                        setIsShowingOtherIssues((prev) => !prev);
                        return;
                      }
                      setIsShowingOtherIssues(false);
                      setSelectedOverviewMapIssue((current) => (current === row.issue ? "" : row.issue));
                    }}
                  >
                    <path
                      d={path}
                      fill={row.color}
                      stroke={isSelected ? "#0f172a" : "#ffffff"}
                      strokeWidth={isSelected ? 3 : 2.2}
                    />
                    {labelText && (
                      <text
                        x={labelX}
                        y={labelY}
                        fill={labelFill}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="overview-issue-donut-label"
                        style={row.isOther ? { stroke: "none" } : undefined}
                      >
                        {labelText}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {hoveredSlice && (
              <div className="overview-issue-donut-tooltip overview-rose-chart__tooltip">
                <strong>{hoveredSlice.issue}</strong>
                <span>
                  {hoveredSlice.districtCount.toLocaleString("th-TH")} อำเภอ-ประเด็น ·{" "}
                  {(overviewIssueTotal > 0 ? (hoveredSlice.districtCount / overviewIssueTotal) * 100 : 0).toLocaleString(
                    "th-TH",
                    { maximumFractionDigits: 1 }
                  )}
                  %
                </span>
              </div>
            )}

            <button
              type="button"
              className="overview-issue-donut-center"
              onClick={() => {
                setSelectedOverviewMapIssue("");
                setIsShowingOtherIssues(false);
              }}
              aria-label={`กลับสู่ภาพรวม ${Math.round(overviewMetricTotals.reportingIssuePercent).toLocaleString("th-TH")} เปอร์เซ็นต์ จาก ${overviewMetricTotals.reportingIssueCount.toLocaleString("th-TH")} ใน ${overviewMetricTotals.issueCount.toLocaleString("th-TH")} ประเด็น`}
              title="กลับสู่ภาพรวมทั้งหมด"
            >
              <strong>{Math.round(overviewMetricTotals.reportingIssuePercent).toLocaleString("th-TH")}%</strong>
              <span>{overviewMetricTotals.reportingIssueCount.toLocaleString("th-TH")} / {overviewMetricTotals.issueCount.toLocaleString("th-TH")} ประเด็น</span>
              <small>ภาพรวม พชอ./พชข.</small>
            </button>
          </div>

          <div className={styles.filters} aria-label="ค้นหาและกรองอันดับประเด็นโรคและภัยสุขภาพ">
            <label className={styles.filterLabel}>
              <span>ค้นหาประเด็นโรค/ภัยสุขภาพ</span>
              <input
                type="search"
                className={styles.searchInput}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="พิมพ์ชื่อประเด็นที่ต้องการค้นหา..."
              />
            </label>
            <label className={styles.filterLabel}>
              <span>กลุ่มรายการ</span>
              <select
                className={styles.groupSelect}
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
              >
                <option value="all">ทุกกลุ่มรายการ</option>
                {availableGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className={styles.limitNote}>
            {isShowingOtherIssues
              ? `กำลังแสดงประเด็นอื่นๆ / นอกเงื่อนไข (${otherIssueRows.length} ประเด็น)`
              : "แสดงสูงสุด 10 อันดับ เรียงตามจำนวนอำเภอจากมากไปน้อย"}
          </p>

          <div className="overview-issue-donut-detail" role="list" aria-label="รายการประเด็นตามสัดส่วน">
            {isShowingOtherIssues ? (
              otherIssueRows.length === 0 ? (
                <p className="province-issue-empty">ไม่มีประเด็นอื่นๆ เพิ่มเติม</p>
              ) : (
                <div className="overview-issue-donut-detail__group">
                  {otherIssueRows.map((item) => {
                    const isActive = selectedOverviewMapIssue === item.issue;
                    return (
                      <button
                        key={`${item.issue}:${item.group}`}
                        type="button"
                        className={`overview-issue-donut-detail__item${isActive ? " is-active" : ""}`}
                        onClick={() =>
                          setSelectedOverviewMapIssue((current) => (current === item.issue ? "" : item.issue))
                        }
                      >
                        <span
                          className="overview-issue-donut-detail__swatch"
                          style={{ background: item.color }}
                          aria-hidden="true"
                        />
                        <span className="overview-issue-donut-detail__name">{item.issue}</span>
                        <strong>{item.districtCount.toLocaleString("th-TH")} อำเภอ</strong>
                      </button>
                    );
                  })}
                </div>
              )
            ) : rankedIssueRows.length === 0 ? (
              <p className="province-issue-empty">ไม่พบประเด็นที่ตรงกับเงื่อนไขการค้นหา</p>
            ) : (
              <div className="overview-issue-donut-detail__group">
                {rankedIssueRows.map((item) => {
                  const isActive = selectedOverviewMapIssue === item.issue;
                  return (
                    <button
                      key={`${item.issue}:${item.group}`}
                      type="button"
                      className={`overview-issue-donut-detail__item${isActive ? " is-active" : ""}`}
                      onClick={() => setSelectedOverviewMapIssue((current) => (current === item.issue ? "" : item.issue))}
                    >
                      <span className="overview-issue-donut-detail__swatch" style={{ background: item.color }} aria-hidden="true" />
                      <span className="overview-issue-donut-detail__name">{item.issue}</span>
                      <strong>{item.districtCount.toLocaleString("th-TH")} อำเภอ</strong>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <OverviewIssueDrilldown model={model} />
        </div>
      )}
    </aside>
  );
}
