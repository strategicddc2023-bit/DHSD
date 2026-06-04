import type {
  DistrictBoundaryCollection,
  DistrictBoundaryProperties,
  MapFeatureCollection,
  ProvinceBoundaryCollection,
  ProvinceBoundaryProperties,
} from "@/types/map";

const boundaryBasePath = "/map-boundaries";

async function fetchGeoJson<TProperties>(path: string): Promise<MapFeatureCollection<TProperties>> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Map boundary file not found: ${path}`);
  }

  return (await response.json()) as MapFeatureCollection<TProperties>;
}

export async function loadProvinceBoundaries(): Promise<ProvinceBoundaryCollection> {
  return fetchGeoJson<ProvinceBoundaryProperties>(`${boundaryBasePath}/provinces.geojson`);
}

export async function loadDistrictBoundaries(provinceCode: string): Promise<DistrictBoundaryCollection> {
  return fetchGeoJson<DistrictBoundaryProperties>(`${boundaryBasePath}/districts/${provinceCode}.geojson`);
}

export function getProvinceFeatureCode(feature: { properties: Partial<ProvinceBoundaryProperties> }): string {
  return feature.properties.province_code ?? "";
}

export function getDistrictFeatureCode(feature: { properties: Partial<DistrictBoundaryProperties> }): string {
  return feature.properties.district_code ?? "";
}

