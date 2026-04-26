import { useEffect, useState } from 'react';

const decrementRemaining = (prev) => Math.max(0, prev - 1000);

function ReadyCountdown({ readyInMs }) {
  const [remaining, setRemaining] = useState(readyInMs);

  useEffect(() => {
    setRemaining(readyInMs);
    if (readyInMs <= 0) return;

    const tick = (prev) => {
      const next = decrementRemaining(prev);
      if (next <= 0) {
        clearInterval(interval);
      }
      return next;
    };

    const interval = setInterval(() => setRemaining(tick), 1000);

    return () => clearInterval(interval);
  }, [readyInMs]);

  if (remaining <= 0) {
    return <span className="text-success">Ready</span>;
  }

  const seconds = Math.ceil(remaining / 1000);
  return <span>{seconds}s</span>;
}

export default ReadyCountdown;
