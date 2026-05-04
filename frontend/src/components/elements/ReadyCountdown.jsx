import { useEffect, useState } from 'react';
import ReadyCountdownHelper from './helpers/ReadyCountdownHelper.jsx';

function ReadyCountdown({ readyInMs }) {
  const [remaining, setRemaining] = useState(readyInMs);

  useEffect(
    () => ReadyCountdownHelper.initialize(readyInMs, setRemaining),
    [readyInMs]
  );

  if (remaining <= 0) {
    return <span className="text-success">Ready</span>;
  }

  return <span>{Math.ceil(remaining / 1000)}s</span>;
}

export default ReadyCountdown;
