import { format } from 'date-fns';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingSpinner from '../../elements/LoadingSpinner.jsx';

const DASH = '—';

const STATUS_BADGES = [
  { key: 'success', variant: 'success' },
  { key: 'failed', variant: 'warning' },
  { key: 'dead', variant: 'dark' },
];

const formatTime = (timestamp) => {
  if (!timestamp) return DASH;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

const renderEmitStatus = (breakdown) => {
  const visible = STATUS_BADGES.filter((badge) => breakdown[badge.key] > 0);
  if (visible.length === 0) return <span className="text-muted">{DASH}</span>;

  return (
    <div className="d-flex gap-1">
      {visible.map((badge) => (
        <span key={badge.key} className={`badge text-bg-${badge.variant}`}>
          {badge.key}: {breakdown[badge.key]}
        </span>
      ))}
    </div>
  );
};

const renderEmitsSent = (row) => (
  <span>
    {row.emitsSent} of {row.itemCount} items emitted
    {row.partial && (
      <span className="text-muted small ms-1">(counts may be incomplete)</span>
    )}
  </span>
);

const renderRow = (row) => (
  <tr key={row.id}>
    <td>{formatTime(row.timestamp)}</td>
    <td className="font-monospace text-break">{row.originUrl ?? DASH}</td>
    <td><span className="badge text-bg-info">{row.parserType}</span></td>
    <td>{row.itemCount}</td>
    <td>{renderEmitsSent(row)}</td>
    <td>{renderEmitStatus(row.statusBreakdown)}</td>
  </tr>
);

const renderTable = (rows) => {
  if (rows.length === 0) {
    return <p className="text-muted mb-0">No extractions recorded yet.</p>;
  }

  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Time</th>
          <th>Resource</th>
          <th>Parser</th>
          <th>Items</th>
          <th>Emits sent</th>
          <th>Emit status</th>
        </tr>
      </thead>
      <tbody>
        {[...rows].reverse().map((row) => renderRow(row))}
      </tbody>
    </table>
  );
};

class ExtractionsHelper {
  static renderLoading() {
    return <LoadingSpinner message="Loading extractions…" />;
  }

  static renderError(error) {
    return <ErrorAlert error={error} prefix="Failed to load extractions" />;
  }

  static render({ extractedTotal, rows }) {
    return (
      <div className="d-flex flex-column gap-3">
        <div className="d-flex gap-2 flex-wrap">
          <span className="badge text-bg-secondary">Extracted: {extractedTotal}</span>
        </div>
        {renderTable(rows)}
      </div>
    );
  }
}

export default ExtractionsHelper;
