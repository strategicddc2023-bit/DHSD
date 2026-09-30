type AgencyLabelSource = {
  code: string;
  label_th: string;
};

export function getAgencyDisplayLabel(
  agencyCode: string | null | undefined,
  storedLabel?: string | null
): string {
  if (agencyCode === "DPC13" || storedLabel?.replace(/\s/g, "") === "สคร.13") {
    return "กทม";
  }

  return storedLabel?.trim() || agencyCode || "-";
}

export function withAgencyDisplayLabel<T extends AgencyLabelSource>(agency: T): T {
  return {
    ...agency,
    label_th: getAgencyDisplayLabel(agency.code, agency.label_th),
  };
}
