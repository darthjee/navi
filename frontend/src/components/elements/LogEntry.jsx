const LEVEL_CLASS = {
  debug: 'text-debug',
  info: '',
  warn: 'text-warning',
  error: 'text-danger',
};

function LogEntry({ log }) {
  return (
    <div className={LEVEL_CLASS[log.level] ?? ''}>
      [{log.timestamp}] [{log.level}] {log.message}
    </div>
  );
}

export default LogEntry;
