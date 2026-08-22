import fetchMemoryStatus from '../../../clients/MemoryStatusClient.js';

class MemoryStatusController {
  #setStatus;
  #setError;
  #setLoading;

  constructor(setStatus, setError, setLoading) {
    this.#setStatus = setStatus;
    this.#setError = setError;
    this.#setLoading = setLoading;
  }

  static build(setStatus, setError, setLoading) {
    return new MemoryStatusController(setStatus, setError, setLoading);
  }

  buildEffect() {
    return () => {
      this.#load();
      const interval = setInterval(() => this.#load(), 5000);
      return () => clearInterval(interval);
    };
  }

  #load() {
    fetchMemoryStatus()
      .then((data) => {
        this.#setStatus(data);
        this.#setError(null);
      })
      .catch((err) => this.#setError(err.message))
      .finally(() => this.#setLoading(false));
  }
}

export default MemoryStatusController;
