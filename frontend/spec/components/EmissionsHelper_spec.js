import { renderInAct, useContainer } from 'navi-spec-support/dom.js';
import EmissionsHelper from '../../src/components/pages/helpers/EmissionsHelper.jsx';
import noop from '../../src/utils/noop.js';
import { itBehavesLikeEmptyFeed, itBehavesLikeHelperFetchStates } from '../support/helper_states.js';

const counts = { extracted: 5, emitted: 3, failed: 1, dead: 1 };

const rows = [
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
  {
    id: 3, extractionId: 8, status: 'dead', url: 'https://example.com/c',
    method: 'POST', httpStatus: null, itemRef: null, error: 'gave up',
    timestamp: '2026-08-30T12:02:00.000Z',
  },
];

describe('EmissionsHelper', () => {
  const state = useContainer();

  const render = async (props) => {
    await renderInAct(state.root, EmissionsHelper.render({
      counts, rows, statusFilter: 'all', onStatusFilterChange: noop, ...props,
    }));
  };

  itBehavesLikeHelperFetchStates({
    state, helper: EmissionsHelper, errorPrefix: 'Failed to load emissions',
  });

  describe('.render', () => {
    describe('the counts strip', () => {
      beforeEach(async () => { await render(); });

      it('shows every emission count', () => {
        const text = state.container.textContent;
        expect(text).toContain('Extracted: 5');
        expect(text).toContain('Emitted: 3');
        expect(text).toContain('Failed: 1');
        expect(text).toContain('Dead: 1');
      });
    });

    describe('with the "all" filter', () => {
      beforeEach(async () => { await render({ statusFilter: 'all' }); });

      it('renders one row per emission', () => {
        expect(state.container.querySelectorAll('tbody tr').length).toBe(3);
      });

      it('renders the feed columns', () => {
        const headers = Array.from(state.container.querySelectorAll('thead th')).map((th) => th.textContent);
        expect(headers).toEqual(['Time', 'Status', 'Method', 'Target URL', 'HTTP', 'Item', 'Error']);
      });

      it('maps success to a success badge', () => {
        const badges = Array.from(state.container.querySelectorAll('tbody .badge')).map((b) => b.className);
        expect(badges.some((c) => c.includes('text-bg-success'))).toBeTrue();
      });

      it('maps failed to a warning badge', () => {
        const badges = Array.from(state.container.querySelectorAll('tbody .badge')).map((b) => b.className);
        expect(badges.some((c) => c.includes('text-bg-warning'))).toBeTrue();
      });

      it('maps dead to a dark badge', () => {
        const badges = Array.from(state.container.querySelectorAll('tbody .badge')).map((b) => b.className);
        expect(badges.some((c) => c.includes('text-bg-dark'))).toBeTrue();
      });

      it('renders missing httpStatus and itemRef as a dash', () => {
        const deadRow = Array.from(state.container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('gave up'));
        expect(deadRow.textContent).toContain('—');
      });

      it('orders the newest emission first', () => {
        const firstRow = state.container.querySelector('tbody tr');
        expect(firstRow.textContent).toContain('https://example.com/c');
      });
    });

    describe('with the "failed" filter', () => {
      beforeEach(async () => { await render({ statusFilter: 'failed' }); });

      it('only renders rows whose status matches', () => {
        const bodyRows = state.container.querySelectorAll('tbody tr');
        expect(bodyRows.length).toBe(1);
        expect(bodyRows[0].textContent).toContain('https://example.com/b');
      });
    });

    itBehavesLikeEmptyFeed({
      state,
      emptyText: 'No emissions recorded yet.',
      render: () => render({
        counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 },
        rows: [],
      }),
    });
  });
});
