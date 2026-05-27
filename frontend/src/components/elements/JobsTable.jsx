import JobsTableHelper from './helpers/JobsTableHelper.jsx';

function JobsTable({ jobs }) {
  if (jobs.length === 0) {
    return <p className="text-muted">No jobs found.</p>;
  }

  return (
    <table className="table table-striped">
      {JobsTableHelper.renderHeader()}
      {JobsTableHelper.renderBody(jobs)}
    </table>
  );
}

export default JobsTable;
