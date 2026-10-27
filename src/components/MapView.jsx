import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { DEFAULT_STYLE_URL, mapDefaults, programOptions, typeColors, submissionTypes } from '../config';
import { submissionTitle } from '../utilities';

const EMPTY = { type: 'FeatureCollection', features: [] };
const PIN_SVG =
  '<svg viewBox="0 0 28 38" width="28" height="38" aria-hidden="true">' +
  '<path d="M14 1C6.8 1 1 6.8 1 13.9 1 23.6 14 37 14 37s13-13.4 13-23.1C27 6.8 21.2 1 14 1z" fill="var(--pin)" stroke="#fff" stroke-width="2"/>' +
  '<circle cx="14" cy="14" r="4.5" fill="#fff"/></svg>';

const programLabel = (key) => programOptions.find((p) => p.key === key)?.label ?? key;
const typeShort = (key) => submissionTypes.find((t) => t.key === key)?.short ?? key;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text; // textContent: user text is never parsed as HTML
  return node;
}

function popupContent(pin, onOpen) {
  const root = el('div', 'bp-popup');
  root.appendChild(el('div', 'bp-popup__title', submissionTitle(pin)));
  root.appendChild(el('div', 'bp-popup__sub', `${pin.lgu.name}, ${pin.lgu.province}`));

  const meta = el('div', 'bp-popup__meta');
  const tag = el('span', 'bp-tag', typeShort(pin.type));
  tag.style.setProperty('--tag', typeColors[pin.type]);
  meta.appendChild(tag);
  meta.appendChild(el('span', null, `Self-rating ${pin.rating}/5`));
  meta.appendChild(el('span', null, `Ordinance: ${pin.ordinance}`));
  root.appendChild(meta);

  root.appendChild(
    el('p', 'bp-popup__programs', pin.programs.map(programLabel).join(' · '))
  );
  const btn = el('button', 'bp-link', 'Read full details in the side panel →');
  btn.type = 'button';
  btn.addEventListener('click', onOpen);
  root.appendChild(btn);
  return root;
}

export default function MapView({
  pins,
  selectedId,
  onSelect,
  onOpenPanel,
  onBoundsChange,
  highlight,
  focus,
  styleUrl,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const markersRef = useRef(new Map());
  const popupRef = useRef(null);
  const highlightRef = useRef(highlight);
  const callbacks = useRef({});
  callbacks.current = { onSelect, onOpenPanel, onBoundsChange };
  highlightRef.current = highlight;

  // --- create the map once -------------------------------------------------
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl || DEFAULT_STYLE_URL,
      center: mapDefaults.center,
      zoom: mapDefaults.zoom,
      minZoom: mapDefaults.minZoom,
      maxZoom: mapDefaults.maxZoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('lgu-highlight', { type: 'geojson', data: EMPTY });
      map.addLayer({
        id: 'lgu-fill',
        type: 'fill',
        source: 'lgu-highlight',
        paint: { 'fill-color': '#2f7d57', 'fill-opacity': 0.2 },
      });
      map.addLayer({
        id: 'lgu-line',
        type: 'line',
        source: 'lgu-highlight',
        paint: { 'line-color': '#1f5c40', 'line-width': 2 },
      });
      readyRef.current = true;
      const h = highlightRef.current;
      if (h) map.getSource('lgu-highlight').setData({ type: 'FeatureCollection', features: [h] });
      callbacks.current.onBoundsChange(map.getBounds());
    });
    map.on('moveend', () => callbacks.current.onBoundsChange(map.getBounds()));

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- pins ----------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const m of markersRef.current.values()) m.marker.remove();
    markersRef.current.clear();

    for (const pin of pins) {
      const node = el('button', 'bp-pin');
      node.type = 'button';
      node.style.setProperty('--pin', typeColors[pin.type]);
      node.setAttribute('aria-label', `${submissionTitle(pin)}, ${pin.lgu.name}`);
      node.innerHTML = PIN_SVG; // static markup, no user content
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        callbacks.current.onSelect(pin.id);
      });
      const marker = new maplibregl.Marker({ element: node, anchor: 'bottom' })
        .setLngLat(pin.lngLat)
        .addTo(map);
      markersRef.current.set(pin.id, { marker, node, pin });
    }
  }, [pins]);

  // --- selected pin: style, popup, pan --------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const [id, m] of markersRef.current) {
      m.node.classList.toggle('is-selected', id === selectedId);
    }
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    const entry = selectedId && markersRef.current.get(selectedId);
    if (!entry) return;

    const popup = new maplibregl.Popup({ offset: [0, -34], maxWidth: '300px', className: 'bp-popup-wrap' })
      .setLngLat(entry.pin.lngLat)
      .setDOMContent(popupContent(entry.pin, () => callbacks.current.onOpenPanel()))
      .addTo(map);
    popup.on('close', () => {
      if (popupRef.current === popup) {
        popupRef.current = null;
        callbacks.current.onSelect(null);
      }
    });
    popupRef.current = popup;
    map.easeTo({
      center: entry.pin.lngLat,
      zoom: Math.max(map.getZoom(), 8.5),
      duration: 700,
    });
  }, [selectedId, pins]);

  // --- highlighted city/municipality outline --------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map
      .getSource('lgu-highlight')
      ?.setData(highlight ? { type: 'FeatureCollection', features: [highlight] } : EMPTY);
  }, [highlight]);

  // --- fit to a bbox when asked (e.g. picking a city in the form) -----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus?.bbox) return;
    map.fitBounds(focus.bbox, {
      padding: { top: 60, bottom: 60, left: 40, right: 40 },
      maxZoom: 11,
      duration: 900,
    });
  }, [focus]);

  return <div className="bp-map" ref={containerRef} />;
}
