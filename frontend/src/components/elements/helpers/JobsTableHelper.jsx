import JobRow from '../JobRow.jsx';

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

export default JobsTableHelper;
