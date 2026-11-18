"use client";

import DashboardSectionView from "./DashboardSectionView";
import type { DashboardSectionProps, WorkspaceMenuView } from "./dashboard-shared";
import { useDashboardActions } from "./useDashboardActions";
import { useDashboardBase } from "./useDashboardBase";
import { useDashboardInsights } from "./useDashboardInsights";

export type DashboardModel = ReturnType<typeof useDashboardBase> &
  ReturnType<typeof useDashboardInsights> &
  ReturnType<typeof useDashboardActions> & {
    currentUser: DashboardSectionProps["currentUser"];
    isUserLoading: boolean;
    viewMode: NonNullable<DashboardSectionProps["viewMode"]>;
    refreshKey: number;
    activeWorkspaceView: WorkspaceMenuView;
    onSelectWorkspaceView?: DashboardSectionProps["onSelectWorkspaceView"];
    onFormDataChange?: DashboardSectionProps["onFormDataChange"];
    onDataSaved?: DashboardSectionProps["onDataSaved"];
    onLoggedOut?: DashboardSectionProps["onLoggedOut"];
  };

export default function DashboardSectionImpl(props: DashboardSectionProps) {
  const base = useDashboardBase(props);
  const insights = useDashboardInsights(base);
  const actions = useDashboardActions({ ...base, ...insights });
  const model: DashboardModel = {
    ...base,
    ...insights,
    ...actions,
    currentUser: props.currentUser ?? null,
    isUserLoading: Boolean(props.isUserLoading),
    viewMode: props.viewMode ?? "public",
    refreshKey: props.refreshKey,
    activeWorkspaceView: props.activeWorkspaceView ?? "dashboard",
    onSelectWorkspaceView: props.onSelectWorkspaceView,
    onFormDataChange: props.onFormDataChange,
    onDataSaved: props.onDataSaved,
    onLoggedOut: props.onLoggedOut,
  };

  return <DashboardSectionView model={model} />;
}
