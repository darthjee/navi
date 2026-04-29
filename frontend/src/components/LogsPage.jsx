import { useEffect, useMemo, useRef, useState } from 'react';
import LogsPageHelper from './LogsPageHelper.jsx';
import './LogsPage.css';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);
  const cancelledRef = useRef(false);
  const lastIdRef = useRef(null);

  const helper = useMemo(() => LogsPageHelper.build(logs), [logs]);

  useEffect(helper.buildPollingEffect(cancelledRef, lastIdRef, setLogs), []);

  useEffect(helper.buildScrollEffect(bottomRef), [helper]);

  return helper.render(bottomRef);
}

export default LogsPage;
