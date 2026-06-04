export type MapLevel = "health-zone" | "province" | "district";

export type MapBoundaryKind = "province" | "district";

export type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type ProvinceBoundaryProperties = {
  province_code: string;
  province_name: string;
};

export type DistrictBoundaryProperties = {
  district_code: string;
  district_name: string;
  province_code: string;
};

export type MapFeature<TProperties> = {
  type: "Feature";
  properties: TProperties;
  geometry: GeoJsonGeometry;
};

export type MapFeatureCollection<TProperties> = {
  type: "FeatureCollection";
  features: Array<MapFeature<TProperties>>;
};

export type ProvinceBoundaryCollection = MapFeatureCollection<ProvinceBoundaryProperties>;
export type DistrictBoundaryCollection = MapFeatureCollection<DistrictBoundaryProperties>;

export type MapSelection = {
  level: MapLevel;
  agencyCode?: string;
  agencyName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
};

