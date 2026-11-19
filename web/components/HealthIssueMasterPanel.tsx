"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import type { HealthIssueGroup, HealthIssueOption } from "@/types/mvp";
import { HEALTH_ISSUE_GROUPS, getHealthIssueGroupLabel } from "@/types/mvp";

const PAGE_SIZE = 10;
type HealthIssueCatalogStatus = "approved" | "unapproved";
const normalizeIssueName = (value: string) => value.trim().replace(/\s+/g, " ");
const healthIssueGroupOptions = HEALTH_ISSUE_GROUPS;
const healthIssueGroupLabel = getHealthIssueGroupLabel;

export default function HealthIssueMasterPanel() {
  const [issues, setIssues] = useState<HealthIssueOption[]>([]);
  const [newIssueName, setNewIssueName] = useState("");
  const [newCatalogStatus, setNewCatalogStatus] = useState<HealthIssueCatalogStatus | "">("");
  const [newIssueGroup, setNewIssueGroup] = useState<HealthIssueGroup>("royal_initiative");
  const [filterGroup, setFilterGroup] = useState<HealthIssueGroup | "all">("all");
  const [catalogFilter, setCatalogFilter] = useState<"all" | "approved" | "unapproved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingGroup, setEditingGroup] = useState<HealthIssueGroup>("disease_health_risk");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeCount = useMemo(() => issues.filter((issue) => issue.is_active).length, [issues]);
  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchGroup = filterGroup === "all" || issue.issue_group === filterGroup;
      const matchCatalog = catalogFilter === "all"
        || (catalogFilter === "approved" ? issue.is_ddc_approved : !issue.is_ddc_approved);
      const matchSearch = !q || (issue.name_th || "").toLowerCase().includes(q);
      return matchGroup && matchCatalog && matchSearch;
    });
  }, [catalogFilter, filterGroup, searchQuery, issues]);
  const pageCount = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIdx = filteredIssues.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(filteredIssues.length, currentPage * PAGE_SIZE);
  const pagedIssues = filteredIssues.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [catalogFilter, filterGroup, searchQuery]);

  const loadIssues = async () => {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase
      .from("v_health_issue_catalog")
      .select("id,issue_id,membership_id,name_th,issue_group,is_active,is_ddc_approved,is_primary_issue,is_reporting_target,sort_order,created_at,updated_at")
      .order("is_active", { ascending: false })
      .order("issue_group", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("name_th", { ascending: true });

    setLoading(false);

    if (error) {
      setIssues([]);
      setMessage(`โหลดรายการไม่สำเร็จ: ${error.message}`);
      return;
    }

    setIssues((data as HealthIssueOption[]) ?? []);
  };

  useEffect(() => {
    void loadIssues();
  }, []);

  const addIssue = async () => {
    const name = normalizeIssueName(newIssueName);
    if (name.length < 3) {
      setMessage("กรอกชื่อประเด็นอย่างน้อย 3 ตัวอักษร");
      return;
    }

    if (!newCatalogStatus) {
      setMessage("เลือกสถานะบัญชีก่อนเพิ่มรายการ");
      return;
    }

    const duplicate = issues.find(
      (item) => item.issue_group === newIssueGroup && normalizeIssueName(item.name_th).toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setMessage(`ไม่สามารถเพิ่มชื่อ "${name}" ซ้ำในกลุ่ม "${healthIssueGroupLabel(newIssueGroup)}" ได้`);
      return;
    }

    setSaving(true);
    setMessage("");
    const isDdcApproved = newCatalogStatus === "approved";
    const existingIssue = issues.find(
      (item) => normalizeIssueName(item.name_th).toLowerCase() === name.toLowerCase()
    );
    let issueId = existingIssue?.issue_id ?? "";
    let error: { code?: string; message: string } | null = null;

    if (!issueId) {
      const result = await supabase
        .from("master_health_issues")
        .insert({
          name_th: name,
          issue_group: newIssueGroup,
          is_active: true,
          is_ddc_approved: isDdcApproved,
          is_primary_issue: false,
        })
        .select("id")
        .single();
      issueId = result.data?.id ?? "";
      error = result.error;
    }

    if (!error && issueId) {
      const result = await supabase.from("health_issue_group_memberships").insert({
        health_issue_id: issueId,
        issue_group: newIssueGroup,
        is_active: false,
        is_ddc_approved: isDdcApproved,
      });
      error = result.error;
    }
    setSaving(false);

    if (error) {
      if (error.code === "23505" || error.message.includes("unique")) {
        setMessage(`ไม่สามารถเพิ่มได้ เนื่องจากชื่อประเด็น "${name}" ซ้ำในกลุ่ม "${healthIssueGroupLabel(newIssueGroup)}"`);
      } else {
        setMessage(`เพิ่มรายการไม่สำเร็จ: ${error.message}`);
      }
      return;
    }

    setNewIssueName("");
    setNewCatalogStatus("");
    setNewIssueGroup("royal_initiative");
    setMessage(`เพิ่มรายการ${isDdcApproved ? "บัญชีกรมควบคุมโรค" : "นอกบัญชีกรมฯ"}แล้ว โดยตั้งเป็นปิดใช้งาน`);
    void loadIssues();
  };

  const beginEdit = (issue: HealthIssueOption) => {
    if (issue.is_ddc_approved) {
      setMessage("รายการมาตรฐานกรมควบคุมโรคแก้ไขชื่อหรือกลุ่มจากหน้านี้ไม่ได้");
      return;
    }

    setEditingId(issue.id);
    setEditingName(issue.name_th);
    setEditingGroup(issue.issue_group);
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingGroup("disease_health_risk");
  };

  const saveEdit = async (issue: HealthIssueOption) => {
    const name = normalizeIssueName(editingName);
    if (name.length < 3) {
      setMessage("กรอกชื่อประเด็นอย่างน้อย 3 ตัวอักษร");
      return;
    }

    const duplicate = issues.find(
      (item) => item.id !== issue.id && item.issue_group === editingGroup && normalizeIssueName(item.name_th).toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      setMessage(`ไม่สามารถบันทึกชื่อ "${name}" ซ้ำในกลุ่ม "${healthIssueGroupLabel(editingGroup)}" ได้`);
      return;
    }

    setSaving(true);
    setMessage("");
    const membershipsForIssue = issues.filter((item) => item.issue_id === issue.issue_id);
    const canRenameIssue = membershipsForIssue.every((item) => !item.is_ddc_approved);
    if (!canRenameIssue && name !== issue.name_th) {
      setSaving(false);
      setMessage("ชื่อนี้เชื่อมกับรายการมาตรฐานกรมควบคุมโรค จึงแก้ได้เฉพาะกลุ่มของรายการนอกบัญชีกรมฯ");
      return;
    }

    let error: { code?: string; message: string } | null = null;
    if (name !== issue.name_th) {
      const result = await supabase.from("master_health_issues").update({ name_th: name }).eq("id", issue.issue_id);
      error = result.error;
    }
    if (!error && editingGroup !== issue.issue_group) {
      const result = await supabase
        .from("health_issue_group_memberships")
        .update({ issue_group: editingGroup })
        .eq("id", issue.membership_id);
      error = result.error;
    }
    setSaving(false);

    if (error) {
      if (error.code === "23505" || error.message.includes("unique")) {
        setMessage(`ไม่สามารถบันทึกได้ เนื่องจากชื่อประเด็น "${name}" มีอยู่แล้วในระบบ`);
      } else {
        setMessage(`แก้ไขรายการไม่สำเร็จ: ${error.message}`);
      }
      return;
    }

    cancelEdit();
    setMessage("แก้ไขรายการเรียบร้อยแล้ว");
    void loadIssues();
  };

  const toggleActive = async (issue: HealthIssueOption) => {
    setSaving(true);
    setMessage("");
    const { error } = await supabase
      .from("health_issue_group_memberships")
      .update({ is_active: !issue.is_active })
      .eq("id", issue.membership_id);
    setSaving(false);

    if (error) {
      setMessage(`อัปเดตสถานะไม่สำเร็จ: ${error.message}`);
      return;
    }

    setMessage(issue.is_active ? "ปิดใช้งานรายการแล้ว" : "เปิดใช้งานรายการแล้ว");
    void loadIssues();
  };

  return (
    <article className="panel table-panel">
      <div className="section-row">
        <div></div>
        <div className="section-row__actions">
          <span className="filter-chip">ใช้งาน {activeCount.toLocaleString("th-TH")} รายการ</span>
          <span className="filter-chip">หน้า {currentPage.toLocaleString("th-TH")} / {pageCount.toLocaleString("th-TH")}</span>
        </div>
      </div>


      <div className="filter-row health-issue-master-form">
        <label>
          สถานะบัญชี
          <select value={newCatalogStatus} onChange={(event) => setNewCatalogStatus(event.target.value as HealthIssueCatalogStatus | "")}>
            <option value="">เลือกสถานะบัญชี</option>
            <option value="approved">บัญชีกรมควบคุมโรค</option>
            <option value="unapproved">นอกบัญชีกรมฯ</option>
          </select>
        </label>
        <label>
          กลุ่มรายการ
          <select value={newIssueGroup} onChange={(event) => setNewIssueGroup(event.target.value as HealthIssueGroup)}>
            {healthIssueGroupOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          เพิ่มรายการใหม่
          <input
            value={newIssueName}
            onChange={(event) => setNewIssueName(event.target.value)}
            placeholder="เช่น โรคไม่ติดต่อ (NCD)"
          />
        </label>
        <button type="button" className="cta cta--solid" onClick={addIssue} disabled={saving || !newCatalogStatus || newIssueName.trim().length < 3}>
          เพิ่มรายการ
        </button>
      </div>

      {message && <p className="inline-message">{message}</p>}
      {loading && <p>กำลังโหลดรายการ...</p>}

      <div className="health-issue-master-table-tools">
        <label>
          ดูตามกลุ่มรายการ
          <select value={filterGroup} onChange={(event) => setFilterGroup(event.target.value as HealthIssueGroup | "all")}>
            <option value="all">ทั้งหมด</option>
            {healthIssueGroupOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          ดูตามสถานะบัญชี
          <select value={catalogFilter} onChange={(event) => setCatalogFilter(event.target.value as "all" | "approved" | "unapproved")}>
            <option value="all">ทั้งหมด</option>
            <option value="approved">บัญชีกรมควบคุมโรค</option>
            <option value="unapproved">นอกบัญชีกรมฯ</option>
          </select>
        </label>
        <label>
          ค้นหาชื่อประเด็นโรค/ภัยสุขภาพ
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="พิมพ์คำค้นหาเพื่อค้นหาหรือแก้ไข..."
          />
        </label>
        {searchQuery && (
          <button
            type="button"
            className="cta cta--ghost health-issue-master-clear-btn"
            onClick={() => setSearchQuery("")}
            title="ล้างคำค้นหา"
          >
            ล้างคำค้นหา
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table className="health-issue-master-table">
          <thead>
            <tr><th>ลำดับ</th><th>กลุ่ม</th><th>ประเด็นโรค/ภัยสุขภาพ</th><th>สถานะบัญชี</th><th>การใช้งานข้อมูล</th><th>สถานะใช้งาน</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {filteredIssues.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  {searchQuery.trim()
                    ? `ไม่พบรายการประเด็นโรค/ภัยสุขภาพที่ตรงกับคำค้นหา "${searchQuery}"`
                    : "ยังไม่มีรายการประเด็นโรค/ภัยสุขภาพในกลุ่มนี้"}
                </td>
              </tr>
            ) : (
              pagedIssues.map((issue, index) => {
                const isEditing = editingId === issue.id;
                return (
                  <tr key={issue.id}>
                    <td>{(startIdx + index).toLocaleString("th-TH")}</td>
                    <td>
                      {isEditing ? (
                        <select className="table-input" value={editingGroup} onChange={(event) => setEditingGroup(event.target.value as HealthIssueGroup)}>
                          {healthIssueGroupOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        healthIssueGroupLabel(issue.issue_group)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className="table-input" value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                      ) : (
                        issue.name_th
                      )}
                    </td>
                    <td>{issue.is_ddc_approved ? "บัญชีกรมควบคุมโรค" : "นอกบัญชีกรมฯ"}</td>
                    <td>
                      {issue.is_reporting_target && !issue.is_primary_issue
                        ? "ชุดติดตาม 26 (ไม่นับเพิ่มใน 37)"
                        : issue.is_reporting_target
                          ? "ประเด็นหลัก / ชุดติดตาม 26"
                          : issue.is_primary_issue
                            ? "ประเด็นหลัก"
                            : "รายการทั่วไป"}
                    </td>
                    <td>{issue.is_active ? "ใช้งาน" : "ปิดใช้งาน"}</td>
                    <td>
                      <div className="record-actions">
                        {isEditing ? (
                          <>
                            <button type="button" className="cta cta--solid" onClick={() => void saveEdit(issue)} disabled={saving}>
                              บันทึก
                            </button>
                            <button type="button" className="cta cta--ghost" onClick={cancelEdit} disabled={saving}>
                              ยกเลิก
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="cta cta--ghost" onClick={() => beginEdit(issue)} disabled={saving || issue.is_ddc_approved}>
                              แก้ไข
                            </button>
                            <button type="button" className="cta cta--ghost" onClick={() => void toggleActive(issue)} disabled={saving}>
                              {issue.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-row" aria-label="เปลี่ยนหน้ารายการประเด็นโรคและภัยสุขภาพ">
        <button type="button" className="cta cta--ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={loading || currentPage <= 1}>
          หน้าก่อนหน้า
        </button>
        <span className="inline-message">
          แสดง {startIdx.toLocaleString("th-TH")}-{endIdx.toLocaleString("th-TH")} จาก {filteredIssues.length.toLocaleString("th-TH")} รายการ
        </span>
        <button type="button" className="cta cta--ghost" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={loading || currentPage >= pageCount}>
          หน้าถัดไป
        </button>
      </div>
    </article>
  );
}
