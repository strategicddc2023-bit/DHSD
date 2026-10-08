export const FISCAL_YEARS = [2567, 2568, 2569, 2570, 2571, 2572, 2573, 2574] as const;
export type FiscalYearFilter = number | "all";

export function getThaiFiscalYear(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const gregorianYear = Number(parts.find((part) => part.type === "year")?.value ?? date.getUTCFullYear());
  const month = Number(parts.find((part) => part.type === "month")?.value ?? date.getUTCMonth() + 1);

  return gregorianYear + 543 + (month >= 10 ? 1 : 0);
}

export function getDefaultFiscalYear(date = new Date()) {
  const currentFiscalYear = getThaiFiscalYear(date);
  const firstFiscalYear = FISCAL_YEARS[0];
  const lastFiscalYear = FISCAL_YEARS[FISCAL_YEARS.length - 1];
  return Math.min(lastFiscalYear, Math.max(firstFiscalYear, currentFiscalYear));
}

export function isSupportedFiscalYear(value: number) {
  return FISCAL_YEARS.includes(value as (typeof FISCAL_YEARS)[number]);
}
