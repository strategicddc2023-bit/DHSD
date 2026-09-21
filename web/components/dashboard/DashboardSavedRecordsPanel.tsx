"use client";

import { getRelatedLabel } from "./dashboard-shared";
import type { DashboardModel } from "./DashboardSectionImpl";

type DashboardSavedRecordsPanelProps = { model: DashboardModel };

export default function DashboardSavedRecordsPanel({ model }: DashboardSavedRecordsPanelProps) {
  const { accessScope, rows, loading, totalCount, agencies, filterAgency, setFilterAgency, setFilterProvince, setSelectedDistrictCode, setSelectedSubdistrictCode, latestRecordsPage, setLatestRecordsPage, editingRecordId, editDraft, setEditDraft, recordActionMessage, savingRecordId, deletingRecordId, activeProvinceFilter, canViewSavedRecords, visibleAgencies, visibleProvinces, editProvinceOptions, editDistrictOptions, latestRecordsPageCount, latestRecordsStart, latestRecordsEnd, activeFilterChips, beginEditRecord, cancelEditRecord, updateEditDraft, saveEditedRecord, deleteRecord, exportLatestRowsCsv } = model;
  return canViewSavedRecords ? (
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
            <select value={filterAgency} onChange={(event) => {
              setFilterAgency(event.target.value);
              setFilterProvince("");
              setSelectedDistrictCode("");
              setSelectedSubdistrictCode("");
            }}>
              <option value="">ทั้งหมด</option>
              {visibleAgencies.map((agency) => (<option key={agency.code} value={agency.code}>{agency.label_th}</option>))}
            </select>
          )}
        </label>

        <label>
          กรองจังหวัด
          <select value={activeProvinceFilter} onChange={(event) => {
            setFilterProvince(event.target.value);
            setSelectedDistrictCode("");
            setSelectedSubdistrictCode("");
          }} disabled={Boolean(accessScope?.provinceCode)}>
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
                            onChange={(event) =>
                              setEditDraft({
                                ...editDraft,
                                districtCode: event.target.value,
                              })
                            }
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
                            placeholder="ระบุประเด็นโรค/ภัยสุขภาพ"
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
}
