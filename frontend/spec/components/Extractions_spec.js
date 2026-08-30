import { createElement } from 'react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Extractions from '../../src/components/pages/Extractions.jsx';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';
import { mockFetchFailure } from '../support/fetch.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const extractionsBody = {
  counts: { extracted: 40 },
  extractions: [
    {
      id: 1, parserType: 'json', originUrl: null, itemCount: 20,
      timestamp: '2026-08-30T12:00:00.000Z',
    },
    {
      id: 2, parserType: 'html', originUrl: 'https://example.com/list?page=2', itemCount: 20,
      timestamp: '2026-08-30T12:05:00.000Z',
    },
  ],
};

const emissionsBody = {
  counts: { extracted: 40, emitted: 3, failed: 1, dead: 0 },
  emissions: [
    { id: 10, extractionId: 2, status: 'success', url: 'https://sink/a', method: 'POST' },
    { id: 11, extractionId: 2, status: 'success', url: 'https://sink/b', method: 'POST' },
    { id: 12, extractionId: 2, status: 'failed', url: 'https://sink/c', method: 'POST' },
  ],
};

const mockPair = (extractions, emissions) => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.callFake((url) => {
      const payload = url.startsWith('/extractions.json') ? extractions : emissions;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
    });
  });
};

const renderExtractions = async (root) => {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(Extractions)));
  });
};

describe('Extractions', () => {
  const state = useContainer();

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
      await renderExtractions(state.root);
    });

    it('renders a spinner', () => {
      expect(state.container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(state.container.textContent).toContain('Loading extractions');
    });
  });

  describe('when both feeds load successfully', () => {
    mockPair(extractionsBody, emissionsBody);

    beforeEach(async () => {
      await renderExtractions(state.root);
      await flushAsync();
    });

    it('shows the headline extracted total', () => {
      expect(state.container.textContent).toContain('Extracted: 40');
    });

    it('renders a row per extraction', () => {
      expect(state.container.querySelectorAll('tbody tr').length).toBe(2);
    });

    it('joins emissions to their extraction by extractionId', () => {
      const joinedRow = Array.from(state.container.querySelectorAll('tbody tr'))
        .find((tr) => tr.textContent.includes('example.com/list?page=2'));
      expect(joinedRow.textContent).toContain('3 of 20 items emitted');
    });

    it('shows the emit status breakdown, hiding zero counts', () => {
      const joinedRow = Array.from(state.container.querySelectorAll('tbody tr'))
        .find((tr) => tr.textContent.includes('example.com/list?page=2'));
      expect(joinedRow.textContent).toContain('success: 2');
      expect(joinedRow.textContent).toContain('failed: 1');
      expect(joinedRow.textContent).not.toContain('dead:');
    });

    it('renders a null originUrl as a dash', () => {
      const orphanRow = Array.from(state.container.querySelectorAll('tbody tr'))
        .find((tr) => tr.textContent.includes('0 of 20 items emitted'));
      expect(orphanRow.textContent).toContain('—');
    });

    it('flags rows with no retained emissions as partial', () => {
      expect(state.container.textContent).toContain('counts may be incomplete');
    });

    it('renders the parser type as a badge', () => {
      const badges = Array.from(state.container.querySelectorAll('tbody .badge')).map((b) => b.textContent);
      expect(badges).toContain('json');
      expect(badges).toContain('html');
    });
  });

  describe('when there are no extractions', () => {
    mockPair(
      { counts: { extracted: 0 }, extractions: [] },
      { counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 }, emissions: [] }
    );

    beforeEach(async () => {
      await renderExtractions(state.root);
      await flushAsync();
    });

    it('shows the empty state message', () => {
      expect(state.container.textContent).toContain('No extractions recorded yet.');
    });
  });

  describe('when a fetch fails', () => {
    mockFetchFailure(503);

    beforeEach(async () => {
      await renderExtractions(state.root);
      await flushAsync();
    });

    it('renders an error alert', () => {
      expect(state.container.querySelector('.alert-danger')).not.toBeNull();
      expect(state.container.textContent).toContain('Failed to load extractions');
      expect(state.container.textContent).toContain('HTTP 503');
    });
  });
});
