"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardModel } from "./DashboardSectionImpl";
import OverviewIssueDrilldown from "./OverviewIssueDrilldown";
import { donutPercentLabelFormatter } from "./dashboard-shared";

type OverviewIssueDonutPanelProps = {
  model: DashboardModel;
};

export default function OverviewIssueDonutPanel({ model }: OverviewIssueDonutPanelProps) {
  const {
    overviewIssueDonutRows,
    selectedOverviewMapDistrictName,
    selectedOverviewMapProvinceName,
    selectedOverviewMapIssue,
    setSelectedOverviewMapIssue,
    setSelectedOverviewMapProvinceCode,
    setSelectedOverviewMapDistrictCode,
  } = model;
  const overviewIssueTotal = overviewIssueDonutRows.reduce((total, item) => total + item.count, 0);

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
          }}
          disabled={!selectedOverviewMapIssue && !selectedOverviewMapProvinceName && !selectedOverviewMapDistrictName}
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
                  data={overviewIssueDonutRows}
                  dataKey="count"
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
                    const percent = overviewIssueTotal > 0 ? (item.count / overviewIssueTotal) * 100 : 0;
                    return (
                      <div className="overview-issue-donut-tooltip">
                        <strong>{item.issue}</strong>
                        <span>
                          {item.count.toLocaleString("th-TH")} ประเด็น · {percent.toLocaleString("th-TH", { maximumFractionDigits: 1 })}%
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

          <div className="overview-issue-donut-detail">
            {overviewIssueDonutRows.map((item) => {
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
