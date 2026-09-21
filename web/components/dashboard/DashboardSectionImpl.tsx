"use client";

import DashboardSectionView from "./DashboardSectionView";
import type { DashboardSectionProps } from "./dashboard-shared";
import { useDashboardActions } from "./useDashboardActions";
import { useDashboardBase } from "./useDashboardBase";
import { useDashboardInsights } from "./useDashboardInsights";

export type DashboardModel = ReturnType<typeof useDashboardBase> & ReturnType<typeof useDashboardInsights> & ReturnType<typeof useDashboardActions>;

export default function DashboardSectionImpl(props: DashboardSectionProps) {
  const base = useDashboardBase(props);
  const insights = useDashboardInsights(base);
  const actions = useDashboardActions({ ...base, ...insights });
  const model: DashboardModel = { ...base, ...insights, ...actions };

  return <DashboardSectionView model={model} />;
}
