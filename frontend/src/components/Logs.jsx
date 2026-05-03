import { useEffect, useMemo, useRef, useState } from 'react';
import LogsController from './controllers/LogsController.jsx';
import LogsHelper from './helpers/LogsHelper.jsx';
import './LogsPage.css';

function Logs({ fetchLogs }) {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);
  const cancelledRef = useRef(false);
  const lastIdRef = useRef(null);

  const helper = useMemo(() => LogsHelper.build(logs), [logs]);
  const view = useMemo(() => LogsController.build(logs, fetchLogs), [logs, fetchLogs]);

  useEffect(view.buildPollingEffect(cancelledRef, lastIdRef, setLogs), []);

  useEffect(view.buildScrollEffect(bottomRef), [view]);

  return helper.render(bottomRef);
}

export default Logs;
