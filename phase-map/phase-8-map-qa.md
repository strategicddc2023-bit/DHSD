# Phase 8 Map QA And Smoke Test

Date: 2026-06-02

## Goal

Verify that the interactive map is production-ready enough for the current phase:

```text
13 health zones -> provinces in selected health zone -> districts in selected province -> district health issue panel
```

## Automated Checks

Run locally:

```powershell
cd web
npx tsc --noEmit
```

Expected:

- TypeScript exits with code `0`.

Run in Supabase SQL Editor:

```text
web/sql/018_phase_map_smoke_test.sql
```

Expected:

- `master_province_count = 77`
- `master_district_count = 928`
- `agency_province_mapping_count = 77`
- `unmapped_province_count = 0`
- `duplicate_province_mapping_count = 0`
- `province_code = 41` maps to `DPC08`
- `district_code = 4101` exists for `อุดรธานี`

## Web Smoke Page

Open as superadmin:

```text
/smoke-test
```

Check panels:

- `Access Smoke Test`
- `Map Smoke Test`

Expected `Map Smoke Test` checks:

- Master provinces: pass
- Master districts: pass
- Agency mapping: pass
- Province boundary: pass
- District boundaries: pass
- สคร.8 -> อุดรธานี: pass

## Manual Click Flow

Use Dashboard:

```text
1. Open dashboard.
2. See Thailand map grouped by 13 health zones.
3. Click สคร.8.
4. Map should zoom/filter to provinces in สคร.8.
5. Click อุดรธานี.
6. Map should load district polygons for province code 41.
7. Click เมืองอุดรธานี.
8. Detail panel should show:
   - selected district
   - current role/scope
   - health issue count
   - latest health issue records or empty state
9. If logged in with allowed scope, button `กรอกข้อมูลอำเภอนี้` should appear.
10. Button should fill agency/province/district in the intake form.
```

## Role Expectations

| Role | Expected map behavior |
| --- | --- |
| `superadmin` | Can see all health zones, all provinces, all districts, and can submit for any agency. |
| `admin` | Sees scoped area from `AccessScope`; submit button only appears for own agency. |
| `user` | Sees scoped area from `AccessScope`; submit button only appears for own agency. |
| guest/public | Can view public dashboard data, cannot submit. |

## Performance Notes

- Province boundary file: one file, 77 features.
- District boundary files: 77 lazy-loaded files, 928 total features.
- District polygons are loaded only after a province is selected.
- Existing source files are retained for traceability:
  - `provinces.source.geojson`
  - `districts.source.geojson`

## Residual Risks

- Tile loading depends on OpenStreetMap network availability.
- Browser-level visual testing still needs manual verification after each major UI change.
- Real production RLS should still be verified with logged-in users, not only client-side controls.

