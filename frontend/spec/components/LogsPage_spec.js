import { createElement } from 'react';
import LogsPage from '../../src/components/pages/LogsPage.jsx';
import noop from '../../src/utils/noop.js';
import { flushAsync } from '../support/async.js';
import { renderInAct, useContainer } from '../support/dom.js';
import {
  itBehavesLikeLogsTerminal,
  logEntries,
  okResponse,
  resolveOnceThenPend,
} from '../support/logs.js';

describe('LogsPage', () => {
  const state = useContainer();

  const renderPage = async ({ settle = true } = {}) => {
    await renderInAct(state.root, createElement(LogsPage));
    if (settle) await flushAsync();
  };

  const stubFetch = (fake) => {
    spyOn(globalThis, 'fetch').and.callFake(fake);
  };

  const entries = async () => {
    stubFetch(resolveOnceThenPend(okResponse(logEntries)));
    await renderPage();
  };

  itBehavesLikeLogsTerminal({
    state,
    callCount: () => globalThis.fetch.calls.count(),
    sources: {
      pending: async () => {
        stubFetch(() => new Promise(noop));
        await renderPage({ settle: false });
      },
      entries,
      empty: async () => {
        stubFetch(() => Promise.resolve(okResponse([])));
        await renderPage();
      },
      failure: async () => {
        stubFetch(() => Promise.resolve({ ok: false, status: 500 }));
        await renderPage();
      },
    },
  });

  describe('when log entries are returned', () => {
    beforeEach(entries);

    it('passes the newest log id as last_id on the next poll', () => {
      const secondCallUrl = globalThis.fetch.calls.argsFor(1)[0];
      expect(secondCallUrl).toContain('last_id=4');
    });
  });
});
