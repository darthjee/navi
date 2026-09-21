import { flushAsync } from 'navi-spec-support/async.js';
import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import { createElement } from 'react';
import Logs from '../../src/components/elements/Logs.jsx';
import noop from '../../src/utils/noop.js';
import {
  itBehavesLikeLogsTerminal,
  logEntries,
  resolveOnceThenPend,
} from '../support/logs.js';

describe('Logs', () => {
  const state = useContainer();
  let fetchLogs;

  const renderLogs = async ({ settle = true } = {}) => {
    await renderInAct(state.root, createElement(Logs, { fetchLogs }));
    if (settle) await flushAsync();
  };

  const stubFetchLogs = (fake) => {
    fetchLogs = jasmine.createSpy('fetchLogs').and.callFake(fake);
  };

  const entries = async () => {
    stubFetchLogs(resolveOnceThenPend(logEntries));
    await renderLogs();
  };

  itBehavesLikeLogsTerminal({
    state,
    callCount: () => fetchLogs.calls.count(),
    sources: {
      pending: async () => {
        stubFetchLogs(() => new Promise(noop));
        await renderLogs({ settle: false });
      },
      entries,
      empty: async () => {
        stubFetchLogs(() => Promise.resolve([]));
        await renderLogs();
      },
      failure: async () => {
        stubFetchLogs(() => Promise.reject(new Error('HTTP 500')));
        await renderLogs();
      },
    },
  });

  describe('when log entries are returned', () => {
    beforeEach(entries);

    it('passes the newest log id as last_id on the next poll', () => {
      expect(fetchLogs.calls.argsFor(1)[0]).toEqual({ lastId: 4 });
    });
  });
});
