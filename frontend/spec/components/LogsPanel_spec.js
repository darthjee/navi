import { createElement } from 'react';
import LogsPanel from '../../src/components/elements/LogsPanel.jsx';
import { renderInAct, useContainer } from '../support/dom.js';
import { itBehavesLikeLogsTerminal, logEntries } from '../support/logs.js';

describe('LogsPanel', () => {
  const state = useContainer();
  const bottomRef = { current: null };

  const renderPanel = (logs) => renderInAct(state.root, createElement(LogsPanel, { logs, bottomRef }));
  const entries = () => renderPanel(logEntries);

  itBehavesLikeLogsTerminal({
    state,
    sources: {
      entries,
      empty: () => renderPanel([]),
    },
  });

  describe('with log entries', () => {
    beforeEach(entries);

    it('renders a row for each log entry', () => {
      const rows = state.container.querySelectorAll('.bg-dark > div');
      expect(rows.length).toBe(logEntries.length + 1); // +1 for sentinel div
    });

    it('shows timestamps in brackets', () => {
      expect(state.container.textContent).toContain('[2024-01-01T00:00:00Z]');
    });
  });
});
