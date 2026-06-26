"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeAgencyCode, type AccessScope } from "@/services/access-control";
import { supabase } from "@/services/supabase-client";
import type { AgencyOption, District, IntakeFormData, Province } from "@/types/mvp";

type IntakeFormSectionProps = {
  formData: IntakeFormData;
  onChange: (next: IntakeFormData) => void;
  onSaved?: () => void;
  accessScope?: AccessScope;
};

type AgencyProvinceRow = {
  agency_code: string;
  province_code: string;
};

export default function IntakeFormSection({ formData, onChange, onSaved, accessScope }: IntakeFormSectionProps) {
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [agencyProvinceMap, setAgencyProvinceMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const visibleAgencies = useMemo(() => {
    if (accessScope?.agencyCode) {
      return agencies.filter((agency) => agency.code === accessScope.agencyCode);
    }

    return agencies;
  }, [agencies, accessScope?.agencyCode]);

  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(true);
      setMessage("");

      const [agencyRes, provinceRes, mappingRes] = await Promise.all([
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("agency_provinces").select("agency_code,province_code"),
      ]);

      if (agencyRes.error || provinceRes.error || mappingRes.error) {
        const errorMessage = mappingRes.error?.message ?? agencyRes.error?.message ?? provinceRes.error?.message;
        setMessage(`โหลดข้อมูลตั้งต้นไม่สำเร็จ: ${errorMessage ?? "กรุณาตรวจสอบการเชื่อมต่อ Supabase"}`);
      }

      setAgencies(agencyRes.data ?? []);
      setProvinces(provinceRes.data ?? []);

      const map: Record<string, string[]> = {};
      ((mappingRes.data as AgencyProvinceRow[] | null) ?? []).forEach((row) => {
        if (!map[row.agency_code]) {
          map[row.agency_code] = [];
        }
        map[row.agency_code].push(row.province_code);
      });
      setAgencyProvinceMap(map);

      setLoading(false);
    };

    void loadMasterData();
  }, []);

  useEffect(() => {
    const normalizedAgencyCode = normalizeAgencyCode(accessScope?.agencyCode ?? formData.agencyCode);
    if (!normalizedAgencyCode || agencies.length === 0) {
      return;
    }

    const agencyExists = agencies.some(
      (agency) => agency.code === normalizedAgencyCode || agency.label_th === formData.agencyCode
    );
    if (!agencyExists || formData.agencyCode === normalizedAgencyCode) {
      return;
    }

    onChange({
      ...formData,
      agencyCode: normalizedAgencyCode,
      provinceCode: "",
      districtCode: "",
    });
  }, [accessScope?.agencyCode, agencies, formData, onChange]);

  const filteredProvinces = useMemo(() => {
    if (!formData.agencyCode) {
      return [] as Province[];
    }

    const allowed = new Set(agencyProvinceMap[formData.agencyCode] ?? []);
    return provinces.filter((province) => allowed.has(province.code));
  }, [formData.agencyCode, provinces, agencyProvinceMap]);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!formData.provinceCode) {
        setDistricts([]);
        return;
      }

      const { data, error } = await supabase
        .from("master_districts")
        .select("code,name_th,province_code")
        .eq("province_code", formData.provinceCode)
        .order("name_th", { ascending: true });

      if (error) {
        setMessage("โหลดอำเภอไม่สำเร็จ");
        setDistricts([]);
        return;
      }

      setDistricts(data ?? []);
    };

    void loadDistricts();
  }, [formData.provinceCode]);

  const canSubmit = useMemo(() => {
    return Boolean(formData.agencyCode && formData.provinceCode && formData.districtCode && formData.healthIssue.trim().length >= 3);
  }, [formData]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setMessage("กรอกข้อมูลให้ครบก่อนบันทึก");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("intake_records").insert({
      agency_code: formData.agencyCode,
      province_code: formData.provinceCode,
      district_code: formData.districtCode,
      health_issue_text: formData.healthIssue.trim(),
    });

    setSaving(false);

    if (error) {
      setMessage(`บันทึกไม่สำเร็จ: ${error.message}`);
      return;
    }

    setMessage("บันทึกข้อมูลสำเร็จแล้ว");
    onChange({ ...formData, healthIssue: "" });
    onSaved?.();
  };

  const hasMapping = !formData.agencyCode || filteredProvinces.length > 0;

  return (
    <section className="section" id="input-section">
      <div className="section__header">
        <h2>MVP Input (เชื่อม Supabase แล้ว)</h2>
        <p>เมื่อเลือกหน่วยงาน ระบบจะแสดงเฉพาะจังหวัดตามเขตสุขภาพที่ map ไว้</p>
      </div>

      {accessScope?.agencyCode ? (
        <p className="inline-message">โหมดสิทธิ์ปัจจุบัน: บันทึกข้อมูลได้เฉพาะ {accessScope.agencyCode}</p>
      ) : null}

      {!hasMapping ? <p className="warning-message">หน่วยงานนี้ยังไม่มีจังหวัดที่ผูกไว้ในตาราง agency_provinces</p> : null}

      <form className="intake-grid" onSubmit={(event) => event.preventDefault()}>
        <label>
          หน่วยงาน (สคร.1-สคร.13)
          <select
            value={formData.agencyCode}
            disabled={loading || Boolean(accessScope?.agencyCode)}
            onChange={(event) =>
              onChange({
                ...formData,
                agencyCode: event.target.value,
                provinceCode: "",
                districtCode: "",
              })
            }
          >
            <option value="">เลือกหน่วยงาน</option>
            {visibleAgencies.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label_th}
              </option>
            ))}
          </select>
        </label>

        <label>
          จังหวัด
          <select
            value={formData.provinceCode}
            onChange={(event) =>
              onChange({ ...formData, provinceCode: event.target.value, districtCode: "" })
            }
            disabled={!formData.agencyCode || loading || !hasMapping}
          >
            <option value="">เลือกจังหวัด</option>
            {filteredProvinces.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name_th}
              </option>
            ))}
          </select>
        </label>

        <label>
          อำเภอ
          <select
            value={formData.districtCode}
            onChange={(event) => onChange({ ...formData, districtCode: event.target.value })}
            disabled={!formData.provinceCode || loading}
          >
            <option value="">เลือกอำเภอ</option>
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name_th}
              </option>
            ))}
          </select>
        </label>

        <label className="full-width">
          ประเด็นโรค/ภัยสุขภาพ
          <textarea
            value={formData.healthIssue}
            onChange={(event) => onChange({ ...formData, healthIssue: event.target.value })}
            rows={4}
            placeholder="ระบุประเด็นโรคหรือภัยสุขภาพ"
          />
        </label>
      </form>

      <div className="actions-row">
        <button type="button" className="cta cta--solid" onClick={handleSubmit} disabled={saving || !canSubmit}>
          {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
        </button>
        {message && <p className="inline-message">{message}</p>}
      </div>
    </section>
  );
}
