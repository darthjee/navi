import ExtractionsHelper from '../../src/components/pages/helpers/ExtractionsHelper.jsx';
import { renderInAct, useContainer } from '../support/dom.js';
import { itBehavesLikeEmptyFeed, itBehavesLikeHelperFetchStates } from '../support/helper_states.js';

const rows = [
  {
    id: 1, timestamp: '2026-08-30T12:00:00.000Z', originUrl: null, parserType: 'json',
    itemCount: 20, emitsSent: 0, statusBreakdown: { success: 0, failed: 0, dead: 0 }, partial: true,
  },
  {
    id: 2, timestamp: '2026-08-30T12:05:00.000Z', originUrl: 'https://example.com/list?page=2',
    parserType: 'html', itemCount: 20, emitsSent: 3,
    statusBreakdown: { success: 2, failed: 1, dead: 0 }, partial: false,
  },
];

describe('ExtractionsHelper', () => {
  const state = useContainer();

  itBehavesLikeHelperFetchStates({
    state, helper: ExtractionsHelper, errorPrefix: 'Failed to load extractions',
  });

  describe('.render', () => {
    describe('with extraction rows', () => {
      beforeEach(async () => {
        await renderInAct(state.root, ExtractionsHelper.render({ extractedTotal: 40, rows }));
      });

      it('shows the headline extracted total', () => {
        expect(state.container.textContent).toContain('Extracted: 40');
      });

      it('renders the table columns', () => {
        const headers = Array.from(state.container.querySelectorAll('thead th')).map((th) => th.textContent);
        expect(headers).toEqual(['Time', 'Resource', 'Parser', 'Items', 'Emits sent', 'Emit status']);
      });

      it('renders one row per extraction', () => {
        expect(state.container.querySelectorAll('tbody tr').length).toBe(2);
      });

      it('shows emits sent against the item count', () => {
        expect(state.container.textContent).toContain('3 of 20 items emitted');
      });

      it('shows the emit status breakdown and hides zero counts', () => {
        const joinedRow = Array.from(state.container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('example.com/list?page=2'));
        expect(joinedRow.textContent).toContain('success: 2');
        expect(joinedRow.textContent).toContain('failed: 1');
        expect(joinedRow.textContent).not.toContain('dead:');
      });

      it('shows the partial hint for truncated rows', () => {
        const orphanRow = Array.from(state.container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('0 of 20 items emitted'));
        expect(orphanRow.textContent).toContain('counts may be incomplete');
      });

      it('renders a null originUrl as a dash', () => {
        const orphanRow = Array.from(state.container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('0 of 20 items emitted'));
        expect(orphanRow.textContent).toContain('—');
      });

      it('renders the parser type as a badge', () => {
        const badges = Array.from(state.container.querySelectorAll('tbody .badge')).map((b) => b.textContent);
        expect(badges).toContain('json');
        expect(badges).toContain('html');
      });

      it('orders the newest extraction first', () => {
        const firstRow = state.container.querySelector('tbody tr');
        expect(firstRow.textContent).toContain('example.com/list?page=2');
      });
    });

    itBehavesLikeEmptyFeed({
      state,
      emptyText: 'No extractions recorded yet.',
      render: () => renderInAct(state.root, ExtractionsHelper.render({ extractedTotal: 0, rows: [] })),
    });
  });
});
