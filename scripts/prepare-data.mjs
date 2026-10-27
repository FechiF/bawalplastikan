// Merge PSGC/NAMRIA municipality + city GeoJSONs into one slim file for the app.
//
//   node scripts/prepare-data.mjs [inDir=data-src] [outFile=public/data/lgu.geojson]
//
// Drop every file that contains city/municipality polygons into inDir
// (municipalities, component cities, highly urbanized cities, NCR cities...).
// Any feature with an ADM3_PCODE and no ADM4_PCODE is kept; regions, provinces
// and barangay files in the same folder are ignored automatically.
// Coordinates are rounded to 4 decimals (~11 m) to keep the file small.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [inDir = 'data-src', outFile = 'public/data/lgu.geojson'] = process.argv.slice(2);

const round = (n) => Math.round(n * 1e4) / 1e4;

function roundRing(ring) {
  const out = [];
  for (const [x, y] of ring) {
    const pt = [round(x), round(y)];
    const last = out[out.length - 1];
    if (!last || last[0] !== pt[0] || last[1] !== pt[1]) out.push(pt);
  }
  return out.length >= 4 ? out : null;
}

function roundPolygon(rings) {
  const out = rings.map(roundRing).filter(Boolean);
  return out.length ? out : null;
}

function slimGeometry(geometry) {
  if (geometry.type === 'Polygon') {
    const coords = roundPolygon(geometry.coordinates);
    return coords && { type: 'Polygon', coordinates: coords };
  }
  if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates.map(roundPolygon).filter(Boolean);
    return polys.length ? { type: 'MultiPolygon', coordinates: polys } : null;
  }
  return null;
}

const files = readdirSync(inDir).filter((f) => /\.(geo)?json$/i.test(f));
const byPcode = new Map();
let skipped = 0;

for (const file of files) {
  const data = JSON.parse(readFileSync(join(inDir, file), 'utf8'));
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    if (!p.ADM3_PCODE || p.ADM4_PCODE) {
      skipped++;
      continue;
    }
    const geometry = f.geometry && slimGeometry(f.geometry);
    if (!geometry) continue;
    byPcode.set(p.ADM3_PCODE, {
      type: 'Feature',
      properties: {
        pcode: p.ADM3_PCODE,
        name: p.ADM3_EN,
        kind: p.psgc_type ?? 'municipality',
        province: p.ADM2_EN ?? p.ADM1_EN,
        provincePcode: p.ADM2_PCODE ?? p.ADM1_PCODE,
        region: p.ADM1_EN,
        regionPcode: p.ADM1_PCODE,
      },
      geometry,
    });
  }
}

const features = [...byPcode.values()];
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ type: 'FeatureCollection', features }));
console.log(
  `${files.length} file(s) read, ${features.length} cities/municipalities written to ${outFile} ` +
    `(${skipped} non-city features ignored)`
);
