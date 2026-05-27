import JobRow from './JobRow.jsx';

class JobsTableHelper {
  static renderHeader() {
    return (
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Attempts</th>
          <th>Class</th>
          <th>URL</th>
        </tr>
      </thead>
    );
  }

  static renderBody(jobs) {
    return (
      <tbody>
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </tbody>
    );
  }
}

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
