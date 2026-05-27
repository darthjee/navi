import LogEntry from './LogEntry.jsx';

function LogsPanel({ logs, bottomRef }) {
  return (
    <div
      className="bg-dark text-light p-3 rounded"
      style={{ fontFamily: 'monospace', minHeight: '400px', overflowY: 'auto', maxHeight: '80vh' }}
    >
      {logs.map((log) => (
        <LogEntry key={log.id} log={log} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default LogsPanel;
