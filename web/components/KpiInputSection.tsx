"use client";

import { useEffect, useMemo, useState } from "react";
import type { AccessScope } from "@/services/access-control";
import { supabase } from "@/services/supabase-client";
import { buildKpiPreview, validateKpiDraft } from "@/services/kpi-calculations";
import type { AgencyOption } from "@/types/mvp";

type KpiInputSectionProps = {
  agencies: AgencyOption[];
  onSaved?: () => void;
  accessScope?: AccessScope;
};

type KpiForm = {
  agencyCode: string;
  fiscalYear: number;
  totalIssueCount: string;
  analyzedDistrictCount: string;
  pchoActionDistrictCount: string;
  evidenceIssueCount: string;
};

const initialForm: KpiForm = {
  agencyCode: "",
  fiscalYear: 2569,
  totalIssueCount: "",
  analyzedDistrictCount: "",
  pchoActionDistrictCount: "",
  evidenceIssueCount: "",
};

export default function KpiInputSection({ agencies, onSaved, accessScope }: KpiInputSectionProps) {
  const [form, setForm] = useState<KpiForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const visibleAgencies = useMemo(() => {
    if (accessScope?.agencyCode) {
      return agencies.filter((agency) => agency.code === accessScope.agencyCode);
    }

    return agencies;
  }, [agencies, accessScope?.agencyCode]);

  const lockedAgency = accessScope?.agencyCode ?? "";

  useEffect(() => {
    if (lockedAgency && form.agencyCode !== lockedAgency) {
      setForm((prev) => ({ ...prev, agencyCode: lockedAgency }));
    }
  }, [form.agencyCode, lockedAgency]);

  const hasRequiredFields =
    Boolean(form.agencyCode) &&
    form.totalIssueCount !== "" &&
    form.analyzedDistrictCount !== "" &&
    form.pchoActionDistrictCount !== "" &&
    form.evidenceIssueCount !== "";
  const hasAnyKpiInput =
    form.totalIssueCount !== "" ||
    form.analyzedDistrictCount !== "" ||
    form.pchoActionDistrictCount !== "" ||
    form.evidenceIssueCount !== "";

  const validation = useMemo(() => validateKpiDraft(form), [form]);
  const canSubmit = hasRequiredFields && validation.ok;

  const previewRows = useMemo(() => {
    if (!validation.ok) {
      return [];
    }

    return buildKpiPreview(validation.values);
  }, [validation]);

  const handleSave = async () => {
    if (!hasRequiredFields) {
      setMessage("กรอกข้อมูล KPI ให้ครบก่อนบันทึก");
      return;
    }

    if (!validation.ok) {
      setMessage(validation.message);
      return;
    }

    const { totalIssueCount, analyzedDistrictCount, pchoActionDistrictCount, evidenceIssueCount } = validation.values;

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("kpi_inputs").upsert(
      {
        agency_code: form.agencyCode,
        fiscal_year: form.fiscalYear,
        total_issue_count: totalIssueCount,
        analyzed_district_count: analyzedDistrictCount,
        pcho_action_district_count: pchoActionDistrictCount,
        evidence_issue_count: evidenceIssueCount,
      },
      { onConflict: "agency_code,fiscal_year" }
    );

    setSaving(false);

    if (error) {
      setMessage(`บันทึก KPI ไม่สำเร็จ: ${error.message}`);
      return;
    }

    setMessage("บันทึก KPI สำเร็จแล้ว ระบบคำนวณผลอัตโนมัติ");
    onSaved?.();
  };

  return (
    <section className="section" id="kpi-input-section">
      <div className="section__header">
        <h2>KPI Input (Phase 4)</h2>
        <p>กรอกข้อมูลตั้งต้นเพื่อให้ระบบคำนวณ KPI1-KPI3 และคะแนนอัตโนมัติ</p>
      </div>

      <form className="intake-grid" onSubmit={(e) => e.preventDefault()}>
        <label>
          หน่วยงาน
          <select
            value={form.agencyCode}
            onChange={(e) => setForm((prev) => ({ ...prev, agencyCode: e.target.value }))}
            disabled={Boolean(lockedAgency)}
          >
            <option value="">เลือกหน่วยงาน</option>
            {visibleAgencies.map((agency) => (
              <option key={agency.code} value={agency.code}>
                {agency.label_th}
              </option>
            ))}
          </select>
        </label>

        <label>
          ปีงบประมาณ
          <select
            value={form.fiscalYear}
            onChange={(e) => setForm((prev) => ({ ...prev, fiscalYear: Number(e.target.value) }))}
          >
            {[2566, 2567, 2568, 2569, 2570].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          จำนวนประเด็นโรคทั้งหมด
          <input
            type="number"
            min={0}
            step={1}
            value={form.totalIssueCount}
            onChange={(e) => setForm((prev) => ({ ...prev, totalIssueCount: e.target.value }))}
          />
        </label>

        <label>
          จำนวนอำเภอที่มีผลวิเคราะห์
          <input
            type="number"
            min={0}
            step={1}
            value={form.analyzedDistrictCount}
            onChange={(e) => setForm((prev) => ({ ...prev, analyzedDistrictCount: e.target.value }))}
          />
        </label>

        <label>
          จำนวนอำเภอที่ดำเนินงานผ่าน พชอ.
          <input
            type="number"
            min={0}
            step={1}
            value={form.pchoActionDistrictCount}
            onChange={(e) => setForm((prev) => ({ ...prev, pchoActionDistrictCount: e.target.value }))}
          />
        </label>

        <label>
          จำนวนประเด็นที่มีผลลัพธ์เชิงประจักษ์
          <input
            type="number"
            min={0}
            step={1}
            value={form.evidenceIssueCount}
            onChange={(e) => setForm((prev) => ({ ...prev, evidenceIssueCount: e.target.value }))}
          />
        </label>
      </form>

      <div className="kpi-preview">
        <h3>Preview ผลคำนวณ KPI</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>KPI</th>
                <th>ตัวตั้ง</th>
                <th>ตัวหาร</th>
                <th>ร้อยละ</th>
                <th>คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.length === 0 ? (
                <tr>
                  <td colSpan={5}>กรอกข้อมูล KPI เพื่อดูผลคำนวณตัวอย่างก่อนบันทึก</td>
                </tr>
              ) : (
                previewRows.map((row) => (
                  <tr key={row.kpiCode}>
                    <td>{row.kpiLabel}</td>
                    <td>{row.numerator.toLocaleString("th-TH")}</td>
                    <td>{row.denominator.toLocaleString("th-TH")}</td>
                    <td>{row.percentValue.toFixed(2)}</td>
                    <td>{row.scoreValue.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasAnyKpiInput && !validation.ok ? <p className="warning-message">{validation.message}</p> : null}

      <div className="actions-row">
        <button type="button" className="cta cta--solid" onClick={handleSave} disabled={saving || !canSubmit}>
          {saving ? "กำลังบันทึก..." : "บันทึก KPI"}
        </button>
        {message ? <p className="inline-message">{message}</p> : null}
      </div>
    </section>
  );
}
