export type KpiStatus = "good" | "warning" | "critical";
export type TrendDirection = "up" | "down" | "flat" | "none";
export type RiskLevel = "low" | "moderate" | "high";

export function kpiStatusFromPercent(percent: number): KpiStatus {
  if (percent >= 50) return "good";
  if (percent >= 40) return "warning";
  return "critical";
}

export function kpiStatusLabel(status: KpiStatus): string {
  if (status === "good") return "บรรลุ";
  if (status === "warning") return "เฝ้าระวัง";
  return "ต่ำกว่าเป้า";
}

export function kpiStatusTone(status: KpiStatus): string {
  if (status === "good") return "status-badge--good";
  if (status === "warning") return "status-badge--warning";
  return "status-badge--critical";
}

export function trendDirectionFromDelta(delta: number | null): TrendDirection {
  if (delta === null) return "none";
  if (Math.abs(delta) < 0.01) return "flat";
  return delta > 0 ? "up" : "down";
}

export function trendLabel(direction: TrendDirection): string {
  if (direction === "up") return "เพิ่มขึ้น";
  if (direction === "down") return "ลดลง";
  if (direction === "flat") return "คงที่";
  return "ไม่มีข้อมูลปีก่อน";
}

export function forecastPercent(currentPercent: number, delta: number | null): number | null {
  if (delta === null) return null;
  return Number(Math.min(100, Math.max(0, currentPercent + delta)).toFixed(2));
}

export function forecastLabel(percent: number | null): string {
  if (percent === null) return "คาดการณ์ไม่ได้";
  return `คาดปีถัดไป ${percent.toFixed(2)}%`;
}

export function overallRiskFromCounts(counts: { good: number; warning: number; critical: number }): RiskLevel {
  if (counts.critical > 0) return "high";
  if (counts.warning > 0) return "moderate";
  return "low";
}

export function overallRiskLabel(level: RiskLevel): string {
  if (level === "high") return "เสี่ยงสูง";
  if (level === "moderate") return "เฝ้าระวัง";
  return "ปลอดภัย";
}

export function overallRiskTone(level: RiskLevel): string {
  if (level === "high") return "status-badge--critical";
  if (level === "moderate") return "status-badge--warning";
  return "status-badge--good";
}
