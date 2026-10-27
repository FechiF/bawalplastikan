// ---- geometry helpers (GeoJSON, [lng, lat]) -------------------------------

function polygonsOf(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return a / 2;
}

function ringCentroid(ring) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[j];
    const [x2, y2] = ring[i];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-12) return ring[0];
  return [cx / (3 * a), cy / (3 * a)];
}

/** Centroid of the largest polygon part, as [lng, lat]. */
export function geometryCenter(geometry) {
  const polys = polygonsOf(geometry);
  if (!polys.length) return null;
  let best = polys[0];
  let bestArea = Math.abs(ringArea(best[0]));
  for (const p of polys) {
    const a = Math.abs(ringArea(p[0]));
    if (a > bestArea) {
      best = p;
      bestArea = a;
    }
  }
  return ringCentroid(best[0]);
}

/** [west, south, east, north] */
export function geometryBBox(geometry) {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const poly of polygonsOf(geometry)) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < w) w = x;
        if (x > e) e = x;
        if (y < s) s = y;
        if (y > n) n = y;
      }
    }
  }
  return [w, s, e, n];
}

/**
 * Several submissions can share one city/municipality. Fan their pins out in a
 * small circle around the centroid so none are hidden.
 */
export function offsetForIndex(index, count, radius = 0.012) {
  if (count <= 1) return [0, 0];
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

// ---- misc ------------------------------------------------------------------

export function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function makeId() {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Stable display title for a submission. */
export function submissionTitle(s) {
  return s.type === 'government' || !s.businessName ? s.lgu.name : s.businessName;
}
