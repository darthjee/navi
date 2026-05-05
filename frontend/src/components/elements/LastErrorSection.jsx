import CollapsibleSection from './CollapsibleSection.jsx';

const STATUSES_WITH_ERROR = new Set(['failed', 'dead']);

function LastErrorSection({ job }) {
  if (!STATUSES_WITH_ERROR.has(job.status)) return null;
  if (job.lastError === null || job.lastError === undefined) return null;
  return (
    <>
      <dt className="col-sm-3">Last error</dt>
      <dd className="col-sm-9">
        <CollapsibleSection label="Show error">
          <p>{job.lastError}</p>
          {job.backtrace && <pre>{job.backtrace}</pre>}
        </CollapsibleSection>
      </dd>
    </>
  );
}

export default LastErrorSection;
