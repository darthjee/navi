import { useEffect, useState } from 'react';

class ReadyCountdownTimer {
  static decrementRemaining(prev) {
    return Math.max(0, prev - 1000);
  }

  static tick(interval, prev) {
    const next = ReadyCountdownTimer.decrementRemaining(prev);
    if (next <= 0) clearInterval(interval);
    return next;
  }

  static initialize(readyInMs, setRemaining) {
    setRemaining(readyInMs);
    if (readyInMs <= 0) return;

    const interval = setInterval(
      () => setRemaining((prev) => ReadyCountdownTimer.tick(interval, prev)),
      1000
    );

    return () => clearInterval(interval);
  }
}

function ReadyCountdown({ readyInMs }) {
  const [remaining, setRemaining] = useState(readyInMs);

  useEffect(
    () => ReadyCountdownTimer.initialize(readyInMs, setRemaining),
    [readyInMs]
  );

  if (remaining <= 0) {
    return <span className="text-success">Ready</span>;
  }

  return <span>{Math.ceil(remaining / 1000)}s</span>;
}

export default ReadyCountdown;
