import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Emissions from '../../src/components/pages/Emissions.jsx';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const body = {
  counts: { extracted: 5, emitted: 3, failed: 1, dead: 1 },
  emissions: [
    {
      id: 1, extractionId: 7, status: 'success', url: 'https://example.com/a',
      method: 'POST', httpStatus: 200, itemRef: 'item-a', error: null,
      timestamp: '2026-08-30T12:00:00.000Z',
    },
    {
      id: 2, extractionId: 7, status: 'failed', url: 'https://example.com/b',
      method: 'PUT', httpStatus: 500, itemRef: 'item-b', error: 'boom',
      timestamp: '2026-08-30T12:01:00.000Z',
    },
  ],
};

const mockCursorFeed = (firstPayload) => {
  beforeEach(() => {
    let call = 0;
    spyOn(globalThis, 'fetch').and.callFake(() => {
      call += 1;
      const payload = call === 1
        ? firstPayload
        : { counts: firstPayload.counts, emissions: [] };
      return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
    });
  });
};

const renderEmissions = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(Emissions)));
  });
};

describe('Emissions', () => {
  const state = useContainer();

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await renderEmissions(state.root);
    });

    it('renders a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(state.container.textContent).toContain('Loading emissions');
    });
  });

  describe('when the feed loads successfully', () => {
    mockCursorFeed(body);

    beforeEach(async () => {
      await renderEmissions(state.root);
      await flushAsync();
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders the counts strip', () => {
      const text = state.container.textContent;
      expect(text).toContain('Extracted: 5');
      expect(text).toContain('Emitted: 3');
    });

    it('renders a row per emission', () => {
      expect(state.container.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('renders the target URLs in the feed', () => {
      expect(state.container.textContent).toContain('https://example.com/a');
      expect(state.container.textContent).toContain('https://example.com/b');
    });

    describe('when a status filter is selected', () => {
      beforeEach(async () => {
        const button = Array.from(state.container.querySelectorAll('button'))
          .find((b) => b.textContent.trim() === 'failed');
        await act(async () => {
          button.dispatchEvent(new window.Event('click', { bubbles: true }));
        });
      });

      it('narrows the feed to matching rows', () => {
        const rows = state.container.querySelectorAll('tbody tr');
        expect(rows.length).toBe(1);
        expect(rows[0].textContent).toContain('https://example.com/b');
      });
    });
  });

  describe('when the feed is empty', () => {
    mockCursorFeed({ counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 }, emissions: [] });

    beforeEach(async () => {
      await renderEmissions(state.root);
      await flushAsync();
    });

    it('shows the empty state message', () => {
      expect(state.container.textContent).toContain('No emissions recorded yet.');
    });
  });

  describe('when the fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(async () => {
      await renderEmissions(state.root);
      await flushAsync();
    });

    it('renders an error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
      expect(state.container.textContent).toContain('Failed to load emissions');
      expect(state.container.textContent).toContain('HTTP 503');
    });
  });
});
