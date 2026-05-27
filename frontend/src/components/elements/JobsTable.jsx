import JobRow from './JobRow.jsx';

function JobsTable({ jobs }) {
  if (jobs.length === 0) {
    return <p className="text-muted">No jobs found.</p>;
  }

  return (
    <table className="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Attempts</th>
          <th>Class</th>
          <th>URL</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </tbody>
    </table>
  );
}

export default JobsTable;
