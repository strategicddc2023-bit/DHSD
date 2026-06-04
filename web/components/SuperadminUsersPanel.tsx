"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import type { AccessScope } from "@/services/access-control";
import type { AgencyOption, AppRole, AppUserRow, AppUserStatus, District, Province } from "@/types/mvp";

type SuperadminUsersPanelProps = {
  accessScope?: AccessScope;
};

type AppUserDraft = {
  auth_user_id: string;
  thai_d_sub: string;
  role: AppRole;
  status: AppUserStatus;
  agency_code: string;
  province_code: string;
  district_code: string;
};

const initialDraft: AppUserDraft = {
  auth_user_id: "",
  thai_d_sub: "",
  role: "user",
  status: "pending",
  agency_code: "",
  province_code: "",
  district_code: "",
};

export default function SuperadminUsersPanel({ accessScope }: SuperadminUsersPanelProps) {
  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [draft, setDraft] = useState<AppUserDraft>(initialDraft);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const isSuperadmin = accessScope?.role === "superadmin";
  const filteredDistricts = useMemo(
    () => districts.filter((district) => !draft.province_code || district.province_code === draft.province_code),
    [draft.province_code, districts]
  );

  useEffect(() => {
    const loadPanelData = async () => {
      if (!isSuperadmin) return;

      setLoading(true);
      const [usersRes, agencyRes, provinceRes, districtRes] = await Promise.all([
        supabase
          .from("app_users")
          .select("id,auth_user_id,thai_d_sub,role,agency_code,province_code,district_code,status,last_login_at")
          .order("created_at", { ascending: false }),
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("master_districts").select("code,name_th,province_code").order("name_th", { ascending: true }),
      ]);

      setUsers((usersRes.data as AppUserRow[] | null) ?? []);
      setAgencies(agencyRes.data ?? []);
      setProvinces(provinceRes.data ?? []);
      setDistricts((districtRes.data as District[] | null) ?? []);
      setLoading(false);
    };

    void loadPanelData();
  }, [isSuperadmin]);

  const reloadUsers = async () => {
    const { data } = await supabase
      .from("app_users")
      .select("id,auth_user_id,thai_d_sub,role,agency_code,province_code,district_code,status,last_login_at")
      .order("created_at", { ascending: false });
    setUsers((data as AppUserRow[] | null) ?? []);
  };

  const handleSave = async () => {
    if (!isSuperadmin) return;
    if (!draft.thai_d_sub.trim()) {
      setMessage("กรอก ThaiD sub ก่อนบันทึก");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      auth_user_id: draft.auth_user_id.trim() || null,
      thai_d_sub: draft.thai_d_sub.trim(),
      role: draft.role,
      status: draft.status,
      agency_code: draft.agency_code || null,
      province_code: draft.province_code || null,
      district_code: draft.district_code || null,
    };

    const { error } = await supabase.from("app_users").upsert(payload, { onConflict: "thai_d_sub" });

    setSaving(false);

    if (error) {
      setMessage(`บันทึกไม่สำเร็จ: ${error.message}`);
      return;
    }

    setMessage("บันทึก app user สำเร็จแล้ว");
    setDraft(initialDraft);
    await reloadUsers();
  };

  const quickUpdate = async (id: string, patch: Partial<AppUserRow>) => {
    const { error } = await supabase.from("app_users").update(patch).eq("id", id);
    if (error) {
      setMessage(`อัปเดตไม่สำเร็จ: ${error.message}`);
      return;
    }

    setMessage("อัปเดตสิทธิ์เรียบร้อย");
    await reloadUsers();
  };

  if (!isSuperadmin) {
    return null;
  }

  return (
    <article className="panel table-panel">
      <div className="section-row">
        <div>
          <h3>Superadmin Access Manager</h3>
          <p className="section-row__subtitle">จัดการ allowlist, role และสถานะผู้ใช้สำหรับ phase 8</p>
        </div>
        <span className="filter-chip">app_users: {users.length.toLocaleString("th-TH")}</span>
      </div>

      <div className="intake-grid">
        <label>
          ThaiD sub
          <input value={draft.thai_d_sub} onChange={(e) => setDraft((prev) => ({ ...prev, thai_d_sub: e.target.value }))} placeholder="THAID-..." />
        </label>
        <label>
          Auth user id
          <input value={draft.auth_user_id} onChange={(e) => setDraft((prev) => ({ ...prev, auth_user_id: e.target.value }))} placeholder="uuid ของ auth.users" />
        </label>
        <label>
          Role
          <select value={draft.role} onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value as AppRole }))}>
            <option value="superadmin">superadmin</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
        </label>
        <label>
          Status
          <select value={draft.status} onChange={(e) => setDraft((prev) => ({ ...prev, status: e.target.value as AppUserStatus }))}>
            <option value="pending">pending</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
        </label>
        <label>
          หน่วยงาน
          <select value={draft.agency_code} onChange={(e) => setDraft((prev) => ({ ...prev, agency_code: e.target.value }))}>
            <option value="">ไม่ระบุ</option>
            {agencies.map((agency) => (
              <option key={agency.code} value={agency.code}>
                {agency.label_th}
              </option>
            ))}
          </select>
        </label>
        <label>
          จังหวัด
          <select value={draft.province_code} onChange={(e) => setDraft((prev) => ({ ...prev, province_code: e.target.value, district_code: "" }))}>
            <option value="">ไม่ระบุ</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name_th}
              </option>
            ))}
          </select>
        </label>
        <label>
          อำเภอ
          <select value={draft.district_code} onChange={(e) => setDraft((prev) => ({ ...prev, district_code: e.target.value }))}>
            <option value="">ไม่ระบุ</option>
            {filteredDistricts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.name_th}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="actions-row">
        <button type="button" className="cta cta--solid" onClick={handleSave} disabled={saving || loading}>
          {saving ? "กำลังบันทึก..." : "บันทึก allowlist"}
        </button>
        {message ? <p className="inline-message">{message}</p> : null}
      </div>

      <div className="table-wrap superadmin-table">
        <table>
          <thead>
            <tr>
              <th>ThaiD</th>
              <th>Role</th>
              <th>Status</th>
              <th>Scope</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.thai_d_sub ?? "-"}</td>
                <td>
                  <select value={user.role} onChange={(e) => void quickUpdate(user.id, { role: e.target.value as AppRole })}>
                    <option value="superadmin">superadmin</option>
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                  </select>
                </td>
                <td>
                  <select value={user.status} onChange={(e) => void quickUpdate(user.id, { status: e.target.value as AppUserStatus })}>
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </td>
                <td>
                  <span className="stacked-metadata">
                    <span>{user.agency_code ?? "-"}</span>
                    <span>{user.province_code ?? "-"}</span>
                    <span>{user.district_code ?? "-"}</span>
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="cta cta--ghost"
                    onClick={() => void quickUpdate(user.id, { status: user.status === "active" ? "suspended" : "active" })}
                  >
                    Toggle status
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>ยังไม่มี app_users</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}
