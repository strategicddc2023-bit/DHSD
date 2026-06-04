"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgencyCoverageRow, AgencyProvinceMapRow, ProvinceCoverageRow } from "@/types/mvp";

type ThailandHealthZoneMapProps = {
  coverage: AgencyCoverageRow[];
  provinceCoverage: ProvinceCoverageRow[];
  agencyProvinceMap: AgencyProvinceMapRow[];
  selectedAgencyCode?: string;
  onSelectAgency?: (agencyCode: string) => void;
};

type DpcPoint = {
  agencyCode: string;
  label: string;
  latitude: number;
  longitude: number;
};

type AmChartsMapImage = {
  title?: string;
  latitude: number;
  longitude: number;
  color?: string;
  scale?: number;
  agencyCode?: string;
  selectable?: boolean;
  description?: string;
};

type AmChartsMap = {
  clear: () => void;
  validateData?: () => void;
  dataProvider?: {
    images?: AmChartsMapImage[];
  };
};

type AmChartsMapArea = {
  id: string;
  color: string;
  agencyCode?: string;
  title?: string;
  description?: string;
};

declare global {
  interface Window {
    AmCharts?: {
      makeChart: (id: string, config: Record<string, unknown>) => AmChartsMap;
    };
  }
}

const MAP_DIV_ID = "thailand-health-map-amcharts";

const dpcPoints: DpcPoint[] = [
  { agencyCode: "DPC01", label: "สคร.1", latitude: 18.79, longitude: 98.98 },
  { agencyCode: "DPC02", label: "สคร.2", latitude: 16.82, longitude: 100.26 },
  { agencyCode: "DPC03", label: "สคร.3", latitude: 15.87, longitude: 100.99 },
  { agencyCode: "DPC04", label: "สคร.4", latitude: 14.81, longitude: 100.61 },
  { agencyCode: "DPC05", label: "สคร.5", latitude: 13.36, longitude: 99.82 },
  { agencyCode: "DPC06", label: "สคร.6", latitude: 13.36, longitude: 101.06 },
  { agencyCode: "DPC07", label: "สคร.7", latitude: 16.44, longitude: 102.83 },
  { agencyCode: "DPC08", label: "สคร.8", latitude: 17.41, longitude: 102.79 },
  { agencyCode: "DPC09", label: "สคร.9", latitude: 14.98, longitude: 102.10 },
  { agencyCode: "DPC10", label: "สคร.10", latitude: 15.24, longitude: 104.85 },
  { agencyCode: "DPC11", label: "สคร.11", latitude: 9.14, longitude: 99.33 },
  { agencyCode: "DPC12", label: "สคร.12", latitude: 7.88, longitude: 98.40 },
  { agencyCode: "DPC13", label: "สคร.13", latitude: 13.75, longitude: 100.50 },
];

function getZoneColor(value: number, max: number, selected: boolean): string {
  if (selected) return "#fb923c";
  if (max <= 0 || value <= 0) return "#fde68a";
  const ratio = value / max;
  if (ratio >= 0.75) return "#ea580c";
  if (ratio >= 0.5) return "#f97316";
  if (ratio >= 0.25) return "#f59e0b";
  return "#facc15";
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`โหลดสคริปต์ไม่สำเร็จ: ${src}`)), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`โหลดสคริปต์ไม่สำเร็จ: ${src}`));
    document.body.appendChild(script);
  });
}

function loadExportCss(href: string) {
  const exists = document.querySelector(`link[href="${href}"]`);
  if (exists) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.media = "all";
  link.href = href;
  document.head.appendChild(link);
}

