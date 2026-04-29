import { useEffect, useRef, useState } from 'react';
import fetchLogs from '../clients/LogsClient.js';

const LEVEL_STYLE = {
  debug: { color: '#00FF41' },
  info: {},
  warn: {},
  error: {},
};

const LEVEL_CLASS = {
  debug: '',
  info: '',
  warn: 'text-warning',
  error: 'text-danger',
};

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);
  const cancelledRef = useRef(false);
  const lastIdRef = useRef(null);

  useEffect(() => {
    cancelledRef.current = false;

    const poll = () => {
      if (cancelledRef.current) return;

      fetchLogs({ lastId: lastIdRef.current })
        .then((entries) => {
          if (cancelledRef.current) return;

          if (entries.length === 0) {
            setTimeout(poll, 1000);
          } else {
            lastIdRef.current = entries[entries.length - 1].id;
            setLogs((prev) => [...prev, ...entries]);
            poll();
          }
        })
        .catch(() => {
          if (!cancelledRef.current) setTimeout(poll, 1000);
        });
    };

    poll();

    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div
      className="bg-dark text-light p-3 rounded"
      style={{ fontFamily: 'monospace', minHeight: '400px', overflowY: 'auto', maxHeight: '80vh' }}
    >
      {logs.map((log) => (
        <div
          key={log.id}
          className={LEVEL_CLASS[log.level] ?? ''}
          style={LEVEL_STYLE[log.level] ?? {}}
        >
          [{log.timestamp}] [{log.level}] {log.message}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default LogsPage;
