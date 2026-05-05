const STATUSES_WITH_REMAINING_ATTEMPTS = new Set(['enqueued', 'processing', 'failed']);

function RemainingAttempts({ job }) {
  if (!STATUSES_WITH_REMAINING_ATTEMPTS.has(job.status)) return null;
  return (
    <>
      <dt className="col-sm-3">Remaining attempts</dt>
      <dd className="col-sm-9">{job.remainingAttempts}</dd>
    </>
  );
}

export default RemainingAttempts;
