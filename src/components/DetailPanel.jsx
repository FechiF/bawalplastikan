import { programOptions, ratingLabels } from '../config';
import { formatDate, submissionTitle } from '../utilities';
import { TypeTag } from './SubmissionList';

export default function DetailPanel({ submission: s, onBack }) {
  const programs = s.programs.map((k) => programOptions.find((p) => p.key === k) ?? { key: k, label: k });

  return (
    <article className="bp-detail">
      <button type="button" className="bp-link" onClick={onBack}>← Back to list</button>

      <header>
        <TypeTag type={s.type} />
        <h2>{submissionTitle(s)}</h2>
        <p className="bp-muted">
          {s.lgu.name}, {s.lgu.province} · {s.lgu.region}
        </p>
      </header>

      {s.demo && (
        <p className="bp-note">Demo entry — placeholder content, not a real submission.</p>
      )}

      <dl className="bp-facts">
        <div>
          <dt>Ordinance / policy</dt>
          <dd>{s.ordinance}</dd>
        </div>
        <div>
          <dt>Self-assessment</dt>
          <dd>
            {s.rating} / 5 · {ratingLabels[s.rating - 1]}
          </dd>
        </div>
        {s.createdAt && (
          <div>
            <dt>Submitted</dt>
            <dd>{formatDate(s.createdAt)}</dd>
          </div>
        )}
      </dl>

      <h3>Programs</h3>
      <ul className="bp-chips">
        {programs.map((p) => (
          <li key={p.key} title={p.hint}>{p.label}</li>
        ))}
      </ul>

      <h3>Details</h3>
      <p className="bp-detail__text">{s.details}</p>
    </article>
  );
}
