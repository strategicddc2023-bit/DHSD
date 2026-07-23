import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import type { Layer, PathOptions } from "leaflet";
import type { FeatureCollection } from "geojson";
import type { HealthIssueDistributionMapProps, HealthIssueDistributionRecord } from "@/components/HealthIssueDistributionMap";
import { loadDistrictBoundaries, loadProvinceBoundaries } from "@/services/map-boundary-service";
import type { DistrictBoundaryCollection, DistrictBoundaryProperties, ProvinceBoundaryCollection, ProvinceBoundaryProperties } from "@/types/map";

const thailandCenter: [number, number] = [13.736, 100.523];
const fallbackIssueColor = "#1d9bf0";

type ProvinceFeatureLike = { properties: ProvinceBoundaryProperties };
type DistrictFeatureLike = { properties: DistrictBoundaryProperties };
type AreaIssueSummary = { count: number; dominantIssue: string; issueCounts: Map<string, number> };

function summarizeByArea(records: HealthIssueDistributionRecord[], keyOf: (record: HealthIssueDistributionRecord) => string) {
  const summaries = new Map<string, AreaIssueSummary>();

  records.forEach((record) => {
    const key = keyOf(record);
    const issue = record.issue.trim();
    if (!key || !issue) return;
    const summary = summaries.get(key) ?? { count: 0, dominantIssue: issue, issueCounts: new Map<string, number>() };
    const issueCount = (summary.issueCounts.get(issue) ?? 0) + 1;
    summary.count += 1;
    summary.issueCounts.set(issue, issueCount);
    const dominantCount = summary.issueCounts.get(summary.dominantIssue) ?? 0;
    if (issueCount > dominantCount || (issueCount === dominantCount && issue.localeCompare(summary.dominantIssue, "th") < 0)) {
      summary.dominantIssue = issue;
    }
    summaries.set(key, summary);
  });

  return summaries;
}

function colorWithOpacity(hex: string, opacity: number) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function opacityForCount(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0.12;
  const ratio = count / max;
  if (ratio >= 0.75) return 0.86;
  if (ratio >= 0.5) return 0.7;
  if (ratio >= 0.25) return 0.54;
  return 0.38;
}

function topIssuesLabel(summary: AreaIssueSummary | undefined) {
  if (!summary) return "ไม่มีข้อมูล";
  return [...summary.issueCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "th"))
    .slice(0, 3)
    .map(([issue, count]) => `${issue}: ${count.toLocaleString("th-TH")}`)
    .join("<br/>");
}

function MapBoundsController({ boundaries, selectedDistrictCode, maxZoom }: { boundaries: DistrictBoundaryCollection | ProvinceBoundaryCollection | null; selectedDistrictCode?: string; maxZoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (!boundaries || boundaries.features.length === 0) return;
    const districtFeature = selectedDistrictCode
      ? boundaries.features.find((feature) => "district_code" in feature.properties && feature.properties.district_code === selectedDistrictCode)
      : null;
    const features = districtFeature ? [districtFeature] : boundaries.features;
    const layer = L.geoJSON({ type: "FeatureCollection", features } as FeatureCollection);
    const bounds = layer.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [6, 6], maxZoom });
  }, [boundaries, map, maxZoom, selectedDistrictCode]);

  return null;
}

