import LogEntry from './LogEntry.jsx';

function renderEntries(logs) {
  return logs.map((log) => (
    <LogEntry key={log.id} log={log} />
  ));
}

function LogsPanel({ logs, bottomRef }) {
  return (
    <div
      className="bg-dark text-light p-3 rounded"
      style={{ fontFamily: 'monospace', minHeight: '400px', overflowY: 'auto', maxHeight: '80vh' }}
    >
      {renderEntries(logs)}
      <div ref={bottomRef} />
    </div>
  );
}

export default LogsPanel;
