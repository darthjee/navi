import LogsPanelHelper from './helpers/LogsPanelHelper.jsx';

function LogsPanel({ logs, bottomRef }) {
  return (
    <div
      className="bg-dark text-light p-3 rounded"
      style={{ fontFamily: 'monospace', minHeight: '400px', overflowY: 'auto', maxHeight: '80vh' }}
    >
      {LogsPanelHelper.renderEntries(logs)}
      <div ref={bottomRef} />
    </div>
  );
}

export default LogsPanel;
