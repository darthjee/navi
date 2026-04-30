class ReadyCountdownHelper {
  static decrementRemaining(prev) {
    return Math.max(0, prev - 1000);
  }

  static tick(interval, prev) {
    const next = ReadyCountdownHelper.decrementRemaining(prev);
    if (next <= 0) clearInterval(interval);
    return next;
  }

  static initialize(readyInMs, setRemaining) {
    setRemaining(readyInMs);
    if (readyInMs <= 0) return;

    const interval = setInterval(
      () => setRemaining((prev) => ReadyCountdownHelper.tick(interval, prev)),
      1000
    );

    return () => clearInterval(interval);
  }
}

export default ReadyCountdownHelper;
