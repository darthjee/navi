import ReadyCountdown from './ReadyCountdown.jsx';

const STATUSES_WITH_READY_IN = new Set(['failed']);

function ReadyInRow({ job }) {
  if (!STATUSES_WITH_READY_IN.has(job.status)) return null;
  return (
    <>
      <dt className="col-sm-3">Ready in</dt>
      <dd className="col-sm-9"><ReadyCountdown readyInMs={job.readyInMs} /></dd>
    </>
  );
}

export default ReadyInRow;
