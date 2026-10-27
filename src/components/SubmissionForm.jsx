import { useMemo, useState } from 'react';
import { ordinanceOptions, programOptions, ratingLabels, submissionTypes } from '../config';

const initial = {
  type: 'government',
  businessName: '',
  regionPcode: '',
  provincePcode: '',
  lguPcode: '',
  ordinance: '',
  programs: [],
  rating: 0,
  details: '',
};

export default function SubmissionForm({ regions, onPreview, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const provinces = useMemo(
    () => regions.find((r) => r.pcode === form.regionPcode)?.provinces ?? [],
    [regions, form.regionPcode]
  );
  const lgus = useMemo(
    () => provinces.find((p) => p.pcode === form.provincePcode)?.lgus ?? [],
    [provinces, form.provincePcode]
  );

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isBusiness = form.type !== 'government';

  // Each level resets everything below it, just like cascading dropdowns on the real form
  function changeRegion(regionPcode) {
    set({ regionPcode, provincePcode: '', lguPcode: '' });
    onPreview(null);
  }
  function changeProvince(provincePcode) {
    set({ provincePcode, lguPcode: '' });
    onPreview(null);
  }
  function changeLgu(lguPcode) {
    set({ lguPcode });
    onPreview(lguPcode || null);
  }
  function toggleProgram(key) {
    set({
      programs: form.programs.includes(key)
        ? form.programs.filter((k) => k !== key)
        : [...form.programs, key],
    });
  }

  function validate() {
    const e = {};
    if (isBusiness && !form.businessName.trim()) e.businessName = 'Enter the business name.';
    if (!form.regionPcode) e.regionPcode = 'Choose a region.';
    if (!form.provincePcode) e.provincePcode = 'Choose a province.';
    if (!form.lguPcode) e.lguPcode = 'Choose a city or municipality.';
    if (!form.ordinance) e.ordinance = 'Choose one.';
    if (!form.programs.length) e.programs = 'Select at least one program.';
    if (!form.rating) e.rating = 'Give a rating.';
    if (!form.details.trim()) e.details = 'Tell us a bit about the efforts.';
    return e;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      type: form.type,
      businessName: isBusiness ? form.businessName.trim() : '',
      lguPcode: form.lguPcode,
      ordinance: form.ordinance,
      programs: form.programs,
      rating: form.rating,
      details: form.details.trim(),
    });
    setForm(initial);
    setErrors({});
  }

  const err = (k) => errors[k] && <p className="bp-error" role="alert">{errors[k]}</p>;

  return (
    <form className="bp-form" onSubmit={handleSubmit} noValidate>
      <p className="bp-note">
        <strong>Demo form.</strong> The live form also asks for your name, email, supporting
        documents and consent. Entries added here stay in this browser only.
      </p>

      <fieldset className="bp-field">
        <legend>Submission type</legend>
        {submissionTypes.map((t) => (
          <label key={t.key} className="bp-check">
            <input
              type="radio"
              name="bp-type"
              checked={form.type === t.key}
              onChange={() => set({ type: t.key })}
            />
            {t.label}
          </label>
        ))}
      </fieldset>

      {isBusiness && (
        <div className="bp-field">
          <label htmlFor="bp-business">Business name</label>
          <input
            id="bp-business"
            type="text"
            value={form.businessName}
            onChange={(e) => set({ businessName: e.target.value })}
          />
          {err('businessName')}
        </div>
      )}

      <p className="bp-hint">
        {isBusiness ? 'Location of the business' : 'Location of the city or municipality'}
      </p>

      <div className="bp-field">
        <label htmlFor="bp-region">Region</label>
        <select id="bp-region" value={form.regionPcode} onChange={(e) => changeRegion(e.target.value)}>
          <option value="">Select region…</option>
          {regions.map((r) => (
            <option key={r.pcode} value={r.pcode}>{r.name}</option>
          ))}
        </select>
        {err('regionPcode')}
      </div>

      <div className="bp-field">
        <label htmlFor="bp-province">Province</label>
        <select
          id="bp-province"
          value={form.provincePcode}
          onChange={(e) => changeProvince(e.target.value)}
          disabled={!form.regionPcode}
        >
          <option value="">Select province…</option>
          {provinces.map((p) => (
            <option key={p.pcode} value={p.pcode}>{p.name}</option>
          ))}
        </select>
        {err('provincePcode')}
      </div>

      <div className="bp-field">
        <label htmlFor="bp-lgu">City / municipality</label>
        <select
          id="bp-lgu"
          value={form.lguPcode}
          onChange={(e) => changeLgu(e.target.value)}
          disabled={!form.provincePcode}
        >
          <option value="">Select city or municipality…</option>
          {lgus.map((l) => (
            <option key={l.pcode} value={l.pcode}>{l.name}</option>
          ))}
        </select>
        {err('lguPcode')}
      </div>

      <fieldset className="bp-field">
        <legend>
          Does your {isBusiness ? 'business' : 'city/municipality'} have an ordinance or policy
          regulating single-use plastics?
        </legend>
        <div className="bp-inline">
          {ordinanceOptions.map((o) => (
            <label key={o} className="bp-check">
              <input
                type="radio"
                name="bp-ordinance"
                checked={form.ordinance === o}
                onChange={() => set({ ordinance: o })}
              />
              {o}
            </label>
          ))}
        </div>
        {err('ordinance')}
      </fieldset>

      <fieldset className="bp-field">
        <legend>Programs on single-use plastics</legend>
        {programOptions.map((p) => (
          <label key={p.key} className="bp-check">
            <input
              type="checkbox"
              checked={form.programs.includes(p.key)}
              onChange={() => toggleProgram(p.key)}
            />
            <span>
              {p.label} <span className="bp-muted">({p.hint})</span>
            </span>
          </label>
        ))}
        {err('programs')}
      </fieldset>

      <fieldset className="bp-field">
        <legend>How would you assess your initiatives?</legend>
        <div className="bp-rating">
          {ratingLabels.map((label, i) => (
            <label key={label} className={`bp-rating__opt${form.rating === i + 1 ? ' is-on' : ''}`}>
              <input
                type="radio"
                name="bp-rating"
                checked={form.rating === i + 1}
                onChange={() => set({ rating: i + 1 })}
              />
              <span>{i + 1}</span>
              <small>{label}</small>
            </label>
          ))}
        </div>
        {err('rating')}
      </fieldset>

      <div className="bp-field">
        <label htmlFor="bp-details">Share details of your efforts</label>
        <textarea
          id="bp-details"
          rows={5}
          value={form.details}
          onChange={(e) => set({ details: e.target.value })}
        />
        {err('details')}
      </div>

      <div className="bp-actions">
        <button type="submit" className="bp-btn bp-btn--primary">Add to map</button>
        <button
          type="button"
          className="bp-btn"
          onClick={() => {
            onPreview(null);
            onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
