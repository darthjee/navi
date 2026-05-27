import LogsPanel from '../LogsPanel.jsx';

class LogsHelper {
  #logs;

  constructor(logs) {
    this.#logs = logs;
  }

  static build(logs) {
    return new LogsHelper(logs);
  }

  render(bottomRef) {
    return <LogsPanel logs={this.#logs} bottomRef={bottomRef} />;
  }
}

export default LogsHelper;
