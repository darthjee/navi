import fetchLogs from '../clients/LogsClient.js';

const POLL_DELAY_MS = 1000;

const LEVEL_CLASS = {
  debug: 'text-debug',
  info: '',
  warn: 'text-warning',
  error: 'text-danger',
};

class LogsPageHelper {
  #logs;

  constructor(logs) {
    this.#logs = logs;
  }

  static build(logs) {
    return new LogsPageHelper(logs);
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

  render(bottomRef) {
    return (
      <div
        className="bg-dark text-light p-3 rounded"
        style={{ fontFamily: 'monospace', minHeight: '400px', overflowY: 'auto', maxHeight: '80vh' }}
      >
        {this.#logs.map((log) => this.#renderEntry(log))}
        <div ref={bottomRef} />
      </div>
    );
  }

  #renderEntry(log) {
    return (
      <div
        key={log.id}
        className={LEVEL_CLASS[log.level] ?? ''}
      >
        [{log.timestamp}] [{log.level}] {log.message}
      </div>
    );
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

    fetchLogs({ lastId: lastIdRef.current })
      .then((entries) => this.#handleEntries(entries, cancelledRef, lastIdRef, setLogs))
      .catch(() => {
        if (!cancelledRef.current) setTimeout(() => this.#poll(cancelledRef, lastIdRef, setLogs), POLL_DELAY_MS);
      });
  }
}

export default LogsPageHelper;
