import { useEffect, useMemo, useState, useImperativeHandle } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { FeatureCollection } from "geojson";
import type { InteractiveHealthMapProps } from "@/components/InteractiveHealthMap";
import { canSubmitForOwnAgency } from "@/services/access-control";
import { loadDistrictHealthIssueSummary } from "@/services/health-issue-service";
import { loadDistrictBoundaries, loadProvinceBoundaries } from "@/services/map-boundary-service";
import type { DistrictHealthIssueSummary } from "@/services/health-issue-service";
import type { DistrictBoundaryCollection, DistrictBoundaryProperties, ProvinceBoundaryCollection, ProvinceBoundaryProperties } from "@/types/map";

const thailandCenter: [number, number] = [13.736, 100.523];

const agencyPalette = [
  "#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA",
  "#007AFF", "#5856D6", "#FF2D55", "#009688", "#795548",
  "#12d67bff", "#E91E63", "#8BC34A",
];

type ProvinceFeatureLike = { properties: ProvinceBoundaryProperties };
type DistrictFeatureLike = { properties: DistrictBoundaryProperties };

function buildAgencyColorMap(agencyCodes: string[]) {
  return new Map(agencyCodes.map((code, index) => [code, agencyPalette[index % agencyPalette.length]]));
}

function MapBoundsController({ boundaries, maxZoom }: { boundaries: DistrictBoundaryCollection | ProvinceBoundaryCollection | null; maxZoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!boundaries || boundaries.features.length === 0) return;
    const layer = L.geoJSON({ type: "FeatureCollection", features: boundaries.features } as FeatureCollection);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [4, 4], maxZoom });
  }, [boundaries, map, maxZoom]);
  return null;
}

function MapDistrictBoundsController({ districtCode, boundaries }: { districtCode: string; boundaries: DistrictBoundaryCollection | null }) {
  const map = useMap();
  useEffect(() => {
    if (!districtCode || !boundaries || boundaries.features.length === 0) return;
    const feature = boundaries.features.find((f) => f.properties.district_code === districtCode);
    if (!feature) return;
    const layer = L.geoJSON({ type: "FeatureCollection", features: [feature] } as FeatureCollection);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [districtCode, boundaries, map]);
  return null;
}

function MapController({ setMapInstance }: { setMapInstance: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    setMapInstance(map);
  }, [map, setMapInstance]);
  return null;
}

