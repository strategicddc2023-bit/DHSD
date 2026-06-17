import { supabase } from "@/services/supabase-client";

export type DistrictHealthIssueRecord = {
  id: string;
  created_at: string;
  health_issue_text: string;
  agency_code: string;
  province_code: string;
  district_code: string;
  master_agencies: { label_th: string }[] | null;
};

export type DistrictHealthIssueSummary = {
  districtCode: string;
  totalCount: number;
  issues: Array<{ issue: string; count: number }>;
  latestRecords: DistrictHealthIssueRecord[];
};

export async function loadDistrictHealthIssueSummary(districtCode: string): Promise<DistrictHealthIssueSummary> {
  const [{ count }, { data }] = await Promise.all([
    supabase.from("intake_records").select("*", { count: "exact", head: true }).eq("district_code", districtCode),
    supabase
      .from("intake_records")
      .select("id,created_at,health_issue_text,agency_code,province_code,district_code,master_agencies(label_th)")
      .eq("district_code", districtCode)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const latestRecords = (data as DistrictHealthIssueRecord[] | null) ?? [];
  const issueCounts = latestRecords.reduce((acc, record) => {
    const issue = record.health_issue_text?.trim() || "ไม่ระบุ";
    acc.set(issue, (acc.get(issue) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return {
    districtCode,
    totalCount: count ?? 0,
    issues: [...issueCounts.entries()]
      .map(([issue, issueCount]) => ({ issue, count: issueCount }))
      .sort((a, b) => b.count - a.count || a.issue.localeCompare(b.issue, "th")),
    latestRecords,
  };
}

export async function loadSubdistrictHealthIssueSummary(subdistrictCode: string): Promise<DistrictHealthIssueSummary> {
  const [{ count }, { data }] = await Promise.all([
    supabase.from("intake_records").select("*", { count: "exact", head: true }).eq("subdistrict_code", subdistrictCode),
    supabase
      .from("intake_records")
      .select("id,created_at,health_issue_text,agency_code,province_code,district_code,master_agencies(label_th)")
      .eq("subdistrict_code", subdistrictCode)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const latestRecords = (data as DistrictHealthIssueRecord[] | null) ?? [];
  const issueCounts = latestRecords.reduce((acc, record) => {
    const issue = record.health_issue_text?.trim() || "ไม่ระบุ";
    acc.set(issue, (acc.get(issue) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return {
    districtCode: subdistrictCode,
    totalCount: count ?? 0,
    issues: [...issueCounts.entries()]
      .map(([issue, issueCount]) => ({ issue, count: issueCount }))
      .sort((a, b) => b.count - a.count || a.issue.localeCompare(b.issue, "th")),
    latestRecords,
  };
}


