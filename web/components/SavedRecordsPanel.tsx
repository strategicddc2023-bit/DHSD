"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import type {
  AgencyOption,
  District,
  IntakeRecordRow,
  Province,
} from "@/types/mvp";
import type { AccessScope } from "@/services/access-control";

type SavedRecordDraft = {
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  healthIssue: string;
};

type SavedRecordsPanelProps = {
  refreshKey: number;
  accessScope?: AccessScope;
};

const PAGE_SIZE = 10;

const getRelatedLabel = <T,>(value: T | T[] | null | undefined, picker: (item: T) => string | null | undefined) => {
  const item = Array.isArray(value) ? value[0] : value;
  return item ? picker(item) : undefined;
};

export default function SavedRecordsPanel({ refreshKey, accessScope }: SavedRecordsPanelProps) {
  const [rows, setRows] = useState<IntakeRecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [agencyProvinceMap, setAgencyProvinceMap] = useState<{ agency_code: string; province_code: string }[]>([]);

  const [filterAgency, setFilterAgency] = useState("");
  const [filterProvince, setFilterProvince] = useState("");

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SavedRecordDraft | null>(null);
  const [recordActionMessage, setRecordActionMessage] = useState("");
  const [savingRecordId, setSavingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  const activeAgencyFilter = accessScope?.agencyCode ?? filterAgency;
  const activeProvinceFilter = accessScope?.provinceCode ?? filterProvince;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIdx = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(totalCount, page * PAGE_SIZE);

  // Load filter options once
  useEffect(() => {
    const load = async () => {
      const [agencyRes, provinceRes, districtRes, mappingRes] = await Promise.all([
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("master_districts").select("code,name_th,province_code").order("name_th", { ascending: true }),
        supabase.from("agency_provinces").select("agency_code,province_code"),
      ]);
      setAgencies(agencyRes.data ?? []);
      setProvinces(provinceRes.data ?? []);
      setDistricts(districtRes.data ?? []);
      setAgencyProvinceMap((mappingRes.data as { agency_code: string; province_code: string }[]) ?? []);
    };
    void load();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [refreshKey, localRefresh, activeAgencyFilter, activeProvinceFilter]);

  // Load records
  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("intake_records")
        .select(
          "id,created_at,health_issue_text,agency_code,province_code,district_code,master_agencies(label_th),master_provinces(name_th),master_districts(name_th)"
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      let countQuery = supabase.from("intake_records").select("*", { count: "exact", head: true });

      if (activeAgencyFilter) {
        query = query.eq("agency_code", activeAgencyFilter);
        countQuery = countQuery.eq("agency_code", activeAgencyFilter);
      }
      if (activeProvinceFilter) {
        query = query.eq("province_code", activeProvinceFilter);
        countQuery = countQuery.eq("province_code", activeProvinceFilter);
      }

      const [{ data }, { count }] = await Promise.all([query, countQuery]);
      setRows((data as IntakeRecordRow[]) ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    };
    void loadRows();
  }, [page, refreshKey, localRefresh, activeAgencyFilter, activeProvinceFilter]);

  // Visible filter options
  const visibleProvinces = useMemo(() => {
    if (!activeAgencyFilter) return provinces;
    const codes = new Set(agencyProvinceMap.filter((m) => m.agency_code === activeAgencyFilter).map((m) => m.province_code));
    return provinces.filter((p) => codes.has(p.code));
  }, [activeAgencyFilter, agencyProvinceMap, provinces]);

  const editProvinceOptions = useMemo(() => {
    if (!editDraft?.agencyCode) return [] as Province[];
    const codes = new Set(agencyProvinceMap.filter((m) => m.agency_code === editDraft.agencyCode).map((m) => m.province_code));
    return provinces.filter((p) => codes.has(p.code));
  }, [agencyProvinceMap, editDraft?.agencyCode, provinces]);

  const editDistrictOptions = useMemo(() => {
    if (!editDraft?.provinceCode) return [] as District[];
    return districts.filter((d) => d.province_code === editDraft.provinceCode);
  }, [districts, editDraft?.provinceCode]);

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: string[] = [];
    if (activeAgencyFilter) chips.push(agencies.find((a) => a.code === activeAgencyFilter)?.label_th ?? activeAgencyFilter);
    if (activeProvinceFilter) chips.push(provinces.find((p) => p.code === activeProvinceFilter)?.name_th ?? activeProvinceFilter);
    return chips;
  }, [activeAgencyFilter, activeProvinceFilter, agencies, provinces]);

  // Editing
  const beginEdit = (row: IntakeRecordRow) => {
    setRecordActionMessage("");
    setEditingRecordId(row.id);
    setEditDraft({
      agencyCode: row.agency_code,
      provinceCode: row.province_code,
      districtCode: row.district_code,
      healthIssue: row.health_issue_text ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
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
    cancelEdit();
    setLocalRefresh((c) => c + 1);
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
    if (editingRecordId === row.id) cancelEdit();
    setLocalRefresh((c) => c + 1);
  };

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = ["เวลา", "หน่วยงาน", "จังหวัด", "อำเภอ", "ประเด็นโรค/ภัยสุขภาพ"];
    const body = rows.map((row) => [
      new Date(row.created_at).toLocaleString("th-TH"),
      getRelatedLabel(row.master_agencies, (a) => a.label_th) ?? row.agency_code ?? "-",
      getRelatedLabel(row.master_provinces, (p) => p.name_th) ?? row.province_code ?? "-",
      getRelatedLabel(row.master_districts, (d) => d.name_th) ?? row.district_code ?? "-",
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

  return (
    <article className="panel table-panel">
      <div className="section-row">
        <div>
          <h3>รายการที่บันทึกสำเร็จ</h3>
          <p className="section-row__subtitle">
            แสดง {startIdx.toLocaleString("th-TH")}-{endIdx.toLocaleString("th-TH")} จาก {totalCount.toLocaleString("th-TH")} รายการ
          </p>
        </div>
        <div className="section-row__actions">
          <span className="filter-chip">หน้า {page.toLocaleString("th-TH")} / {pageCount.toLocaleString("th-TH")}</span>
        </div>
      </div>
      <div className="actions-row">
        <button type="button" className="cta cta--solid" onClick={exportCsv} disabled={rows.length === 0}>
          Export CSV
        </button>
      </div>
      <div className="filter-row">
        <label>
          กรองหน่วยงาน
          {accessScope?.agencyCode ? (
            <input value={agencies.find((a) => a.code === accessScope.agencyCode)?.label_th ?? accessScope.agencyCode} disabled />
          ) : (
            <select value={filterAgency} onChange={(e) => { setFilterAgency(e.target.value); setFilterProvince(""); }}>
              <option value="">ทั้งหมด</option>
              {agencies.map((a) => (<option key={a.code} value={a.code}>{a.label_th}</option>))}
            </select>
          )}
        </label>
        <label>
          กรองจังหวัด
          <select value={activeProvinceFilter} onChange={(e) => setFilterProvince(e.target.value)} disabled={Boolean(accessScope?.provinceCode)}>
            <option value="">ทั้งหมด</option>
            {visibleProvinces.map((p) => (<option key={p.code} value={p.code}>{p.name_th}</option>))}
          </select>
        </label>
      </div>

      {activeFilterChips.length > 0 && (
        <div className="filter-chips" aria-label="ตัวกรองที่ใช้งานอยู่">
          {activeFilterChips.map((chip) => (
            <span key={chip} className="filter-chip">{chip}</span>
          ))}
        </div>
      )}

      {recordActionMessage && <p className="inline-message">{recordActionMessage}</p>}
      {loading && <p>กำลังโหลดข้อมูล...</p>}
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
                            <input className="table-input" value={agencies.find((a) => a.code === accessScope.agencyCode)?.label_th ?? accessScope.agencyCode} disabled />
                          ) : (
                            <select
                              className="table-input"
                              value={editDraft.agencyCode}
                              onChange={(e) => setEditDraft({ ...editDraft, agencyCode: e.target.value, provinceCode: "", districtCode: "" })}
                            >
                              <option value="">เลือกหน่วยงาน</option>
                              {agencies.map((a) => (<option key={a.code} value={a.code}>{a.label_th}</option>))}
                            </select>
                          )}
                        </td>
                        <td>
                          <select
                            className="table-input"
                            value={editDraft.provinceCode}
                            onChange={(e) => setEditDraft({ ...editDraft, provinceCode: e.target.value, districtCode: "" })}
                            disabled={Boolean(accessScope?.provinceCode)}
                          >
                            <option value="">เลือกจังหวัด</option>
                            {editProvinceOptions.map((p) => (<option key={p.code} value={p.code}>{p.name_th}</option>))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="table-input"
                            value={editDraft.districtCode}
                            onChange={(e) => setEditDraft({ ...editDraft, districtCode: e.target.value })}
                          >
                            <option value="">เลือกอำเภอ</option>
                            {editDistrictOptions.map((d) => (<option key={d.code} value={d.code}>{d.name_th}</option>))}
                          </select>
                        </td>
                        <td>
                          <textarea
                            className="table-textarea"
                            value={editDraft.healthIssue}
                            onChange={(e) => setEditDraft({ ...editDraft, healthIssue: e.target.value })}
                            rows={3}
                            placeholder="ระบุประเด็นโรค/ภัยสุขภาพ"
                          />
                        </td>
                        <td>
                          <div className="record-actions">
                            <button type="button" className="cta cta--solid" onClick={saveEdit} disabled={savingRecordId === row.id}>
                              {savingRecordId === row.id ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                            <button type="button" className="cta cta--ghost" onClick={cancelEdit} disabled={savingRecordId === row.id}>
                              ยกเลิก
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{getRelatedLabel(row.master_agencies, (a) => a.label_th) ?? row.agency_code ?? "-"}</td>
                        <td>{getRelatedLabel(row.master_provinces, (p) => p.name_th) ?? row.province_code ?? "-"}</td>
                        <td>{getRelatedLabel(row.master_districts, (d) => d.name_th) ?? row.district_code ?? "-"}</td>
                        <td>{row.health_issue_text}</td>
                        <td>
                          <div className="record-actions">
                            <button type="button" className="cta cta--ghost" onClick={() => beginEdit(row)} disabled={Boolean(savingRecordId || deletingRecordId)}>
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
        <button type="button" className="cta cta--ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
          หน้าก่อนหน้า
        </button>
        <span className="inline-message">
          หน้า {page.toLocaleString("th-TH")} จาก {pageCount.toLocaleString("th-TH")}
        </span>
        <button type="button" className="cta cta--ghost" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={loading || page >= pageCount}>
          หน้าถัดไป
        </button>
      </div>
    </article>
  );
}