export default function InteractiveHealthMapClient({
  coverage,
  provinceCoverage,
  agencyProvinceMap,
  selectedAgencyCode,
  selectedProvinceFromChart,
  selectedDistrictFromMap,
  selectedSubdistrictFromMap,
  onSelectAgency,
  onSelectProvince,
  onSelectDistrict,
  onSelectSubdistrict,
  accessScope,
  forwardedRef,
}: InteractiveHealthMapProps) {
  const [boundaries, setBoundaries] = useState<ProvinceBoundaryCollection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("");
  const [districtBoundaries, setDistrictBoundaries] = useState<DistrictBoundaryCollection | null>(null);
  const [districtStatus, setDistrictStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useImperativeHandle(forwardedRef, () => ({
    resetView: () => {
      if (mapInstance) {
        mapInstance.setView(thailandCenter, 5.4);
      }
    }
  }));

  const agencyCodes = useMemo(() => [...new Set(agencyProvinceMap.map((item) => item.agency_code))].sort(), [agencyProvinceMap]);
  const visibleProvinceCodeSet = useMemo(() => new Set(provinceCoverage.map((item) => item.province_code)), [provinceCoverage]);
  const agencyColorMap = useMemo(() => buildAgencyColorMap(agencyCodes), [agencyCodes]);
  const provinceToAgency = useMemo(() => new Map(agencyProvinceMap.map((item) => [item.province_code, item.agency_code])), [agencyProvinceMap]);
  const agencyLabelMap = useMemo(() => new Map(coverage.map((item) => [item.agency_code, item.agency_name])), [coverage]);
  const provinceCoverageMap = useMemo(() => new Map(provinceCoverage.map((item) => [item.province_code, item.record_count])), [provinceCoverage]);
  const provinceNameMap = useMemo(() => new Map((boundaries?.features ?? []).map((item) => [item.properties.province_code, item.properties.province_name])), [boundaries]);
  
  const visibleBoundaries = useMemo<ProvinceBoundaryCollection | null>(() => {
    if (!boundaries) return null;
    const allowedFeatures = boundaries.features.filter((feature) => visibleProvinceCodeSet.has(feature.properties.province_code));
    if (!selectedAgencyCode) return { ...boundaries, features: allowedFeatures };
    return { ...boundaries, features: allowedFeatures.filter((feature) => provinceToAgency.get(feature.properties.province_code) === selectedAgencyCode) };
  }, [boundaries, provinceToAgency, selectedAgencyCode, visibleProvinceCodeSet]);

  const selectedAgencyName = selectedAgencyCode ? agencyLabelMap.get(selectedAgencyCode) ?? selectedAgencyCode : "";
  const selectedProvinceName = selectedProvinceCode ? provinceNameMap.get(selectedProvinceCode) ?? selectedProvinceCode : "";
  const isMapBusy = status === "loading" || districtStatus === "loading";
  const canReturnToAllZones = Boolean(selectedAgencyCode && !accessScope?.agencyCode);

  // Sync from external chart province selection
  useEffect(() => {
    if (!selectedProvinceFromChart) {
      setSelectedProvinceCode("");
      setSelectedDistrictCode("");
      return;
    }
    if (selectedProvinceFromChart === selectedProvinceCode) return;
    setSelectedProvinceCode(selectedProvinceFromChart);
    setSelectedDistrictCode("");
  }, [selectedProvinceFromChart, selectedProvinceCode]);

  // Sync from external district selection
  useEffect(() => {
    if (!selectedDistrictFromMap) {
      setSelectedDistrictCode("");
      return;
    }
    if (selectedDistrictFromMap === selectedDistrictCode) return;
    setSelectedDistrictCode(selectedDistrictFromMap);
  }, [selectedDistrictFromMap, selectedDistrictCode]);

  useEffect(() => {
    setSelectedProvinceCode("");
    setSelectedDistrictCode("");
    setDistrictBoundaries(null);
    setDistrictStatus("idle");
  }, [selectedAgencyCode]);

  useEffect(() => {
    setSelectedDistrictCode("");
    setDistrictBoundaries(null);
    if (!selectedProvinceCode) { setDistrictStatus("idle"); return; }
    let mounted = true;
    const load = async () => {
      setDistrictStatus("loading");
      try {
        const data = await loadDistrictBoundaries(selectedProvinceCode);
        if (!mounted) return;
        setDistrictBoundaries({ ...data, features: data.features.filter((feature) => visibleProvinceCodeSet.has(feature.properties.province_code)) });
        setDistrictStatus("ready");
      } catch { if (!mounted) return; setDistrictStatus("error"); }
    };
    void load();
    return () => { mounted = false; };
  }, [selectedProvinceCode, visibleProvinceCodeSet]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const data = await loadProvinceBoundaries();
        if (!mounted) return;
        setBoundaries(data);
        setStatus("ready");
      } catch { if (!mounted) return; setStatus("error"); }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const featureStyle = (feature?: ProvinceFeatureLike): PathOptions => {
    const provinceCode = feature?.properties.province_code ?? "";
    const agencyCode = provinceToAgency.get(provinceCode);
    const isSelected = Boolean(selectedAgencyCode && agencyCode === selectedAgencyCode);
    const isSelectedProvince = Boolean(selectedProvinceCode && provinceCode === selectedProvinceCode);
    if (!agencyCode) return { color: "#cbd5e1", fillColor: "#e2e8f0", fillOpacity: 0.45, weight: 1 };
    return {
      color: isSelectedProvince ? "#020617" : isSelected ? "#ffffff" : "#f8fafc",
      fillColor: isSelected ? (isSelectedProvince ? "#f97316" : "#ff039a") : agencyColorMap.get(agencyCode) ?? "#03a7f3",
      fillOpacity: isSelectedProvince ? 0.92 : isSelected ? 0.8 : 0.68,
      weight: isSelectedProvince ? 3 : isSelected ? 2.1 : 1.2,
    };
  };

  const onEachFeature = (feature: ProvinceFeatureLike, layer: Layer) => {
    const provinceCode = feature.properties.province_code;
    const agencyCode = provinceToAgency.get(provinceCode);
    const agencyName = agencyCode ? agencyLabelMap.get(agencyCode) ?? agencyCode : "ยังไม่ผูก สคร.";
    const recordCount = provinceCoverageMap.get(provinceCode) ?? 0;
    layer.bindTooltip(`<strong>${feature.properties.province_name}</strong><br/>${agencyName}<br/>${recordCount.toLocaleString("th-TH")} รายการ`, { sticky: true });
    layer.on("click", () => {
      if (!agencyCode || !visibleProvinceCodeSet.has(provinceCode)) return;
      if (selectedAgencyCode) { 
        setSelectedProvinceCode(provinceCode); 
        onSelectProvince?.(provinceCode); 
      }
      else onSelectAgency?.(agencyCode);
    });
  };

  const districtFeatureStyle = (feature?: DistrictFeatureLike): PathOptions => {
    const districtCode = feature?.properties.district_code ?? "";
    const selected = Boolean(selectedDistrictCode && districtCode === selectedDistrictCode);
    return { color: selected ? "#020617" : "#ffffff", fillColor: selected ? "#f97316" : "#03a7f3", fillOpacity: selected ? 0.9 : 0.62, weight: selected ? 2.8 : 1.15 };
  };

  const onEachDistrictFeature = (feature: DistrictFeatureLike, layer: Layer) => {
    const districtCode = feature.properties.district_code;
    layer.bindTooltip(`<strong>${feature.properties.district_name}</strong><br/>${selectedProvinceName}<br/>คลิกเพื่อเลือกอำเภอ`, { sticky: true });
    layer.on("click", () => { 
      setSelectedDistrictCode(districtCode); 
      onSelectDistrict?.(districtCode); 
    });
  };

  if (status === "error") return <div className="interactive-map__loading interactive-map__loading--error"><p>โหลดไฟล์ขอบเขตจังหวัดไม่สำเร็จ</p><span>ตรวจสอบ `web/public/map-boundaries/provinces.geojson`</span></div>;

  const resetToAgencyLevel = () => {
    setSelectedProvinceCode("");
    setSelectedDistrictCode("");
    onSelectProvince?.("");
    onSelectDistrict?.("");
  };
  const resetToAllZones = () => {
    setSelectedProvinceCode("");
    setSelectedDistrictCode("");
    onSelectProvince?.("");
    onSelectDistrict?.("");
    if (selectedAgencyCode) {
      onSelectAgency?.(selectedAgencyCode);
    }
  };

  return (
    <div className="interactive-map">
      <div className="interactive-map__breadcrumb" aria-label="ลำดับพื้นที่แผนที่">
        <button type="button" className="interactive-map__crumb interactive-map__crumb--active" onClick={resetToAllZones} disabled={!canReturnToAllZones}>13 เขตสุขภาพ</button>
        <button type="button" className={selectedAgencyCode ? "interactive-map__crumb interactive-map__crumb--active" : "interactive-map__crumb"} onClick={resetToAgencyLevel} disabled={!selectedProvinceCode}>จังหวัดในเขต</button>
        <button type="button" className={districtBoundaries ? "interactive-map__crumb interactive-map__crumb--active" : "interactive-map__crumb"} disabled>อำเภอ</button>
      </div>

      <div className="interactive-map__canvas-wrap">
        <MapContainer className="interactive-map__canvas" center={thailandCenter} zoom={5.4} scrollWheelZoom={false} attributionControl>
          <MapController setMapInstance={setMapInstance} />
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {districtBoundaries ? (
            <>
              <MapBoundsController boundaries={districtBoundaries} maxZoom={10} />
              {/* {selectedDistrictCode ? (
                <MapDistrictBoundsController districtCode={selectedDistrictCode} boundaries={districtBoundaries} />
              ) : null} */}
              <GeoJSON key={`district-${selectedProvinceCode}-${selectedDistrictCode || "none"}-${districtBoundaries.features.length}`} data={districtBoundaries} style={districtFeatureStyle} onEachFeature={onEachDistrictFeature} />
            </>
          ) : visibleBoundaries ? (
            <>
              <MapBoundsController boundaries={visibleBoundaries} maxZoom={selectedAgencyCode ? 8 : 6} />
              <GeoJSON key={`${selectedAgencyCode ?? "all"}-${selectedProvinceCode || "none"}-${visibleBoundaries.features.length}`} data={visibleBoundaries} style={featureStyle} onEachFeature={onEachFeature} />
            </>
          ) : null}
        </MapContainer>
        {isMapBusy ? <div className="interactive-map__overlay" role="status"><span></span><p>{districtStatus === "loading" ? `กำลังโหลดอำเภอของจังหวัด${selectedProvinceName}` : "กำลังโหลดแผนที่"}</p></div> : null}
      </div>


      <div className="interactive-map__legend">
        <span><i className="interactive-map__swatch interactive-map__swatch--zone" />เขตสุขภาพ</span>
        <span><i className="interactive-map__swatch interactive-map__swatch--selected" />เขตที่เลือก</span>
        <span><i className="interactive-map__swatch interactive-map__swatch--province" />จังหวัด/อำเภอที่เลือก</span>
        <span><i className="interactive-map__swatch interactive-map__swatch--district" />อำเภอ</span>
      </div>
    </div>
  );
}