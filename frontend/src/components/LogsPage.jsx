import { useEffect, useMemo, useRef, useState } from 'react';
import LogsPageHelper from './LogsPageHelper.jsx';
import LogsPageView from './LogsPageView.jsx';
import './LogsPage.css';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const bottomRef = useRef(null);
  const cancelledRef = useRef(false);
  const lastIdRef = useRef(null);

  const helper = useMemo(() => LogsPageHelper.build(logs), [logs]);
  const view = useMemo(() => LogsPageView.build(logs), [logs]);

  useEffect(view.buildPollingEffect(cancelledRef, lastIdRef, setLogs), []);

  useEffect(view.buildScrollEffect(bottomRef), [view]);

  return helper.render(bottomRef);
}

export default LogsPage;
