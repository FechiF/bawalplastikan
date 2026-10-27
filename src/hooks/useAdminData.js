import { useEffect, useState } from 'react';
import { geometryBBox, geometryCenter } from '../utilities';

/**
 * Loads lgu.geojson (municipalities + cities, made by scripts/prepare-data.mjs)
 * and builds the Region -> Province -> City/Municipality tree that drives the
 * form dropdowns, plus a pcode lookup that drives the map.
 */
function buildIndex(features) {
  const byPcode = {};
  const regionMap = new Map();

  for (const feature of features) {
    const p = feature.properties;
    const lgu = {
      pcode: p.pcode,
      name: p.name,
      kind: p.kind,
      province: p.province,
      provincePcode: p.provincePcode,
      region: p.region,
      regionPcode: p.regionPcode,
      center: geometryCenter(feature.geometry),
      bbox: geometryBBox(feature.geometry),
      feature,
    };
    byPcode[lgu.pcode] = lgu;

    if (!regionMap.has(lgu.regionPcode)) {
      regionMap.set(lgu.regionPcode, {
        pcode: lgu.regionPcode,
        name: lgu.region,
        provinces: new Map(),
      });
    }
    const region = regionMap.get(lgu.regionPcode);
    if (!region.provinces.has(lgu.provincePcode)) {
      region.provinces.set(lgu.provincePcode, {
        pcode: lgu.provincePcode,
        name: lgu.province,
        lgus: [],
      });
    }
    region.provinces.get(lgu.provincePcode).lgus.push(lgu);
  }

  const byName = (a, b) => a.name.localeCompare(b.name, 'en');
  const regions = [...regionMap.values()]
    .sort((a, b) => a.pcode.localeCompare(b.pcode))
    .map((r) => ({
      ...r,
      provinces: [...r.provinces.values()].sort(byName).map((pr) => ({
        ...pr,
        lgus: pr.lgus.sort(byName),
      })),
    }));

  return { byPcode, regions };
}

export function useAdminData(url) {
  const [state, setState] = useState({
    status: 'loading',
    regions: [],
    byPcode: {},
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
        const geojson = await res.json();
        const built = buildIndex(geojson.features);
        if (!cancelled) setState({ status: 'ready', error: null, ...built });
      } catch (err) {
        if (!cancelled) {
          setState({ status: 'error', regions: [], byPcode: {}, error: err.message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return state;
}
