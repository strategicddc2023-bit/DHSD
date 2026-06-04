export type KpiCode = "KPI1" | "KPI2" | "KPI3";

export type KpiPreviewRow = {
  kpiCode: KpiCode;
  kpiLabel: string;
  numerator: number;
  denominator: number;
  percentValue: number;
  scoreValue: number;
};

export type KpiFormDraft = {
  totalIssueCount: string;
  analyzedDistrictCount: string;
  pchoActionDistrictCount: string;
  evidenceIssueCount: string;
};

export type KpiValidationResult =
  | { ok: true; values: { totalIssueCount: number; analyzedDistrictCount: number; pchoActionDistrictCount: number; evidenceIssueCount: number } }
  | { ok: false; message: string };

export function scoreFromPercent(percent: number): 0.1 | 0.2 | 0.3 | 0.4 | 0.5 {
  if (percent <= 30) return 0.1;
  if (percent < 40) return 0.2;
  if (percent < 45) return 0.3;
  if (percent < 50) return 0.4;
  return 0.5;
}

export function safePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Number(((numerator * 100.0) / denominator).toFixed(2));
}

function parseNonNegativeInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number.parseInt(value, 10);
}

export function validateKpiDraft(form: KpiFormDraft): KpiValidationResult {
  const totalIssueCount = parseNonNegativeInteger(form.totalIssueCount);
  const analyzedDistrictCount = parseNonNegativeInteger(form.analyzedDistrictCount);
  const pchoActionDistrictCount = parseNonNegativeInteger(form.pchoActionDistrictCount);
  const evidenceIssueCount = parseNonNegativeInteger(form.evidenceIssueCount);

  if (
    totalIssueCount === null ||
    analyzedDistrictCount === null ||
    pchoActionDistrictCount === null ||
    evidenceIssueCount === null
  ) {
    return { ok: false, message: "กรุณากรอกตัวเลขจำนวนเต็มไม่ติดลบให้ครบทุกช่อง" };
  }

  if (analyzedDistrictCount > totalIssueCount) {
    return { ok: false, message: "จำนวนอำเภอที่มีผลวิเคราะห์ ต้องไม่มากกว่าจำนวนประเด็นโรคทั้งหมด" };
  }

  if (pchoActionDistrictCount > totalIssueCount) {
    return { ok: false, message: "จำนวนอำเภอที่ดำเนินงานผ่าน พชอ. ต้องไม่มากกว่าจำนวนประเด็นโรคทั้งหมด" };
  }

  if (evidenceIssueCount > totalIssueCount) {
    return { ok: false, message: "จำนวนประเด็นที่มีผลลัพธ์เชิงประจักษ์ ต้องไม่มากกว่าจำนวนประเด็นโรคทั้งหมด" };
  }

  return {
    ok: true,
    values: {
      totalIssueCount,
      analyzedDistrictCount,
      pchoActionDistrictCount,
      evidenceIssueCount,
    },
  };
}

export function buildKpiPreview(values: {
  totalIssueCount: number;
  analyzedDistrictCount: number;
  pchoActionDistrictCount: number;
  evidenceIssueCount: number;
}): KpiPreviewRow[] {
  const denominator = Math.max(0, values.totalIssueCount);

  const rows: Array<Omit<KpiPreviewRow, "percentValue" | "scoreValue">> = [
    {
      kpiCode: "KPI1",
      kpiLabel: "ร้อยละอำเภอที่มีการวิเคราะห์ปัจจัยเสี่ยง",
      numerator: Math.max(0, values.analyzedDistrictCount),
      denominator,
    },
    {
      kpiCode: "KPI2",
      kpiLabel: "ร้อยละอำเภอที่ดำเนินงานผ่านกลไก พชอ.",
      numerator: Math.max(0, values.pchoActionDistrictCount),
      denominator,
    },
    {
      kpiCode: "KPI3",
      kpiLabel: "ร้อยละอำเภอที่มีผลลัพธ์เชิงประจักษ์",
      numerator: Math.max(0, values.evidenceIssueCount),
      denominator,
    },
  ];

  return rows.map((row) => {
    const percentValue = safePercent(row.numerator, row.denominator);
    return {
      ...row,
      percentValue,
      scoreValue: scoreFromPercent(percentValue),
    };
  });
}
