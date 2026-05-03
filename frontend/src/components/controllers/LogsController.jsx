const POLL_DELAY_MS = 1000;

class LogsController {
  #logs;
  #fetchLogs;

  constructor(logs, fetchLogs) {
    this.#logs = logs;
    this.#fetchLogs = fetchLogs;
  }

  static build(logs, fetchLogs) {
    return new LogsController(logs, fetchLogs);
  }

  buildPollingEffect(cancelledRef, lastIdRef, setLogs) {
    return () => {
      cancelledRef.current = false;
      this.#poll(cancelledRef, lastIdRef, setLogs);
      return () => {
        cancelledRef.current = true;
      };
    };
  }

  buildScrollEffect(bottomRef) {
    return () => {
      if (this.#logs.length > 0) {
        bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
      }
    };
  }

  #hasEntries(entries) {
    return entries.length !== 0;
  }

  #appendEntries(entries, lastIdRef, setLogs, cancelledRef) {
    lastIdRef.current = entries[entries.length - 1].id;
    setLogs((prev) => [...prev, ...entries]);
    this.#poll(cancelledRef, lastIdRef, setLogs);
  }

  #handleEntries(entries, cancelledRef, lastIdRef, setLogs) {
    if (cancelledRef.current) return;

    if (this.#hasEntries(entries)) {
      this.#appendEntries(entries, lastIdRef, setLogs, cancelledRef);
    } else {
      setTimeout(() => this.#poll(cancelledRef, lastIdRef, setLogs), POLL_DELAY_MS);
    }
  }

  #poll(cancelledRef, lastIdRef, setLogs) {
    if (cancelledRef.current) return;

    this.#fetchLogs({ lastId: lastIdRef.current })
      .then((entries) => this.#handleEntries(entries, cancelledRef, lastIdRef, setLogs))
      .catch(() => {
        if (!cancelledRef.current) setTimeout(() => this.#poll(cancelledRef, lastIdRef, setLogs), POLL_DELAY_MS);
      });
  }
}

export default LogsController;
