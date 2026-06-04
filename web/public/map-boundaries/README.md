# Map Boundary Files

This folder stores real GeoJSON boundary files for the DHSD interactive map.

Current source:

- `provinces.geojson` is normalized from `piyayut-ch/mapthai/data-raw/geojson/th_adm1.geojson`.
- `districts/{province_code}.geojson` files are normalized from `piyayut-ch/mapthai/data-raw/geojson/th_adm2.geojson`.
- Source project notes state that maps come from UNOCHA / Royal Thai Survey Department update 6 November 2019 and are simplified for data visualization.

Expected structure:

```text
map-boundaries/
  provinces.geojson
  districts/
    10.geojson
    11.geojson
    ...
    41.geojson
```

Province GeoJSON feature properties must include:

```json
{
  "province_code": "41",
  "province_name": "อุดรธานี"
}
```

District GeoJSON feature properties must include:

```json
{
  "district_code": "4101",
  "district_name": "เมืองอุดรธานี",
  "province_code": "41"
}
```

Do not load all district boundaries at once in the browser. Load only `districts/{province_code}.geojson` after a province is selected.

Source files kept for traceability:

```text
provinces.source.geojson
districts.source.geojson
```
