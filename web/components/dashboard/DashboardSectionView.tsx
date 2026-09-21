"use client";
import { Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DashboardAgencySelector from "@/components/DashboardAgencySelector";
import HealthIssueDistributionMap from "@/components/HealthIssueDistributionMap";
import InteractiveHealthMap from "@/components/InteractiveHealthMap";
import SuperadminUsersPanel from "@/components/SuperadminUsersPanel";
import { overallRiskLabel, overallRiskTone } from "@/services/dashboard-analytics";
import { readinessLabel, readinessTone } from "@/services/qa-readiness";
import { donutPercentLabelFormatter, evaluationStatusTooltipFormatter, recordCountLabelFormatter, recordCountTooltipFormatter } from "./dashboard-shared";
import DashboardSavedRecordsPanel from "./DashboardSavedRecordsPanel";
import type { DashboardModel } from "./DashboardSectionImpl";
type DashboardSectionViewProps = { model: DashboardModel };
export default function DashboardSectionView({ model }: DashboardSectionViewProps) {
  const { formData, accessScope, hideSavedRecords, onSelectDistrictForIntake, mapRef, rows, totalCount, agencies, provinces, agencyProvinceMap, agencyCoverage, provinceCoverage, kpiSummaryRows, previousKpiSummaryRows, selectedFiscalYear, setSelectedFiscalYear, filterAgency, setFilterAgency, filterProvince, setFilterProvince, selectedDistrictCode, setSelectedDistrictCode, selectedSubdistrictCode, selectedDistrictName, districtHealthIssueData, districtHealthIssueTotal, districtHealthIssueLoading, dashboardInsightTab, selectedHealthIssue, setSelectedHealthIssue, selectedOverviewIssue, setSelectedOverviewIssue, selectedOverviewMapIssue, setSelectedOverviewMapIssue, selectedOverviewMapProvinceCode, setSelectedOverviewMapProvinceCode, selectedOverviewMapDistrictCode, setSelectedOverviewMapDistrictCode, issueDetailScope, setIssueDetailScope, overviewFilter, setOverviewFilter, activeAgencyFilter, activeProvinceFilter, visibleAgencies, visibleProvinces, visibleAgencyCoverage, visibleProvinceCoverage, showAdvancedPanels, dashboardMenuAgencies, provinceSubmissionGroups, selectedIssueProvinceCode, selectedAgencyAreaTotals, coverageChartRows, selectedIssueProvinceName, isDistrictMode, healthIssueDonutScopeLabel, healthIssueDonutData, healthIssueDonutTotal, overviewIssueDonutRows, healthIssueGroupRows, healthIssueGroupTotal, healthIssueEvaluationRows, healthIssueEvaluationChartHeight, selectedOverviewIssueRecords, selectedOverviewIssueAgencyRows, selectedOverviewIssueProvinceRows, selectedOverviewIssueDistrictRows, issueDetailScopeOptions, activeIssueDetailScope, overviewIssueColorMap, selectedOverviewIssueColor, activeOverviewMapIssueColor, overviewMapRecords, overviewMetricTotals, selectedOverviewMapProvinceName, selectedOverviewMapDistrictRows, selectedOverviewMapDistrictName, selectedOverviewIssueChartHeight, selectedHealthIssueCount, selectedHealthIssueRecords, overviewFilterOptions, overviewChartRows, isOverviewMode, coverageChartTitle, selectedProvinceIssueRecords, handleOverviewChartBarClick, clearMapFilters, clearTableFilters, selectDashboardOverview, selectDashboardAgency, selectDashboardInsight, exportKpiSummaryCsv, kpiStatusRows, kpiAlerts, kpiStatusCounts, overallRiskLevel, readinessChecks } = model;
  const savedRecordsPanel = <DashboardSavedRecordsPanel model={model} />;
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
                  <strong>{overviewMetricTotals.provinceCount.toLocaleString("th-TH")}</strong>
                </article>
                <article>
                  <span>อำเภอทั้งหมด</span>
                  <strong>{overviewMetricTotals.districtCount.toLocaleString("th-TH")}</strong>
                </article>
                <article>
                  <span>ภาพรวมประเด็นการขับเคลื่อนงาน พชอ/พชข(ประเด็น)</span>
                  <strong>{overviewMetricTotals.issueCount.toLocaleString("th-TH")}</strong>
                </article>
                <article>
                  <span>ภาพรวมการรายงานของอำเภอ</span>
                  <span>(ร้อยละ)</span>
                  <strong>{overviewMetricTotals.submittedPercent.toLocaleString("th-TH", { maximumFractionDigits: 2 })}%</strong>
                  <p>ส่ง {overviewMetricTotals.submittedDistrictCount.toLocaleString("th-TH")} อำเภอ</p>
                </article>
              </div>

              {dashboardInsightTab === "assessment" ? (
                  <div className="dashboard-overview__content dashboard-overview__content--distribution">
                    <div className="overview-distribution-grid dashboard-overview__chart--full">
                      <article className="panel issue-detail-map-panel overview-distribution-map-panel">
                        <div className="dashboard-overview__section-head">
                          <div>
                            <h3>{selectedOverviewMapIssue ? `แผนที่การกระจาย ${selectedOverviewMapIssue}` : "ประเด็นการขับเคลื่อนงาน พชอ."}</h3>
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
                            <h3>สรุปภาพรวมประเด็นขับเคลื่อนงาน พชอ. ด้านป้องกันควบคุมโรคและภัยสุขภาพ{selectedOverviewMapDistrictName ? ` อำเภอ${selectedOverviewMapDistrictName}` : selectedOverviewMapProvinceName ? ` จังหวัด${selectedOverviewMapProvinceName}` : ""}</h3>
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
                                  <strong>{item.districtCount.toLocaleString("th-TH")} อำเภอ</strong>
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
