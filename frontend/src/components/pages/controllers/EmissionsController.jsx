import fetchEmissions from '../../../clients/EmissionsClient.js';

const POLL_DELAY_MS = 1000;
const MAX_ROWS = 500;
const EMPTY_COUNTS = { extracted: 0, emitted: 0, failed: 0, dead: 0 };

class EmissionsController {
  #setData;
  #setError;
  #setLoading;
  #rows;
  #counts;

  constructor(setData, setError, setLoading) {
    this.#setData = setData;
    this.#setError = setError;
    this.#setLoading = setLoading;
    this.#rows = [];
    this.#counts = { ...EMPTY_COUNTS };
  }

  static build(setData, setError, setLoading) {
    return new EmissionsController(setData, setError, setLoading);
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
    this.#setData({ counts: this.#counts, rows: this.#rows });
  }

  #handleResponse(response, cancelledRef, lastIdRef) {
    if (cancelledRef.current) return;

    this.#setLoading(false);
    this.#setError(null);
    this.#counts = { ...EMPTY_COUNTS, ...response?.counts };

    const entries = response?.emissions ?? [];

    if (entries.length !== 0) {
      lastIdRef.current = entries[entries.length - 1].id;
      this.#rows = [...this.#rows, ...entries].slice(-MAX_ROWS);
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

    fetchEmissions({ lastId: lastIdRef.current })
      .then((response) => this.#handleResponse(response, cancelledRef, lastIdRef))
      .catch((err) => this.#handleError(err, cancelledRef, lastIdRef));
  }
}

export default EmissionsController;
