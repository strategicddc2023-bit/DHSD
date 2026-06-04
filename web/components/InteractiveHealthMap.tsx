"use client";

import dynamic from "next/dynamic";
import type { AccessScope } from "@/services/access-control";
import type { AgencyCoverageRow, AgencyProvinceMapRow, ProvinceCoverageRow } from "@/types/mvp";

export type InteractiveHealthMapProps = {
  coverage: AgencyCoverageRow[];
  provinceCoverage: ProvinceCoverageRow[];
  agencyProvinceMap: AgencyProvinceMapRow[];
  selectedAgencyCode?: string;
  onSelectAgency?: (agencyCode: string) => void;
  accessScope?: AccessScope;
  onSelectDistrictForIntake?: (selection: { agencyCode: string; provinceCode: string; districtCode: string }) => void;
};

const InteractiveHealthMapClient = dynamic(() => import("@/components/InteractiveHealthMapClient"), {
  ssr: false,
  loading: () => (
    <div className="interactive-map__loading">
      <p>กำลังเตรียมแผนที่เขตสุขภาพ...</p>
    </div>
  ),
});

export default function InteractiveHealthMap(props: InteractiveHealthMapProps) {
  return <InteractiveHealthMapClient {...props} />;
}
