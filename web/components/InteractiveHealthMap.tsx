import { forwardRef } from "react";
import dynamic from "next/dynamic";
import type { AccessScope } from "@/services/access-control";
import type { AgencyCoverageRow, AgencyProvinceMapRow, ProvinceCoverageRow } from "@/types/mvp";

export type InteractiveHealthMapProps = {
  coverage: AgencyCoverageRow[];
  provinceCoverage: ProvinceCoverageRow[];
  agencyProvinceMap: AgencyProvinceMapRow[];
  selectedAgencyCode?: string;
  selectedProvinceFromChart?: string;
  selectedDistrictFromMap?: string;
  selectedSubdistrictFromMap?: string;
  onSelectAgency?: (agencyCode: string) => void;
  onSelectProvince?: (provinceCode: string) => void;
  onSelectDistrict?: (districtCode: string) => void;
  onSelectSubdistrict?: (subdistrictCode: string) => void;
  accessScope?: AccessScope;
  onSelectDistrictForIntake?: (selection: { agencyCode: string; provinceCode: string; districtCode: string }) => void;
  forwardedRef?: any;
};

const InteractiveHealthMapClient = dynamic(() => import("@/components/InteractiveHealthMapClient"), {
  ssr: false,
  loading: () => (
    <div className="interactive-map__loading">
      <p>กำลังเตรียมแผนที่เขตสุขภาพ...</p>
    </div>
  ),
});

const InteractiveHealthMap = forwardRef<any, InteractiveHealthMapProps>((props, ref) => {
  return <InteractiveHealthMapClient {...props} forwardedRef={ref} />;
});

InteractiveHealthMap.displayName = "InteractiveHealthMap";

export default InteractiveHealthMap;
