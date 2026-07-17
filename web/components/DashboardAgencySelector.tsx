"use client";

import type { AgencyOption } from "@/types/mvp";

type DashboardInsightMenuKey = "evaluation" | "group";

type DashboardAgencySelectorProps = {
  agencies: AgencyOption[];
  selectedAgencyCode: string;
  isOverviewActive: boolean;
  isOverviewDisabled?: boolean;
  lockedAgencyCode?: string | null;
  activeInsightTab?: DashboardInsightMenuKey | null;
  onSelectInsight?: (tab: DashboardInsightMenuKey) => void;
  onSelectOverview: () => void;
  onSelectAgency: (agencyCode: string) => void;
};

export default function DashboardAgencySelector({
  agencies,
  selectedAgencyCode,
  isOverviewActive,
  isOverviewDisabled = false,
  lockedAgencyCode = null,
  activeInsightTab = null,
  onSelectInsight,
  onSelectOverview,
  onSelectAgency,
}: DashboardAgencySelectorProps) {
  const selectedValue = selectedAgencyCode || "";

  return (
    <aside className="dashboard-side-menu" aria-label="เลือกมุมมอง Dashboard">
      <button
        type="button"
        className={`dashboard-side-menu__item${isOverviewActive && !activeInsightTab ? " is-active" : ""}`}
        onClick={onSelectOverview}
        disabled={isOverviewDisabled}
      >
        <span>หน้าแรก</span>
        <strong>สรุปภาพรวม</strong>
      </button>

      <label className="dashboard-agency-selector">
        <span>เลือก สคร.</span>
        <select
          value={selectedValue}
          onChange={(event) => {
            const agencyCode = event.target.value;
            if (agencyCode) {
              onSelectAgency(agencyCode);
            } else {
              onSelectOverview();
            }
          }}
        >
          <option value="">เลือก สคร.</option>
          {agencies.map((agency) => (
            <option
              key={agency.code}
              value={agency.code}
              disabled={Boolean(lockedAgencyCode && lockedAgencyCode !== agency.code)}
            >
              {agency.label_th}
            </option>
          ))}
        </select>
      </label>

      <div className="dashboard-side-menu__section" aria-label="เมนูข้อมูลเพิ่มเติม">
        <button
          type="button"
          className={`dashboard-side-menu__item${activeInsightTab === "evaluation" ? " is-active" : ""}`}
          onClick={() => onSelectInsight?.("evaluation")}
        >
          <span>ผลการประเมิน</span>
          <strong>ผลการคัดเกณฑ์ประเด็นโรคและภัยสุขภาพ</strong>
        </button>
        <button
          type="button"
          className={`dashboard-side-menu__item${activeInsightTab === "group" ? " is-active" : ""}`}
          onClick={() => onSelectInsight?.("group")}
        >
          <span>รายการ</span>
          <strong>ดูตามกลุ่มรายการ</strong>
        </button>
      </div>
    </aside>
  );
}