export default function HealthIssueDistributionMapClient({
  selectedIssue = "",
  issueColor = fallbackIssueColor,
  issueColorMap = {},
  records,
  selectedProvinceCode = "",
  selectedDistrictCode = "",
  onSelectProvince,
  onSelectDistrict,
  onClearProvince,
}: HealthIssueDistributionMapProps) {
  const [provinceBoundaries, setProvinceBoundaries] = useState<ProvinceBoundaryCollection | null>(null);
  const [districtBoundaries, setDistrictBoundaries] = useState<DistrictBoundaryCollection | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [districtStatus, setDistrictStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const visibleRecords = useMemo(() => {
    const issue = selectedIssue.trim();
    return issue ? records.filter((record) => record.issue === issue) : records;
  }, [records, selectedIssue]);
  const provinceSummaries = useMemo(() => summarizeByArea(visibleRecords, (record) => record.provinceCode), [visibleRecords]);
  const districtSummaries = useMemo(() => summarizeByArea(visibleRecords, (record) => record.districtCode), [visibleRecords]);
  const maxProvinceCount = useMemo(() => Math.max(0, ...[...provinceSummaries.values()].map((summary) => summary.count)), [provinceSummaries]);
  const maxDistrictCount = useMemo(() => Math.max(0, ...[...districtSummaries.values()].map((summary) => summary.count)), [districtSummaries]);
  const activeDistrictBoundaries = selectedProvinceCode ? districtBoundaries : null;
  const isBusy = status === "loading" || districtStatus === "loading";
  const legendColor = selectedIssue ? issueColor : "linear-gradient(90deg, #e11d48, #2563eb, #f59e0b, #16a34a, #7c3aed)";

  const resolveIssueColor = (summary: AreaIssueSummary | undefined) => {
    if (selectedIssue) return issueColor;
    if (!summary?.dominantIssue) return fallbackIssueColor;
    return issueColorMap[summary.dominantIssue] ?? fallbackIssueColor;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const data = await loadProvinceBoundaries();
        if (!mounted) return;
        setProvinceBoundaries(data);
        setStatus("ready");
      } catch {
        if (!mounted) return;
        setStatus("error");
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setDistrictBoundaries(null);
    if (!selectedProvinceCode) {
      setDistrictStatus("idle");
      return;
    }

    let mounted = true;
    const load = async () => {
      setDistrictStatus("loading");
      try {
        const data = await loadDistrictBoundaries(selectedProvinceCode);
        if (!mounted) return;
        setDistrictBoundaries(data);
        setDistrictStatus("ready");
      } catch {
        if (!mounted) return;
        setDistrictStatus("error");
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [selectedProvinceCode]);

  const provinceStyle = (feature?: ProvinceFeatureLike): PathOptions => {
    const provinceCode = feature?.properties.province_code ?? "";
    const summary = provinceSummaries.get(provinceCode);
    const count = summary?.count ?? 0;
    const selected = selectedProvinceCode === provinceCode;
    const fillColor = count > 0 ? colorWithOpacity(resolveIssueColor(summary), opacityForCount(count, maxProvinceCount)) : "#e2e8f0";

    return {
      color: selected ? "#0f172a" : count > 0 ? "#ffffff" : "#cbd5e1",
      fillColor,
      fillOpacity: count > 0 ? 0.96 : 0.42,
      weight: selected ? 2.8 : count > 0 ? 1.35 : 0.8,
    };
  };

  const districtStyle = (feature?: DistrictFeatureLike): PathOptions => {
    const districtCode = feature?.properties.district_code ?? "";
    const summary = districtSummaries.get(districtCode);
    const count = summary?.count ?? 0;
    const selected = selectedDistrictCode === districtCode;
    const fillColor = count > 0 ? colorWithOpacity(resolveIssueColor(summary), opacityForCount(count, maxDistrictCount)) : "#e2e8f0";

    return {
      color: selected ? "#0f172a" : count > 0 ? "#ffffff" : "#cbd5e1",
      fillColor,
      fillOpacity: count > 0 ? 0.98 : 0.34,
      weight: selected ? 3 : count > 0 ? 1.4 : 0.8,
    };
  };

  const onEachProvince = (feature: ProvinceFeatureLike, layer: Layer) => {
    const provinceCode = feature.properties.province_code;
    const summary = provinceSummaries.get(provinceCode);
    const count = summary?.count ?? 0;
    const title = selectedIssue || "ทุกประเด็น";
    layer.bindTooltip(`<strong>${feature.properties.province_name}</strong><br/>${title}<br/>${count.toLocaleString("th-TH")} รายการ<br/>${topIssuesLabel(summary)}`, { sticky: true });
    layer.on("click", () => {
      if (count <= 0) return;
      onSelectProvince?.(provinceCode);
    });
  };

  const onEachDistrict = (feature: DistrictFeatureLike, layer: Layer) => {
    const districtCode = feature.properties.district_code;
    const summary = districtSummaries.get(districtCode);
    const count = summary?.count ?? 0;
    const title = selectedIssue || "ทุกประเด็น";
    layer.bindTooltip(`<strong>${feature.properties.district_name}</strong><br/>${title}<br/>${count.toLocaleString("th-TH")} รายการ<br/>${topIssuesLabel(summary)}`, { sticky: true });
    layer.on("click", () => {
      if (count <= 0) return;
      onSelectDistrict?.(districtCode);
    });
  };

  if (status === "error") {
    return (
      <div className="health-issue-distribution-map__loading health-issue-distribution-map__loading--error">
        <p>โหลดไฟล์ขอบเขตประเทศไทยไม่สำเร็จ</p>
      </div>
    );
  }

  return (
    <div className="health-issue-distribution-map">
      <div className="health-issue-distribution-map__canvas-wrap">
        <MapContainer className="health-issue-distribution-map__canvas" center={thailandCenter} zoom={5.35} scrollWheelZoom={false} attributionControl={false}>
          {activeDistrictBoundaries ? (
            <>
              <MapBoundsController boundaries={activeDistrictBoundaries} selectedDistrictCode={selectedDistrictCode} maxZoom={selectedDistrictCode ? 10 : 8.5} />
              <GeoJSON key={`issue-district-${selectedIssue || "all"}-${selectedProvinceCode}-${selectedDistrictCode || "none"}-${visibleRecords.length}`} data={activeDistrictBoundaries} style={districtStyle} onEachFeature={onEachDistrict} />
            </>
          ) : provinceBoundaries ? (
            <>
              <MapBoundsController boundaries={provinceBoundaries} maxZoom={7.2} />
              <GeoJSON key={`issue-province-${selectedIssue || "all"}-${visibleRecords.length}`} data={provinceBoundaries} style={provinceStyle} onEachFeature={onEachProvince} />
            </>
          ) : null}
        </MapContainer>
        {isBusy ? (
          <div className="health-issue-distribution-map__overlay" role="status">
            <span />
            <p>{districtStatus === "loading" ? "กำลังโหลดขอบเขตอำเภอ..." : "กำลังโหลดแผนที่ประเทศไทย..."}</p>
          </div>
        ) : null}
      </div>
      <div className="health-issue-distribution-map__legend">
        <span><i style={{ background: legendColor }} />{selectedIssue ? "พื้นที่ที่มีประเด็นนี้" : "สีของประเด็นหลักในพื้นที่"}</span>
        <span><i className="is-muted" />ไม่มีข้อมูลประเด็นนี้</span>
        {selectedProvinceCode ? <button type="button" onClick={onClearProvince}>ดูทั้งประเทศ</button> : null}
      </div>
    </div>
  );
}