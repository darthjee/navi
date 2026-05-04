import fetchJob, { retryJob } from '../../../clients/JobClient.js';
import noop from '../../../utils/noop.js';

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

  static handleRetry(id, refresh) {
    retryJob(id).then(refresh).catch(noop);
  }
}

export default JobController;
