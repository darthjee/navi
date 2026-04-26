import { useEffect, useState } from 'react';

function ReadyCountdown({ readyInMs }) {
  const [remaining, setRemaining] = useState(readyInMs);

  useEffect(() => {
    setRemaining(readyInMs);
    if (readyInMs <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [readyInMs]);

  if (remaining <= 0) {
    return <span className="text-success">Ready</span>;
  }

  const seconds = Math.ceil(remaining / 1000);
  return <span>{seconds}s</span>;
}

export default ReadyCountdown;
