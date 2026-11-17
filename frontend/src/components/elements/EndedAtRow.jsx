import formatTimestamp from '../../utils/formatTimestamp.js';

function EndedAtRow({ job }) {
  if (!job.endedAt) return null;
  return (
    <>
      <dt className="col-sm-3">Ended at</dt>
      <dd className="col-sm-9">{formatTimestamp(job.endedAt)}</dd>
    </>
  );
}

export default EndedAtRow;
