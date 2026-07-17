"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import type { HealthIssueGroup, HealthIssueOption } from "@/types/mvp";

const PAGE_SIZE = 10;
const normalizeIssueName = (value: string) => value.trim().replace(/\s+/g, " ");

const healthIssueGroupOptions: Array<{ value: HealthIssueGroup; label: string }> = [
  { value: "disease_health_risk", label: "โรคและภัยสุขภาพ" },
  { value: "context_driver", label: "ประเด็นการขับเคลื่อนตามบริบท" },
];

const healthIssueGroupLabel = (group: HealthIssueGroup | string | null | undefined) => {
  return healthIssueGroupOptions.find((option) => option.value === group)?.label ?? "ไม่ระบุกลุ่ม";
};

export default function HealthIssueMasterPanel() {
  const [issues, setIssues] = useState<HealthIssueOption[]>([]);
  const [newIssueName, setNewIssueName] = useState("");
  const [newIssueGroup, setNewIssueGroup] = useState<HealthIssueGroup>("disease_health_risk");
  const [filterGroup, setFilterGroup] = useState<HealthIssueGroup | "all">("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingGroup, setEditingGroup] = useState<HealthIssueGroup>("disease_health_risk");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeCount = useMemo(() => issues.filter((issue) => issue.is_active).length, [issues]);
  const filteredIssues = useMemo(() => {
    if (filterGroup === "all") return issues;
    return issues.filter((issue) => issue.issue_group === filterGroup);
  }, [filterGroup, issues]);
  const pageCount = Math.max(1, Math.ceil(filteredIssues.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIdx = filteredIssues.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(filteredIssues.length, currentPage * PAGE_SIZE);
  const pagedIssues = filteredIssues.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filterGroup]);

  const loadIssues = async () => {
    setLoading(true);
    setMessage("");
    const { data, error } = await supabase
      .from("master_health_issues")
      .select("id,name_th,issue_group,is_active,sort_order,created_at,updated_at")
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

    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("master_health_issues").insert({ name_th: name, issue_group: newIssueGroup });
    setSaving(false);

    if (error) {
      setMessage(`เพิ่มรายการไม่สำเร็จ: ${error.message}`);
      return;
    }

    setNewIssueName("");
    setNewIssueGroup("disease_health_risk");
    setMessage("เพิ่มรายการประเด็นโรค/ภัยสุขภาพแล้ว");
    void loadIssues();
  };

  const beginEdit = (issue: HealthIssueOption) => {
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

    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("master_health_issues").update({ name_th: name, issue_group: editingGroup }).eq("id", issue.id);
    setSaving(false);

    if (error) {
      setMessage(`แก้ไขรายการไม่สำเร็จ: ${error.message}`);
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
      .from("master_health_issues")
      .update({ is_active: !issue.is_active })
      .eq("id", issue.id);
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
        <button type="button" className="cta cta--solid" onClick={addIssue} disabled={saving || newIssueName.trim().length < 3}>
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
      </div>

      <div className="table-wrap">
        <table className="health-issue-master-table">
          <thead>
            <tr><th>ลำดับ</th><th>กลุ่ม</th><th>ประเด็นโรค/ภัยสุขภาพ</th><th>สถานะ</th><th>จัดการ</th></tr>
          </thead>
          <tbody>
            {filteredIssues.length === 0 ? (
              <tr><td colSpan={5}>ยังไม่มีรายการประเด็นโรค/ภัยสุขภาพในกลุ่มนี้</td></tr>
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
                            <button type="button" className="cta cta--ghost" onClick={() => beginEdit(issue)} disabled={saving}>
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