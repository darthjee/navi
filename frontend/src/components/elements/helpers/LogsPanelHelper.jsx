import LogEntry from '../LogEntry.jsx';

class LogsPanelHelper {
  static renderEntries(logs) {
    return logs.map((log) => (
      <LogEntry key={log.id} log={log} />
    ));
  }
}

export default LogsPanelHelper;
