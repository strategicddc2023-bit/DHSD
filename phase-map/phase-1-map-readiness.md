# Phase 1 Map Readiness Audit

Date: 2026-06-02

## Summary

Phase 1 focuses on data readiness before building the 3-level interactive map: health zone -> province -> district.

Current status:

- Master province/district data exists.
- Health-zone to province mapping exists.
- Existing dashboard map used AmCharts CDN and province-level Thailand map before Phase 2.
- Leaflet and React Leaflet are installed for Phase 2.
- Local GeoJSON boundary files are prepared.

## Local Data Inventory

| Item | Location | Status |
| --- | --- | --- |
| Province/district CSV with codes | `web/data/province_district_master_with_codes.csv` | Ready |
| Province count | CSV check | 77 provinces |
| District count | CSV check | 928 districts |
| Province SQL seed | `web/sql/004_seed_all_provinces_districts.sql` | Ready |
| Agency/province full mapping | `web/sql/005_full_agency_province_mapping.sql` | Ready |
| Agency/province mapping count | SQL seed check | 77 province mappings |
| Udon Thani mapping fix | `web/sql/016_fix_udon_thani_agency_mapping.sql` | Ready |
| Existing map component | `web/components/ThailandHealthZoneMap.tsx` | Uses AmCharts, not Leaflet |
| Local GeoJSON boundaries | `web/public/map-boundaries` | Ready |
| Province boundary file | `web/public/map-boundaries/provinces.geojson` | 77 features |
| District boundary files | `web/public/map-boundaries/districts/{province_code}.geojson` | 77 files / 928 features |

## Required Boundary Files

Boundary files are placed here:

```text
web/public/map-boundaries/provinces.geojson
web/public/map-boundaries/districts/{province_code}.geojson
```

Recommended lazy-load pattern:

```text
Open dashboard
  -> load provinces.geojson
Click health zone
  -> filter province polygons by agency_provinces
Click province
  -> load districts/{province_code}.geojson
Click district
  -> query intake_records by district_code
```

## Required GeoJSON Properties

Province feature:

```json
{
  "province_code": "41",
  "province_name": "อุดรธานี"
}
```

District feature:

```json
{
  "district_code": "4101",
  "district_name": "เมืองอุดรธานี",
  "province_code": "41"
}
```

## Database Readiness

Run this SQL in Supabase SQL Editor:

```text
web/sql/017_phase_map_readiness_checks.sql
```

Expected result:

- `master_province_count` = 77
- `master_district_count` = 928
- `agency_province_mapping_count` = 77
- `unmapped_province_count` = 0
- `duplicate_province_mapping_count` = 0

## Phase 1 Decision

We should not replace the current dashboard map yet. The professional path is:

1. Keep `ThailandHealthZoneMap.tsx` in the repo as a fallback reference.
2. Build a new `InteractiveHealthMap.tsx` in Phase 2.
3. Use `map-boundary-service.ts` and `web/public/map-boundaries` as the data contract.
4. Swap the new map into Dashboard during Phase 2, then harden drill-down behavior in Phase 3-4.

## Boundary Source

The boundary files were normalized from `piyayut-ch/mapthai`:

- `th_adm1.geojson` -> `provinces.geojson`
- `th_adm2.geojson` -> `districts/{province_code}.geojson`

The source project describes itself as lightweight polygon data for Thailand administrative levels 1-3 and notes the maps are downloaded from UNOCHA, based on Royal Thai Survey Department data updated 6 November 2019, then simplified using mapshaper.

## Blockers Before Full Phase 2

- Phase 2 can proceed with real province polygons.
- Phase 3 can proceed using province polygons filtered by `agency_provinces`.
- Phase 4 can proceed with lazy-loaded district polygons.
