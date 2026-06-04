export type ReadinessSeverity = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  key: string;
  label: string;
  detail: string;
  severity: ReadinessSeverity;
};

export function readinessTone(severity: ReadinessSeverity): string {
  if (severity === "pass") return "status-badge--good";
  if (severity === "warn") return "status-badge--warning";
  return "status-badge--critical";
}

export function readinessLabel(severity: ReadinessSeverity): string {
  if (severity === "pass") return "ผ่าน";
  if (severity === "warn") return "เตือน";
  return "ไม่ผ่าน";
}

