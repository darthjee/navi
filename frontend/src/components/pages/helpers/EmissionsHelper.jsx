import { format } from 'date-fns';
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingSpinner from '../../elements/LoadingSpinner.jsx';

const DASH = '—';

const STATUS_VARIANT = {
  success: 'success',
  failed: 'warning',
  dead: 'dark',
};

const STATUS_FILTERS = ['all', 'success', 'failed', 'dead'];

const COUNT_CHIPS = [
  { key: 'extracted', label: 'Extracted', variant: 'secondary' },
  { key: 'emitted', label: 'Emitted', variant: 'success' },
  { key: 'failed', label: 'Failed', variant: 'warning' },
  { key: 'dead', label: 'Dead', variant: 'dark' },
];

const formatTime = (timestamp) => {
  if (!timestamp) return DASH;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return format(date, 'yyyy-MM-dd HH:mm:ss');
};

const filterRows = (rows, statusFilter) => {
  if (statusFilter === 'all') return rows;
  return rows.filter((row) => row.status === statusFilter);
};

const renderCounts = (counts) => (
  <div className="d-flex gap-2 flex-wrap">
    {COUNT_CHIPS.map((chip) => (
      <span key={chip.key} className={`badge text-bg-${chip.variant}`}>
        {chip.label}: {counts?.[chip.key] ?? 0}
      </span>
    ))}
  </div>
);

const renderFilter = (statusFilter, onStatusFilterChange) => (
  <div className="btn-group btn-group-sm" role="group" aria-label="Status filter">
    {STATUS_FILTERS.map((value) => (
      <button
        key={value}
        type="button"
        className={`btn ${value === statusFilter ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => onStatusFilterChange(value)}
      >
        {value}
      </button>
    ))}
  </div>
);

const renderRow = (row) => (
  <tr key={row.id}>
    <td>{formatTime(row.timestamp)}</td>
    <td>
      <span className={`badge text-bg-${STATUS_VARIANT[row.status] ?? 'secondary'}`}>
        {row.status}
      </span>
    </td>
    <td>{row.method ?? DASH}</td>
    <td className="font-monospace text-break">{row.url ?? DASH}</td>
    <td>{row.httpStatus ?? DASH}</td>
    <td>{row.itemRef ?? DASH}</td>
    <td className="font-monospace text-break">{row.error ?? DASH}</td>
  </tr>
);

const renderTable = (rows) => {
  if (rows.length === 0) {
    return <p className="text-muted mb-0">No emissions recorded yet.</p>;
  }

  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>Time</th>
          <th>Status</th>
          <th>Method</th>
          <th>Target URL</th>
          <th>HTTP</th>
          <th>Item</th>
          <th>Error</th>
        </tr>
      </thead>
      <tbody>
        {[...rows].reverse().map((row) => renderRow(row))}
      </tbody>
    </table>
  );
};

class EmissionsHelper {
  static renderLoading() {
    return <LoadingSpinner message="Loading emissions…" />;
  }

  static renderError(error) {
    return <ErrorAlert error={error} prefix="Failed to load emissions" />;
  }

  static render({ counts, rows, statusFilter, onStatusFilterChange }) {
    const visibleRows = filterRows(rows, statusFilter);

    return (
      <div className="d-flex flex-column gap-3">
        {renderCounts(counts)}
        {renderFilter(statusFilter, onStatusFilterChange)}
        {renderTable(visibleRows)}
      </div>
    );
  }
}

export default EmissionsHelper;
