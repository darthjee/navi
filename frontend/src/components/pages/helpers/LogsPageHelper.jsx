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
}

export default LogsPageHelper;

