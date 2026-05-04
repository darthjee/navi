const RETRYABLE_STATUSES = new Set(['failed', 'dead']);

function RetryButton({ job, onRetry }) {
  if (!RETRYABLE_STATUSES.has(job.status)) return null;
  return (
    <button className="btn btn-warning btn-sm" onClick={onRetry}>
      Retry
    </button>
  );
}

export default RetryButton;
