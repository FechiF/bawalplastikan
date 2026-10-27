import { programOptions, sortOptions, submissionTypes, typeColors, PAGE_SIZE } from '../config';
import { formatDate, submissionTitle } from '../utilities';

function Stars({ value }) {
  return (
    <span className="bp-stars" role="img" aria-label={`Self-rating ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? 'is-on' : ''}>●</span>
      ))}
    </span>
  );
}

export function TypeTag({ type }) {
  const t = submissionTypes.find((x) => x.key === type);
  return (
    <span className="bp-tag" style={{ '--tag': typeColors[type] }}>
      {t?.short ?? type}
    </span>
  );
}

export default function SubmissionList({
  items,
  total,
  onMapOnly,
  filters,
  setFilters,
  onSelect,
  selectedId,
  visibleCount,
  onShowMore,
}) {
  const shown = items.slice(0, visibleCount);

  return (
    <div className="bp-list">
      <div className="bp-filters">
        <input
          type="search"
          placeholder="Search city, province or business"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          aria-label="Search submissions"
        />
        <div className="bp-filters__row">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            aria-label="Filter by submission type"
          >
            <option value="all">All types</option>
            {submissionTypes.map((t) => (
              <option key={t.key} value={t.key}>{t.short}</option>
            ))}
          </select>
          <select
            value={filters.program}
            onChange={(e) => setFilters({ ...filters, program: e.target.value })}
            aria-label="Filter by program"
          >
            <option value="all">All programs</option>
            {programOptions.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            aria-label="Sort"
          >
            {sortOptions.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
        <label className="bp-check bp-check--small">
          <input
            type="checkbox"
            checked={filters.onlyOnMap}
            onChange={(e) => setFilters({ ...filters, onlyOnMap: e.target.checked })}
          />
          Only list initiatives shown on the map
        </label>
      </div>

      <p className="bp-count">
        {filters.onlyOnMap && <span className="is-active">On map: {onMapOnly.toLocaleString()} · </span>}
        Total: {total.toLocaleString()}
      </p>

      {shown.length === 0 ? (
        <p className="bp-empty">No initiatives match. Zoom the map out or clear the filters.</p>
      ) : (
        <ul className="bp-cards">
          {shown.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={`bp-card${s.id === selectedId ? ' is-selected' : ''}`}
                style={{ '--tag': typeColors[s.type] }}
                onClick={() => onSelect(s.id)}
              >
                <span className="bp-card__top">
                  <strong>{submissionTitle(s)}</strong>
                  <Stars value={s.rating} />
                </span>
                <span className="bp-card__place">
                  {s.type !== 'government' && s.businessName ? `${s.lgu.name}, ` : ''}
                  {s.type === 'government' ? s.lgu.province : s.lgu.province}
                </span>
                <span className="bp-card__meta">
                  <TypeTag type={s.type} />
                  <span>{s.programs.length} program{s.programs.length === 1 ? '' : 's'}</span>
                  <span>{formatDate(s.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > visibleCount && (
        <button type="button" className="bp-btn bp-btn--block" onClick={onShowMore}>
          Show {Math.min(PAGE_SIZE, items.length - visibleCount)} more
        </button>
      )}
    </div>
  );
}
