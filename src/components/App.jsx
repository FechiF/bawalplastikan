import { useCallback, useEffect, useMemo, useState } from 'react';
import { LOCAL_STORAGE_KEY, PAGE_SIZE } from '../config';
import { useAdminData } from '../hooks/useAdminData';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { makeId, offsetForIndex, submissionTitle } from '../utilities';
import DetailPanel from './DetailPanel';
import MapView from './MapView';
import SubmissionForm from './SubmissionForm';
import SubmissionList from './SubmissionList';

const defaultFilters = { query: '', type: 'all', program: 'all', sort: 'newest', onlyOnMap: true };

export default function App({ dataBase, height, submissionsUrl, styleUrl }) {
  const admin = useAdminData(`${dataBase}lgu.geojson`);

  // "Published" submissions (in production: your Google Sheet, exported as JSON)
  const [published, setPublished] = useState([]);
  // Demo-only: entries typed into the form on this page
  const [local, setLocal] = useLocalStorageState([], LOCAL_STORAGE_KEY);

  const [tab, setTab] = useState('browse'); // 'browse' | 'add'
  const [selectedId, setSelectedId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [bounds, setBounds] = useState(null);
  const [focus, setFocus] = useState(null);
  const [previewPcode, setPreviewPcode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(submissionsUrl)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => !cancelled && setPublished(Array.isArray(rows) ? rows : []))
      .catch(() => !cancelled && setPublished([]));
    return () => {
      cancelled = true;
    };
  }, [submissionsUrl]);

  // Join each submission to its city/municipality, place a pin
  const pins = useMemo(() => {
    const joined = [...local, ...published]
      .map((s) => ({ ...s, lgu: admin.byPcode[s.lguPcode] }))
      .filter((s) => s.lgu?.center);
    const counts = {};
    joined.forEach((s) => (counts[s.lguPcode] = (counts[s.lguPcode] ?? 0) + 1));
    const seen = {};
    return joined.map((s) => {
      const i = (seen[s.lguPcode] = (seen[s.lguPcode] ?? -1) + 1);
      const [dx, dy] = offsetForIndex(i, counts[s.lguPcode]);
      return { ...s, lngLat: [s.lgu.center[0] + dx, s.lgu.center[1] + dy] };
    });
  }, [local, published, admin.byPcode]);

  const matching = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return pins.filter((s) => {
      if (filters.type !== 'all' && s.type !== filters.type) return false;
      if (filters.program !== 'all' && !s.programs.includes(filters.program)) return false;
      if (q) {
        const hay = `${s.lgu.name} ${s.lgu.province} ${s.businessName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pins, filters.type, filters.program, filters.query]);

  const onMap = useMemo(
    () => (bounds ? matching.filter((s) => bounds.contains(s.lngLat)) : matching),
    [matching, bounds]
  );

  const listItems = useMemo(() => {
    const base = filters.onlyOnMap ? onMap : matching;
    const sorted = [...base];
    if (filters.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (filters.sort === 'name')
      sorted.sort((a, b) => submissionTitle(a).localeCompare(submissionTitle(b), 'en'));
    else sorted.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return sorted;
  }, [filters.onlyOnMap, filters.sort, onMap, matching]);

  const selected = pins.find((p) => p.id === selectedId) ?? null;
  const highlightLgu = selected?.lgu ?? admin.byPcode[previewPcode] ?? null;

  const handleBoundsChange = useCallback((b) => setBounds(b), []);
  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    setShowDetail(Boolean(id));
    if (id) setTab('browse');
  }, []);
  const updateFilters = (f) => {
    setFilters(f);
    setVisibleCount(PAGE_SIZE);
  };

  function handlePreview(pcode) {
    setPreviewPcode(pcode);
    const lgu = pcode && admin.byPcode[pcode];
    if (lgu) setFocus({ bbox: lgu.bbox, token: Date.now() });
  }

  function handleSubmit(data) {
    const entry = { ...data, id: makeId(), createdAt: Date.now() };
    setLocal([entry, ...local]);
    setPreviewPcode(null);
    setFilters({ ...defaultFilters, onlyOnMap: false });
    setTab('browse');
    setSelectedId(entry.id);
    setShowDetail(true);
  }

  const totalLabel = `${pins.length} initiative${pins.length === 1 ? '' : 's'}`;

  return (
    <div className="bp" style={{ '--bp-height': height }}>
      <aside className="bp-side">
        <header className="bp-head">
          <h2 className="bp-title">Bawal Plastikan</h2>
          <p className="bp-sub">
            Community-driven efforts against single-use plastics · {totalLabel}
          </p>
          <div className="bp-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'browse'}
              className={tab === 'browse' ? 'is-on' : ''}
              onClick={() => {
                setTab('browse');
                setPreviewPcode(null);
              }}
            >
              Browse
            </button>
            <button
              role="tab"
              aria-selected={tab === 'add'}
              className={tab === 'add' ? 'is-on' : ''}
              onClick={() => {
                setTab('add');
                setSelectedId(null);
                setShowDetail(false);
              }}
            >
              Share your initiative
            </button>
          </div>
        </header>

        <div className="bp-body">
          {admin.status === 'loading' && <p className="bp-empty">Loading map data…</p>}
          {admin.status === 'error' && <p className="bp-error">{admin.error}</p>}

          {admin.status === 'ready' && tab === 'add' && (
            <SubmissionForm
              regions={admin.regions}
              onPreview={handlePreview}
              onSubmit={handleSubmit}
              onCancel={() => setTab('browse')}
            />
          )}

          {admin.status === 'ready' && tab === 'browse' && showDetail && selected && (
            <DetailPanel
              submission={selected}
              onBack={() => {
                setShowDetail(false);
                setSelectedId(null);
              }}
            />
          )}

          {admin.status === 'ready' && tab === 'browse' && !(showDetail && selected) && (
            <SubmissionList
              items={listItems}
              total={matching.length}
              onMapOnly={onMap.length}
              filters={filters}
              setFilters={updateFilters}
              onSelect={handleSelect}
              selectedId={selectedId}
              visibleCount={visibleCount}
              onShowMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
            />
          )}
        </div>
      </aside>

      <MapView
        pins={pins}
        selectedId={selectedId}
        onSelect={handleSelect}
        onOpenPanel={() => {
          setTab('browse');
          setShowDetail(true);
        }}
        onBoundsChange={handleBoundsChange}
        highlight={highlightLgu?.feature ?? null}
        focus={focus}
        styleUrl={styleUrl}
      />
    </div>
  );
}
