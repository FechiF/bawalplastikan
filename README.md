# Bawal Plastikan – map demo

Refactor of the Epicenter earthquake app into an interactive map of community
initiatives against single-use plastics (Climate Reality Project Philippines).

- **MapLibre GL** map (OpenFreeMap "positron" basemap, no API key), light green theme
- Pins at the city/municipality centroid → popup **and** side-panel details
- Simplified intake form with **Region → Province → City/Municipality** dropdowns
  built from your PSGC/NAMRIA GeoJSONs; the chosen LGU is outlined on the map
- Search, type/program filters, sort, "only list initiatives shown on the map" (kept from Epicenter)
- Builds to one script + one stylesheet; all CSS is scoped under `.bp`

## Run it

```bash
npm install
npm run dev        # demo page at http://localhost:5173
npm run build      # -> dist/bawal-plastikan.js, .css, data/
```

## Using your real geojsons

1. Put every city/municipality file in `data-src/` (municipalities, component
   cities, **highly urbanized cities and NCR cities** – see note below). Region,
   province and barangay files in the same folder are ignored.
2. `npm run prepare-data` → writes a slim `public/data/lgu.geojson`
   (coordinates rounded to 4 decimals, only the fields the app uses).
3. `npm run build`.

> The municipality file's metadata shows `huc_map: 0`, so it likely excludes
> highly urbanized cities and NCR cities (Las Piñas, Quezon City, Manila, Cebu
> City, Davao City…). Add a file with those polygons (ADM3_PCODE + ADM3_EN) to
> `data-src/` or they won't appear in the dropdowns.

## Embedding in WordPress

Upload `dist/bawal-plastikan.js`, `dist/bawal-plastikan.css` and the `dist/data/`
folder to one folder, e.g. `/wp-content/uploads/bawal-plastikan/`. Then in a
**Custom HTML** block:

```html
<link rel="stylesheet" href="/wp-content/uploads/bawal-plastikan/bawal-plastikan.css">
<div data-bawal-plastikan data-height="720px"></div>
<script src="/wp-content/uploads/bawal-plastikan/bawal-plastikan.js"></script>
```

Data is looked up in `data/` next to the script. Optional attributes:
`data-data-base`, `data-submissions-url`, `data-style-url`, `data-height`.
You can also call `BawalPlastikan.mount(element, options)` yourself.

If the theme or a security plugin blocks `.js`/`.json` in uploads, host the
`dist` folder on any static host (Netlify, Cloudflare Pages, GitHub Pages) and
point the tags/`data-data-base` there, or iframe the hosted `index.html`.

## Data flow in production (not built yet)

The demo keeps form entries in the visitor's browser only (`localStorage`) and
shows `public/data/submissions.json` as "published" entries (all marked demo).
For the real thing:

1. Real intake = the Google Form → its linked Google Sheet.
2. Add a `lguPcode` column (hidden dropdown in the form, or a lookup from the
   region/province/city answers).
3. Publish the sheet as JSON (Apps Script web app, or a nightly export) and set
   `data-submissions-url` to it. Non-developers then maintain the map by editing the sheet.

Each submission row: `id, type, businessName, lguPcode, ordinance, programs[], rating, details, createdAt`.

## Known simplifications

- Dropped from the form: email, pronouns, name, file uploads, consent checkboxes.
- Pins sit at a polygon centroid (can fall outside very concave areas); several
  entries in one LGU fan out in a small circle.
- Bundle is ~1.2 MB (340 kB gzipped), mostly MapLibre.
