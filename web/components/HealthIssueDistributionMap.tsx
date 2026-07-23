import dynamic from "next/dynamic";

export type HealthIssueDistributionRecord = {
  provinceCode: string;
  districtCode: string;
  districtName: string;
  issue: string;
};

export type HealthIssueDistributionMapProps = {
  selectedIssue?: string;
  issueColor?: string;
  issueColorMap?: Record<string, string>;
  records: HealthIssueDistributionRecord[];
  selectedProvinceCode?: string;
  selectedDistrictCode?: string;
  onSelectProvince?: (provinceCode: string) => void;
  onSelectDistrict?: (districtCode: string) => void;
  onClearProvince?: () => void;
};

const HealthIssueDistributionMapClient = dynamic(() => import("@/components/HealthIssueDistributionMapClient"), {
  ssr: false,
  loading: () => (
    <div className="health-issue-distribution-map__loading">
      <p>กำลังเตรียมแผนที่การกระจายประเด็น...</p>
    </div>
  ),
});

export default function HealthIssueDistributionMap(props: HealthIssueDistributionMapProps) {
  return <HealthIssueDistributionMapClient {...props} />;
}