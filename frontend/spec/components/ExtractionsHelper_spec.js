import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ExtractionsHelper from '../../src/components/pages/helpers/ExtractionsHelper.jsx';

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
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  describe('.renderLoading', () => {
    beforeEach(async () => {
      await act(async () => { root.render(ExtractionsHelper.renderLoading()); });
    });

    it('renders the loading spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });
  });

  describe('.renderError', () => {
    beforeEach(async () => {
      await act(async () => { root.render(ExtractionsHelper.renderError('boom')); });
    });

    it('renders the error alert with the prefix', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
      expect(container.textContent).toContain('Failed to load extractions');
      expect(container.textContent).toContain('boom');
    });
  });

  describe('.render', () => {
    describe('with extraction rows', () => {
      beforeEach(async () => {
        await act(async () => {
          root.render(ExtractionsHelper.render({ extractedTotal: 40, rows }));
        });
      });

      it('shows the headline extracted total', () => {
        expect(container.textContent).toContain('Extracted: 40');
      });

      it('renders the table columns', () => {
        const headers = Array.from(container.querySelectorAll('thead th')).map((th) => th.textContent);
        expect(headers).toEqual(['Time', 'Resource', 'Parser', 'Items', 'Emits sent', 'Emit status']);
      });

      it('renders one row per extraction', () => {
        expect(container.querySelectorAll('tbody tr').length).toBe(2);
      });

      it('shows emits sent against the item count', () => {
        expect(container.textContent).toContain('3 of 20 items emitted');
      });

      it('shows the emit status breakdown and hides zero counts', () => {
        const joinedRow = Array.from(container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('example.com/list?page=2'));
        expect(joinedRow.textContent).toContain('success: 2');
        expect(joinedRow.textContent).toContain('failed: 1');
        expect(joinedRow.textContent).not.toContain('dead:');
      });

      it('shows the partial hint for truncated rows', () => {
        const orphanRow = Array.from(container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('0 of 20 items emitted'));
        expect(orphanRow.textContent).toContain('counts may be incomplete');
      });

      it('renders a null originUrl as a dash', () => {
        const orphanRow = Array.from(container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('0 of 20 items emitted'));
        expect(orphanRow.textContent).toContain('—');
      });

      it('renders the parser type as a badge', () => {
        const badges = Array.from(container.querySelectorAll('tbody .badge')).map((b) => b.textContent);
        expect(badges).toContain('json');
        expect(badges).toContain('html');
      });

      it('orders the newest extraction first', () => {
        const firstRow = container.querySelector('tbody tr');
        expect(firstRow.textContent).toContain('example.com/list?page=2');
      });
    });

    describe('with no extraction rows', () => {
      beforeEach(async () => {
        await act(async () => {
          root.render(ExtractionsHelper.render({ extractedTotal: 0, rows: [] }));
        });
      });

      it('shows the empty state message', () => {
        expect(container.textContent).toContain('No extractions recorded yet.');
      });

      it('does not render a table', () => {
        expect(container.querySelector('table')).toBeNull();
      });
    });
  });
});
