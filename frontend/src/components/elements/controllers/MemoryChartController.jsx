const POLL_DELAY_MS = 1000;
const MAX_POINTS = 200;

class MemoryChartController {
  #fetchMemoryHistory;
  #setData;
  #setError;
  #setLoading;
  #points;

  constructor(fetchMemoryHistory, setData, setError, setLoading) {
    this.#fetchMemoryHistory = fetchMemoryHistory;
    this.#setData = setData;
    this.#setError = setError;
    this.#setLoading = setLoading;
    this.#points = [];
  }

  static build(fetchMemoryHistory, setData, setError, setLoading) {
    return new MemoryChartController(fetchMemoryHistory, setData, setError, setLoading);
  }

  buildPollingEffect(cancelledRef, lastIdRef) {
    return () => {
      cancelledRef.current = false;
      this.#poll(cancelledRef, lastIdRef);
      return () => {
        cancelledRef.current = true;
      };
    };
  }

  #emit() {
    this.#setData(this.#points);
  }

  #handleResponse(entries, cancelledRef, lastIdRef) {
    if (cancelledRef.current) return;

    this.#setLoading(false);
    this.#setError(null);

    if (entries.length !== 0) {
      lastIdRef.current = entries[entries.length - 1].id;
      this.#points = [...this.#points, ...entries].slice(-MAX_POINTS);
      this.#emit();
      this.#poll(cancelledRef, lastIdRef);
    } else {
      this.#emit();
      setTimeout(() => this.#poll(cancelledRef, lastIdRef), POLL_DELAY_MS);
    }
  }

  #handleError(err, cancelledRef, lastIdRef) {
    if (cancelledRef.current) return;

    this.#setLoading(false);
    this.#setError(err.message);
    setTimeout(() => this.#poll(cancelledRef, lastIdRef), POLL_DELAY_MS);
  }

  #poll(cancelledRef, lastIdRef) {
    if (cancelledRef.current) return;

    this.#fetchMemoryHistory({ lastId: lastIdRef.current })
      .then((entries) => this.#handleResponse(entries, cancelledRef, lastIdRef))
      .catch((err) => this.#handleError(err, cancelledRef, lastIdRef));
  }
}

export default MemoryChartController;
