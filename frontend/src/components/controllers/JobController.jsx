import fetchJob from '../../clients/JobClient.js';

class JobController {
  static buildEffect(id, setJob, setError, setLoading) {
    return () => {
      fetchJob(id)
        .then((data) => {
          setJob(data);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };
  }
}

export default JobController;
