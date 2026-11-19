"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import { getAgencyDisplayLabel, withAgencyDisplayLabel } from "@/services/agency-display";
import { FISCAL_YEARS, isSupportedFiscalYear } from "@/services/fiscal-year";
import type {
  AgencyOption,
  District,
  HealthIssueOption,
  IntakeEvaluationStatus,
  IntakeRecordRow,
  Province,
} from "@/types/mvp";
import type { AccessScope } from "@/services/access-control";
import { HEALTH_ISSUE_GROUPS, getHealthIssueGroupLabel } from "@/types/mvp";
import styles from "./SavedRecordsPanel.module.css";

type SavedRecordDraft = {
  fiscalYear: number;
  agencyCode: string;
  provinceCode: string;
  districtCode: string;
  healthIssue: string;
  healthIssueId: string;
  healthIssueMembershipId: string;
  healthIssueGroup: string;
  evaluationStatus: IntakeEvaluationStatus | "";
};

type SavedRecordsPanelProps = {
  refreshKey: number;
  accessScope?: AccessScope;
};

const PAGE_SIZE = 10;

const evaluationStatusOptions: Array<{ value: IntakeEvaluationStatus; label: string }> = [
  { value: "pass", label: "ผ่าน" },
  { value: "fail", label: "ไม่ผ่าน" },
];

