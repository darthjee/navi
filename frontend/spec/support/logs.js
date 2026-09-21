import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import noop from '../../src/utils/noop.js';

// Shared fixtures and examples for the logs component specs (Logs, LogsPage,
// LogsPanel and LogsPageController).
// Lives here (not in fetch.js) because fetch.js is shipped verbatim in the
// navi-hey-test image and must not import from frontend/src.

// Four entries covering every level rendered with a distinct style.
// Frozen so that no example can mutate the fixture for the following ones.
const logEntries = Object.freeze([
  { id: 1, level: 'info', message: 'Server started', timestamp: '2024-01-01T00:00:00Z' },
  { id: 2, level: 'warn', message: 'High memory usage', timestamp: '2024-01-01T00:00:01Z' },
  { id: 3, level: 'error', message: 'Connection refused', timestamp: '2024-01-01T00:00:02Z' },
  { id: 4, level: 'debug', message: 'Cache hit', timestamp: '2024-01-01T00:00:03Z' },
].map((entry) => Object.freeze(entry)));

// Successful fetch response carrying `data` as its JSON body.
const okResponse = (data) => ({ ok: true, json: () => Promise.resolve(data) });

// Builds a fake for a poll function: the first call resolves with `firstValue`
// and every later call stays pending, which stops the polling loop.
const resolveOnceThenPend = (firstValue) => {
  let callCount = 0;
  return () => {
    callCount++;
    return callCount === 1 ? Promise.resolve(firstValue) : new Promise(noop);
  };
};

// Returns the terminal rows that carry content (skips the empty sentinel row).
const visibleLogRows = (container) => Array.from(container.querySelectorAll('.bg-dark > div'))
  .filter((el) => el.textContent.trim() !== '');

const itRendersAnEmptyTerminal = (state) => {
  it('renders the terminal container', () => {
    expect(state.container.querySelector('.bg-dark')).not.toBeNull();
  });

  it('applies the text-light class to the terminal container', () => {
    expect(state.container.querySelector('.bg-dark.text-light')).not.toBeNull();
  });

  it('does not show any log entries', () => {
    expect(visibleLogRows(state.container).length).toBe(0);
  });
};

const itRendersEntries = (state) => {
  it('renders the message for each log entry', () => {
    logEntries.forEach(({ message }) => {
      expect(state.container.textContent).toContain(message);
    });
  });

  it('shows the timestamp for each entry', () => {
    logEntries.forEach(({ timestamp }) => {
      expect(state.container.textContent).toContain(timestamp);
    });
  });

  it('shows the level label for each entry', () => {
    logEntries.forEach(({ level }) => {
      expect(state.container.textContent).toContain(`[${level}]`);
    });
  });

  it('applies text-warning class to warn entries', () => {
    expect(state.container.querySelector('.text-warning')).not.toBeNull();
  });

  it('applies text-danger class to error entries', () => {
    expect(state.container.querySelector('.text-danger')).not.toBeNull();
  });

  it('applies the text-debug class to debug entries', () => {
    expect(state.container.querySelector('.text-debug')).not.toBeNull();
  });

  it('does not apply the text-debug class to info entries', () => {
    const infoEntry = Array.from(state.container.querySelectorAll('.bg-dark > div'))
      .find((el) => el.textContent.includes('Server started'));
    expect(infoEntry).toBeDefined();
    expect(infoEntry.classList.contains('text-debug')).toBeFalse();
  });
};

// Registers, at describe level, the scenarios shared by the helpers that build
// and render the logs terminal (LogsPageHelper and LogsHelper). `HelperClass`
// must expose a static `build(logs)` and an instance `render(bottomRef)`.
const itBehavesLikeLogsHelper = (HelperClass) => {
  describe('.build', () => {
    it(`returns a ${HelperClass.name} instance`, () => {
      expect(HelperClass.build([])).toBeInstanceOf(HelperClass);
    });
  });

  describe('#render', () => {
    const state = useContainer();
    const bottomRef = { current: null };

    const renderHelper = (logs) => renderInAct(state.root, HelperClass.build(logs).render(bottomRef));

    describe('with no log entries', () => {
      beforeEach(() => renderHelper([]));

      itRendersAnEmptyTerminal(state);
    });

    describe('with log entries', () => {
      beforeEach(() => renderHelper(logEntries));

      itRendersEntries(state);

      it('renders a row for each log entry', () => {
        const rows = state.container.querySelectorAll('.bg-dark > div');
        expect(rows.length).toBe(logEntries.length + 1); // +1 for bottomRef sentinel div
      });

      it('does not apply a CSS colour class to info entries', () => {
        const infoRow = Array.from(state.container.querySelectorAll('.bg-dark > div'))
          .find((el) => el.textContent.includes('Server started'));
        expect(infoRow).toBeDefined();
        ['text-warning', 'text-danger'].forEach((cssClass) => {
          expect(infoRow.classList.contains(cssClass)).toBeFalse();
        });
      });

      it('shows the timestamp in brackets', () => {
        expect(state.container.textContent).toContain(`[${logEntries[0].timestamp}]`);
      });

      it('shows the level in brackets', () => {
        logEntries.forEach(({ level }) => {
          expect(state.container.textContent).toContain(`[${level}]`);
        });
      });
    });
  });
};

// Registers, at describe level, the scenarios shared by the components that
// render the logs terminal. `state` comes from useContainer(). `sources` maps
// scenario names to async setup functions (registered as beforeEach) that
// stub the data source and render the component into `state.container`:
//   pending  - the data never arrives (initial render)
//   entries  - `logEntries` are delivered
//   empty    - no entries are delivered
//   failure  - the data source fails
// Scenarios without a matching source are skipped. When `callCount` (a
// function returning how many times the data source was called) is given,
// the polling assertions are registered as well.
const itBehavesLikeLogsTerminal = ({ state, sources, callCount }) => {
  const itDoesNotPollAgain = () => {
    if (!callCount) return;

    it('does not poll again immediately', () => {
      expect(callCount()).toBe(1);
    });
  };

  if (sources.pending) {
    describe('initial render', () => {
      beforeEach(sources.pending);

      itRendersAnEmptyTerminal(state);
    });
  }

  if (sources.entries) {
    describe('when log entries are returned', () => {
      beforeEach(sources.entries);

      itRendersEntries(state);

      if (callCount) {
        it('polls again immediately after receiving entries', () => {
          expect(callCount()).toBeGreaterThan(1);
        });
      }
    });
  }

  if (sources.empty) {
    describe('when the response is empty', () => {
      beforeEach(sources.empty);

      itRendersAnEmptyTerminal(state);
      itDoesNotPollAgain();
    });
  }

  if (sources.failure) {
    describe('when the fetch fails', () => {
      beforeEach(sources.failure);

      itRendersAnEmptyTerminal(state);
      itDoesNotPollAgain();
    });
  }
};

export {
  itBehavesLikeLogsHelper,
  itBehavesLikeLogsTerminal,
  logEntries,
  okResponse,
  resolveOnceThenPend,
  visibleLogRows,
};
