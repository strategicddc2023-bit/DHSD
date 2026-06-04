"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import {
  buildAccessPermissionSnapshot,
  canSubmitForOwnAgency,
  canViewAgency,
  canViewAll,
  canViewProvince,
  type AccessScope,
} from "@/services/access-control";
import type { AgencyOption, District, Province } from "@/types/mvp";

type AccessSmokeTestPanelProps = {
  currentScope?: AccessScope;
};

const roleOptions: AccessScope["role"][] = ["superadmin", "admin", "user"];

export default function AccessSmokeTestPanel({ currentScope }: AccessSmokeTestPanelProps) {
  const [roles, setRoles] = useState<AccessScope["role"]>(currentScope?.role ?? "superadmin");
  const [agencyCode, setAgencyCode] = useState(currentScope?.agencyCode ?? "");
  const [provinceCode, setProvinceCode] = useState(currentScope?.provinceCode ?? "");
  const [districtCode, setDistrictCode] = useState("");
  const [agencies, setAgencies] = useState<AgencyOption[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    const loadMasters = async () => {
      const [agencyRes, provinceRes, districtRes] = await Promise.all([
        supabase.from("master_agencies").select("code,label_th").order("code", { ascending: true }),
        supabase.from("master_provinces").select("code,name_th").order("name_th", { ascending: true }),
        supabase.from("master_districts").select("code,name_th,province_code").order("name_th", { ascending: true }),
      ]);

      setAgencies(agencyRes.data ?? []);
      setProvinces(provinceRes.data ?? []);
      setDistricts((districtRes.data as District[] | null) ?? []);
    };

    void loadMasters();
  }, []);

  useEffect(() => {
    if (currentScope?.role) setRoles(currentScope.role);
    if (currentScope?.agencyCode) setAgencyCode(currentScope.agencyCode);
    if (currentScope?.provinceCode) setProvinceCode(currentScope.provinceCode);
  }, [currentScope?.agencyCode, currentScope?.provinceCode, currentScope?.role]);

  const scope: AccessScope = useMemo(
    () => ({ role: roles, agencyCode: agencyCode || null, provinceCode: provinceCode || null }),
    [agencyCode, provinceCode, roles]
  );

  const targetAgencyCode = agencyCode || agencies[0]?.code || "";
  const targetProvinceCode = provinceCode || provinces[0]?.code || "";
  const targetDistrict = districts.find((district) => district.code === districtCode);
  const snapshot = useMemo(
    () => buildAccessPermissionSnapshot(scope, targetAgencyCode, targetProvinceCode),
    [scope, targetAgencyCode, targetProvinceCode]
  );

  return (
    <section className="panel table-panel">
      <div className="section-row">
        <div>
          <h2>Phase 8 Smoke Test</h2>
          <p className="section-row__subtitle">ลองบทบาท superadmin / admin / user แบบไม่ต้องเข้า flow login จริง</p>
        </div>
        <span className="filter-chip">route: /smoke-test</span>
      </div>

      <div className="smoke-grid">
        <label>
          Role
          <select value={roles} onChange={(e) => setRoles(e.target.value as AccessScope["role"])}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>
        <label>
          Agency
          <select value={agencyCode} onChange={(e) => setAgencyCode(e.target.value)}>
            <option value="">เลือกหน่วยงาน</option>
            {agencies.map((agency) => (
              <option key={agency.code} value={agency.code}>
                {agency.label_th}
              </option>
            ))}
          </select>
        </label>
        <label>
          Province
          <select value={provinceCode} onChange={(e) => setProvinceCode(e.target.value)}>
            <option value="">เลือกจังหวัด</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name_th}
              </option>
            ))}
          </select>
        </label>
        <label>
          District
          <select value={districtCode} onChange={(e) => setDistrictCode(e.target.value)}>
            <option value="">เลือกอำเภอ</option>
            {districts
              .filter((district) => !provinceCode || district.province_code === provinceCode)
              .map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name_th}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="alert-summary-grid smoke-summary-grid">
        <div className="summary-mini">
          <strong>{scope.role}</strong>
          <span>role</span>
        </div>
        <div className="summary-mini">
          <strong>{scope.agencyCode ?? "-"}</strong>
          <span>agency</span>
        </div>
        <div className="summary-mini">
          <strong>{scope.provinceCode ?? "-"}</strong>
          <span>province</span>
        </div>
        <div className="summary-mini">
          <strong>{targetDistrict?.code ?? "-"}</strong>
          <span>district</span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Check</th>
              <th>Expected</th>
              <th>How it maps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>View all</td>
              <td>{canViewAll(scope) ? "Yes" : "No"}</td>
              <td>superadmin only</td>
            </tr>
            <tr>
              <td>View target agency</td>
              <td>{canViewAgency(scope, targetAgencyCode) ? "Yes" : "No"}</td>
              <td>superadmin or matched scope</td>
            </tr>
            <tr>
              <td>View target province</td>
              <td>{canViewProvince(scope, targetProvinceCode) ? "Yes" : "No"}</td>
              <td>superadmin or admin province scope</td>
            </tr>
            <tr>
              <td>Submit to own agency</td>
              <td>{canSubmitForOwnAgency(scope, targetAgencyCode) ? "Yes" : "No"}</td>
              <td>superadmin or own agency</td>
            </tr>
            <tr>
              <td>Manage users</td>
              <td>{snapshot.canManageUsers ? "Yes" : "No"}</td>
              <td>superadmin only</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