export default function ThailandHealthZoneMap({
  coverage,
  provinceCoverage,
  agencyProvinceMap,
  selectedAgencyCode,
  onSelectAgency,
}: ThailandHealthZoneMapProps) {
  const chartRef = useRef<AmChartsMap | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const countByAgency = useMemo(() => new Map(coverage.map((item) => [item.agency_code, item.record_count])), [coverage]);
  const labelByAgency = useMemo(() => new Map(coverage.map((item) => [item.agency_code, item.agency_name])), [coverage]);
  const provinceCoverageByCode = useMemo(
    () => new Map(provinceCoverage.map((item) => [item.province_code, item])),
    [provinceCoverage]
  );
  const maxValue = useMemo(() => Math.max(0, ...provinceCoverage.map((item) => item.record_count)), [provinceCoverage]);
  const hasData = maxValue > 0;

  useEffect(() => {
    let unmounted = false;

    const boot = async () => {
      setMapState("loading");
      loadExportCss("https://www.amcharts.com/lib/3/plugins/export/export.css");
      try {
        await loadScript("https://www.amcharts.com/lib/3/ammap.js");
        await loadScript("https://www.amcharts.com/lib/3/maps/js/thailandLow.js");
        await loadScript("https://www.amcharts.com/lib/3/plugins/export/export.min.js");
        await loadScript("https://www.amcharts.com/lib/3/themes/light.js");
      } catch (error) {
        setMapState("error");
        chartRef.current?.clear();
        chartRef.current = null;
        return;
      }
      if (unmounted || !window.AmCharts) {
        setMapState("error");
        return;
      }

      const areaByProvinceCode = new Map<string, AmChartsMapArea>();
      agencyProvinceMap.forEach((item) => {
        const provinceCode = item.province_code.padStart(2, "0");
        const provinceId = `TH-${provinceCode}`;
        const provinceRow = provinceCoverageByCode.get(item.province_code);
        const count = provinceRow?.record_count ?? 0;
        const selected = selectedAgencyCode === item.agency_code;
        const label = labelByAgency.get(item.agency_code) ?? item.agency_code;
        const provinceName = provinceRow?.province_name ?? `จังหวัด ${provinceCode}`;
        areaByProvinceCode.set(provinceId, {
          id: provinceId,
          color: getZoneColor(count, maxValue, selected),
          agencyCode: item.agency_code,
          title: `${provinceName} • ${label}`,
          description: `${count.toLocaleString("th-TH")} รายการ`,
        });
      });

      const images: AmChartsMapImage[] = dpcPoints.map((point) => {
        const count = countByAgency.get(point.agencyCode) ?? 0;
        const selected = selectedAgencyCode === point.agencyCode;
        const percent = hasData ? Math.round((count / maxValue) * 100) : 0;
        return {
          title: `${point.label} (${count.toLocaleString("th-TH")} รายการ)`,
          description: `${percent}% ของจุดที่มีข้อมูลสูงสุด`,
          latitude: point.latitude,
          longitude: point.longitude,
          color: getZoneColor(count, maxValue, selected),
          scale: selected ? 1.6 : 1.35,
          agencyCode: point.agencyCode,
          selectable: true,
        };
      });

      chartRef.current?.clear();
      chartRef.current = window.AmCharts.makeChart(MAP_DIV_ID, {
        type: "map",
        theme: "light",
        projection: "mercator",
        dataProvider: {
          map: "thailandLow",
          getAreasFromMap: true,
          areas: [...areaByProvinceCode.values()],
          images,
        },
        areasSettings: {
          autoZoom: false,
          selectable: true,
          unlistedAreasColor: "#fef3c7",
          unlistedAreasAlpha: 1,
          color: "#fdba74",
          rollOverColor: "#fb923c",
          outlineColor: "#ffffff",
          outlineThickness: 1,
          balloonText: "[[title]]<br/><strong>จำนวนรายการ:</strong> [[description]]",
        },
        imagesSettings: {
          rollOverScale: 1.08,
          selectedScale: 1.12,
          color: "#ea580c",
          alpha: 1,
          labelPosition: "middle",
          labelText: "[[description]]",
          labelColor: "#7c2d12",
          labelFontSize: 9,
          balloonText: "[[title]]",
        },
        export: { enabled: true },
        listeners: [
          {
            event: "clickMapObject",
            method: (event: { mapObject?: { agencyCode?: string } }) => {
              const agencyCode = event.mapObject?.agencyCode;
              if (agencyCode) onSelectAgency?.(agencyCode);
            },
          },
        ],
      });
      setMapState("ready");
    };

    void boot();

    return () => {
      unmounted = true;
    };
  }, [agencyProvinceMap, hasData, labelByAgency, maxValue, onSelectAgency, provinceCoverageByCode, selectedAgencyCode, countByAgency]);

  useEffect(() => {
    return () => {
      chartRef.current?.clear();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="th-map-wrap">
      <div className="th-map-stage">
        <div id={MAP_DIV_ID} className="th-map-amcharts" role="img" aria-label="แผนที่เขตสุขภาพประเทศไทย" />
        {mapState !== "ready" ? (
          <div className="th-map-fallback">
            {mapState === "loading" ? (
              <p>กำลังโหลดแผนที่ประเทศไทย...</p>
            ) : (
              <>
                <p>แผนที่แบบ interactive ใช้งานไม่ได้ในขณะนี้ ระบบจะแสดงข้อมูลสรุปแทน</p>
                <div className="th-map-fallback__grid">
                  <div>
                    <strong>สคร.ที่มีข้อมูล</strong>
                    <p>{coverage.length.toLocaleString("th-TH")} เขต</p>
                  </div>
                  <div>
                    <strong>จังหวัดที่มีข้อมูล</strong>
                    <p>{provinceCoverage.filter((item) => item.record_count > 0).length.toLocaleString("th-TH")} จังหวัด</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="th-map-legend">
        <p>สถานะแผนที่</p>
        <div><span className="swatch swatch-0" />ข้อมูลเริ่มต้น</div>
        <div><span className="swatch swatch-1" />ระดับต่ำ</div>
        <div><span className="swatch swatch-2" />ระดับกลาง</div>
        <div><span className="swatch swatch-3" />ระดับสูง</div>
        <div><span className="swatch swatch-4" />ระดับสูงมาก</div>
        <div><span className="swatch swatch-selected" />เขตที่เลือก</div>
      </div>
    </div>
  );
}