const evaluationStatusLabel = (status: IntakeEvaluationStatus | "" | null | undefined) => {
  return evaluationStatusOptions.find((option) => option.value === status)?.label ?? "-";
};

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
  const [healthIssueOptions, setHealthIssueOptions] = useState<HealthIssueOption[]>([]);
  const [isHealthIssueCatalogLoaded, setIsHealthIssueCatalogLoaded] = useState(false);

  const [filterAgency, setFilterAgency] = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterFiscalYear, setFilterFiscalYear] = useState("");
  const [filterHealthIssueGroup, setFilterHealthIssueGroup] = useState("all");
  const [filterHealthIssue, setFilterHealthIssue] = useState("");
  const [healthIssueSearchQuery, setHealthIssueSearchQuery] = useState("");

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
  const activeHealthIssueNames = useMemo(() => [...new Set(healthIssueOptions.map((issue) => issue.name_th))], [healthIssueOptions]);
  const availableHealthIssueGroups = useMemo(() => {
    const availableGroups = new Set(healthIssueOptions.map((issue) => issue.issue_group));
    return HEALTH_ISSUE_GROUPS.filter((option) => availableGroups.has(option.value));
  }, [healthIssueOptions]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHealthIssueSearchQuery(filterHealthIssue.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filterHealthIssue]);

  // Load filter options once
  useEffect(() => {
    const load = async () => {
      const [agencyRes, provinceRes, districtRes, mappingRes, healthIssueRes] = await Promise.all([
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("master_districts").select("code,name_th,province_code").order("name_th", { ascending: true }),
        supabase.from("agency_provinces").select("agency_code,province_code"),
        supabase
          .from("v_health_issue_catalog")
          .select("id,issue_id,membership_id,name_th,issue_group,is_active,is_ddc_approved,is_primary_issue,is_reporting_target,sort_order,created_at,updated_at")
          .eq("is_active", true)
          .eq("is_ddc_approved", true)
          .order("issue_group", { ascending: true })
          .order("sort_order", { ascending: true })
          .order("name_th", { ascending: true }),
      ]);
      setAgencies((agencyRes.data ?? []).map(withAgencyDisplayLabel));
      setProvinces(provinceRes.data ?? []);
      setDistricts(districtRes.data ?? []);
      setAgencyProvinceMap((mappingRes.data as { agency_code: string; province_code: string }[]) ?? []);
      setHealthIssueOptions((healthIssueRes.data as HealthIssueOption[] | null) ?? []);
      setIsHealthIssueCatalogLoaded(true);
    };
    void load();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [refreshKey, localRefresh, activeAgencyFilter, activeProvinceFilter, filterFiscalYear, filterHealthIssueGroup, healthIssueSearchQuery]);

  // Load records
  useEffect(() => {
    const loadRows = async () => {
      if (!isHealthIssueCatalogLoaded) return;

      setLoading(true);
      if (activeHealthIssueNames.length === 0) {
        setRows([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("intake_records")
        .select(
          "id,created_at,fiscal_year,health_issue_text,health_issue_id,health_issue_membership_id,health_issue_group,evaluation_status,agency_code,province_code,district_code,master_agencies(label_th),master_provinces(name_th),master_districts(name_th)"
        )
        .in("health_issue_text", activeHealthIssueNames)
        .order("created_at", { ascending: false })
        .range(from, to);

      let countQuery = supabase
        .from("intake_records")
        .select("*", { count: "exact", head: true })
        .in("health_issue_text", activeHealthIssueNames);

      if (activeAgencyFilter) {
        query = query.eq("agency_code", activeAgencyFilter);
        countQuery = countQuery.eq("agency_code", activeAgencyFilter);
      }
      if (activeProvinceFilter) {
        query = query.eq("province_code", activeProvinceFilter);
        countQuery = countQuery.eq("province_code", activeProvinceFilter);
      }
      if (filterFiscalYear) {
        query = query.eq("fiscal_year", Number(filterFiscalYear));
        countQuery = countQuery.eq("fiscal_year", Number(filterFiscalYear));
      }
      if (filterHealthIssueGroup === "legacy_unresolved") {
        query = query.is("health_issue_group", null);
        countQuery = countQuery.is("health_issue_group", null);
      } else if (filterHealthIssueGroup !== "all") {
        query = query.eq("health_issue_group", filterHealthIssueGroup);
        countQuery = countQuery.eq("health_issue_group", filterHealthIssueGroup);
      }
      if (healthIssueSearchQuery) {
        query = query.ilike("health_issue_text", `%${healthIssueSearchQuery}%`);
        countQuery = countQuery.ilike("health_issue_text", `%${healthIssueSearchQuery}%`);
      }

      const [{ data }, { count }] = await Promise.all([query, countQuery]);
      setRows((data as IntakeRecordRow[]) ?? []);
      setTotalCount(count ?? 0);
      setLoading(false);
    };
    void loadRows();
  }, [page, refreshKey, localRefresh, activeAgencyFilter, activeProvinceFilter, filterFiscalYear, filterHealthIssueGroup, healthIssueSearchQuery, activeHealthIssueNames, isHealthIssueCatalogLoaded]);

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
    if (filterFiscalYear) chips.push(`ปีงบประมาณ: ${filterFiscalYear}`);
    if (filterHealthIssueGroup === "legacy_unresolved") {
      chips.push("กลุ่ม: ข้อมูลเดิมที่ยังไม่ระบุกลุ่ม");
    } else if (filterHealthIssueGroup !== "all") {
      chips.push(`กลุ่ม: ${getHealthIssueGroupLabel(filterHealthIssueGroup)}`);
    }
    if (healthIssueSearchQuery) chips.push(`ประเด็น: ${healthIssueSearchQuery}`);
    return chips;
  }, [activeAgencyFilter, activeProvinceFilter, agencies, provinces, filterFiscalYear, filterHealthIssueGroup, healthIssueSearchQuery]);

  // Editing
  const beginEdit = (row: IntakeRecordRow) => {
    setRecordActionMessage("");
    setEditingRecordId(row.id);
    setEditDraft({
      fiscalYear: row.fiscal_year,
      agencyCode: row.agency_code,
      provinceCode: row.province_code,
      districtCode: row.district_code,
      healthIssue: row.health_issue_text ?? "",
      healthIssueId: row.health_issue_id ?? "",
      healthIssueMembershipId: row.health_issue_membership_id ?? "",
      healthIssueGroup: row.health_issue_group ?? "",
      evaluationStatus: row.evaluation_status ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingRecordId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editingRecordId || !editDraft) return;
    const selectedMembership = healthIssueOptions.find((issue) => issue.membership_id === editDraft.healthIssueMembershipId);
    if (!isSupportedFiscalYear(editDraft.fiscalYear) || !editDraft.agencyCode || !editDraft.provinceCode || !editDraft.districtCode || !selectedMembership) {
      setRecordActionMessage("กรอกข้อมูลให้ครบและเลือกกลุ่มของประเด็นก่อนบันทึกการแก้ไข");
      return;
    }

    setSavingRecordId(editingRecordId);
    setRecordActionMessage("");

    const { error } = await supabase
      .from("intake_records")
      .update({
        fiscal_year: editDraft.fiscalYear,
        agency_code: editDraft.agencyCode,
        province_code: editDraft.provinceCode,
        district_code: editDraft.districtCode,
        health_issue_text: selectedMembership.name_th,
        health_issue_id: selectedMembership.issue_id,
        health_issue_membership_id: selectedMembership.membership_id,
        health_issue_group: selectedMembership.issue_group,
        evaluation_status: editDraft.evaluationStatus || null,
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
    const headers = ["เวลา", "ปีงบประมาณ", "หน่วยงาน", "จังหวัด", "อำเภอ", "ประเด็นโรค/ภัยสุขภาพ", "กลุ่มรายการ", "ผลการคัดเกณฑ์"];
    const body = rows.map((row) => [
      new Date(row.created_at).toLocaleString("th-TH"),
      row.fiscal_year,
      getAgencyDisplayLabel(row.agency_code, getRelatedLabel(row.master_agencies, (a) => a.label_th)),
      getRelatedLabel(row.master_provinces, (p) => p.name_th) ?? row.province_code ?? "-",
      getRelatedLabel(row.master_districts, (d) => d.name_th) ?? row.district_code ?? "-",
      row.health_issue_text ?? "-",
      row.health_issue_group ? getHealthIssueGroupLabel(row.health_issue_group) : "ข้อมูลเดิมที่ยังไม่ระบุกลุ่ม",
      evaluationStatusLabel(row.evaluation_status),
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
      <div className={styles.filters}>
        <label>
          กรองปีงบประมาณ
          <select value={filterFiscalYear} onChange={(e) => setFilterFiscalYear(e.target.value)}>
            <option value="">ทั้งหมด</option>
            {FISCAL_YEARS.map((fiscalYear) => (
              <option key={fiscalYear} value={fiscalYear}>{fiscalYear}</option>
            ))}
          </select>
        </label>
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
        <label>
          กรองกลุ่มโรค/ภัยสุขภาพ
          <select value={filterHealthIssueGroup} onChange={(e) => setFilterHealthIssueGroup(e.target.value)}>
            <option value="all">ทั้งหมด</option>
            {availableHealthIssueGroups.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            <option value="legacy_unresolved">ข้อมูลเดิมที่ยังไม่ระบุกลุ่ม</option>
          </select>
        </label>
        <label>
          ค้นหาประเด็นโรค/ภัยสุขภาพ
          <input
            type="search"
            value={filterHealthIssue}
            onChange={(e) => setFilterHealthIssue(e.target.value)}
            placeholder="พิมพ์ชื่อประเด็น..."
          />
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
            <tr><th>เวลา</th><th>ปีงบประมาณ</th><th>หน่วยงาน</th><th>จังหวัด</th><th>อำเภอ</th><th>ประเด็นโรค/ภัยสุขภาพและกลุ่ม</th><th>ผลการคัดเกณฑ์</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8}>ยังไม่มีข้อมูล</td></tr>
            ) : (
              rows.map((row) => {
                const isEditing = editingRecordId === row.id && editDraft;
                return (
                  <tr key={row.id}>
                    <td>{new Date(row.created_at).toLocaleString("th-TH")}</td>
                    {isEditing ? (
                      <>
                        <td>
                          <select
                            className="table-input"
                            value={editDraft.fiscalYear}
                            onChange={(e) => setEditDraft({ ...editDraft, fiscalYear: Number(e.target.value) })}
                          >
                            {FISCAL_YEARS.map((fiscalYear) => (
                              <option key={fiscalYear} value={fiscalYear}>{fiscalYear}</option>
                            ))}
                          </select>
                        </td>
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
                          <select
                            className="table-input"
                            value={editDraft.healthIssueMembershipId}
                            onChange={(e) => {
                              const selected = healthIssueOptions.find((issue) => issue.membership_id === e.target.value);
                              setEditDraft({
                                ...editDraft,
                                healthIssue: selected?.name_th ?? "",
                                healthIssueId: selected?.issue_id ?? "",
                                healthIssueMembershipId: selected?.membership_id ?? "",
                                healthIssueGroup: selected?.issue_group ?? "",
                              });
                            }}
                          >
                            <option value="">เลือกประเด็นโรค/ภัยสุขภาพ</option>
                            {healthIssueOptions.map((issue) => (
                              <option key={issue.membership_id} value={issue.membership_id}>
                                {issue.name_th} — {getHealthIssueGroupLabel(issue.issue_group)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="table-input"
                            value={editDraft.evaluationStatus}
                            onChange={(e) => setEditDraft({ ...editDraft, evaluationStatus: e.target.value as IntakeEvaluationStatus | "" })}
                          >
                            <option value="">เลือกผล</option>
                            {evaluationStatusOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
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
                        <td>{row.fiscal_year}</td>
                        <td>{getAgencyDisplayLabel(row.agency_code, getRelatedLabel(row.master_agencies, (a) => a.label_th))}</td>
                        <td>{getRelatedLabel(row.master_provinces, (p) => p.name_th) ?? row.province_code ?? "-"}</td>
                        <td>{getRelatedLabel(row.master_districts, (d) => d.name_th) ?? row.district_code ?? "-"}</td>
                        <td>
                          {row.health_issue_text}
                          <small className="section-row__subtitle">
                            {row.health_issue_group ? getHealthIssueGroupLabel(row.health_issue_group) : "ข้อมูลเดิมที่ยังไม่ระบุกลุ่ม"}
                          </small>
                        </td>
                        <td>{evaluationStatusLabel(row.evaluation_status)}</td>
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
