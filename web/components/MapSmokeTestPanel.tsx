"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase-client";
import { readinessLabel, readinessTone, type ReadinessCheck } from "@/services/qa-readiness";

type BoundaryFeatureCollection = {
  features?: Array<{ properties?: Record<string, string> }>;
};

type ProvinceRow = {
  code: string;
  name_th: string;
};

type AgencyProvinceRow = {
  agency_code: string;
  province_code: string;
};

type MapSmokeState = {
  loading: boolean;
  checks: ReadinessCheck[];
  sampleFlow: string[];
};

async function fetchBoundary(path: string): Promise<BoundaryFeatureCollection> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(path);
  }
  return (await response.json()) as BoundaryFeatureCollection;
}

export default function MapSmokeTestPanel() {
  const [state, setState] = useState<MapSmokeState>({
    loading: true,
    checks: [],
    sampleFlow: [],
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const [provinceRes, districtRes, mappingRes, provinceBoundary] = await Promise.all([
          supabase.from("master_provinces").select("code,name_th").order("code", { ascending: true }),
          supabase.from("master_districts").select("code,province_code", { count: "exact", head: false }),
          supabase.from("agency_provinces").select("agency_code,province_code"),
          fetchBoundary("/map-boundaries/provinces.geojson"),
        ]);

        const provinces = (provinceRes.data as ProvinceRow[] | null) ?? [];
        const mappings = (mappingRes.data as AgencyProvinceRow[] | null) ?? [];
        const boundaryProvinceCodes = new Set(
          (provinceBoundary.features ?? []).map((feature) => feature.properties?.province_code).filter(Boolean) as string[]
        );
        const mappedProvinceCodes = new Set(mappings.map((row) => row.province_code));
        const duplicateProvinceCodes = mappings
          .reduce((acc, row) => acc.set(row.province_code, (acc.get(row.province_code) ?? 0) + 1), new Map<string, number>());
        const duplicateCount = [...duplicateProvinceCodes.values()].filter((count) => count > 1).length;

        const districtBoundaryResults = await Promise.all(
          provinces.map(async (province) => {
            try {
              const boundary = await fetchBoundary(`/map-boundaries/districts/${province.code}.geojson`);
              return {
                provinceCode: province.code,
                ok: true,
                count: boundary.features?.length ?? 0,
              };
            } catch {
              return {
                provinceCode: province.code,
                ok: false,
                count: 0,
              };
            }
          })
        );

        const districtFileCount = districtBoundaryResults.filter((item) => item.ok).length;
        const districtBoundaryCount = districtBoundaryResults.reduce((sum, item) => sum + item.count, 0);
        const missingBoundaryProvinceCount = provinces.filter((province) => !boundaryProvinceCodes.has(province.code)).length;
        const unmappedProvinceCount = provinces.filter((province) => !mappedProvinceCodes.has(province.code)).length;
        const udonMapping = mappings.find((row) => row.province_code === "41");
        const udonDistrictFile = districtBoundaryResults.find((item) => item.provinceCode === "41");

        const checks: ReadinessCheck[] = [
          {
            key: "province-master-count",
            label: "Master provinces",
            detail: `${provinces.length.toLocaleString("th-TH")} / 77 จังหวัด`,
            severity: provinces.length === 77 ? "pass" : "fail",
          },
          {
            key: "district-master-count",
            label: "Master districts",
            detail: `${(districtRes.count ?? 0).toLocaleString("th-TH")} / 928 อำเภอ`,
            severity: (districtRes.count ?? 0) === 928 ? "pass" : "fail",
          },
          {
            key: "agency-province-mapping",
            label: "Agency mapping",
            detail: `${mappings.length.toLocaleString("th-TH")} mapping, unmapped ${unmappedProvinceCount}, duplicate ${duplicateCount}`,
            severity: mappings.length === 77 && unmappedProvinceCount === 0 && duplicateCount === 0 ? "pass" : "fail",
          },
          {
            key: "province-boundary",
            label: "Province boundary",
            detail: `${provinceBoundary.features?.length ?? 0} features, missing ${missingBoundaryProvinceCount}`,
            severity: (provinceBoundary.features?.length ?? 0) === 77 && missingBoundaryProvinceCount === 0 ? "pass" : "fail",
          },
          {
            key: "district-boundaries",
            label: "District boundaries",
            detail: `${districtFileCount} files, ${districtBoundaryCount.toLocaleString("th-TH")} features`,
            severity: districtFileCount === 77 && districtBoundaryCount === 928 ? "pass" : "fail",
          },
          {
            key: "udon-flow",
            label: "สคร.8 -> อุดรธานี",
            detail: `mapping ${udonMapping?.agency_code ?? "-"}, district features ${udonDistrictFile?.count ?? 0}`,
            severity: udonMapping?.agency_code === "DPC08" && (udonDistrictFile?.count ?? 0) > 0 ? "pass" : "fail",
          },
        ];

        if (!mounted) return;
        setState({
          loading: false,
          checks,
          sampleFlow: [
            "1. เปิด Dashboard แล้วเห็นแผนที่ 13 เขตสุขภาพ",
            "2. คลิก สคร.8 แล้วต้องเห็นจังหวัดในเขต สคร.8",
            "3. คลิก อุดรธานี แล้วต้องเห็นอำเภอในอุดรธานี",
            "4. คลิก เมืองอุดรธานี แล้วต้องเห็น detail panel ประเด็นโรค/ภัยสุขภาพ",
            "5. ถ้า login มีสิทธิ์ ต้องเห็นปุ่มกรอกข้อมูลอำเภอนี้",
          ],
        });
      } catch {
        if (!mounted) return;
        setState({
          loading: false,
          checks: [
            {
              key: "map-smoke-load",
              label: "Map smoke load",
              detail: "โหลด smoke test ไม่สำเร็จ",
              severity: "fail",
            },
          ],
          sampleFlow: [],
        });
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const passCount = useMemo(() => state.checks.filter((check) => check.severity === "pass").length, [state.checks]);

  return (
    <section className="panel table-panel">
      <div className="section-row">
        <div>
          <h2>Map Smoke Test</h2>
          <p className="section-row__subtitle">ตรวจ GeoJSON, mapping สคร.-จังหวัด และ flow แผนที่ 3 ระดับ</p>
        </div>
        <span className="filter-chip">{state.loading ? "loading" : `${passCount}/${state.checks.length} checks passed`}</span>
      </div>

      <div className="readiness-grid">
        {state.checks.map((check) => (
          <div key={check.key} className="readiness-card">
            <div className="readiness-card__top">
              <strong>{check.label}</strong>
              <span className={`status-badge ${readinessTone(check.severity)}`}>{readinessLabel(check.severity)}</span>
            </div>
            <p>{check.detail}</p>
          </div>
        ))}
      </div>

      {state.sampleFlow.length > 0 ? (
        <div className="map-smoke-flow">
          <h3>Manual flow ที่ต้องลองคลิกจริง</h3>
          {state.sampleFlow.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

