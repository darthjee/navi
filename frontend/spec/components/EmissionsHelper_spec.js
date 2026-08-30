import { act } from 'react';
import { createRoot } from 'react-dom/client';
import EmissionsHelper from '../../src/components/pages/helpers/EmissionsHelper.jsx';
import noop from '../../src/utils/noop.js';

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

  const render = async (props) => {
    await act(async () => {
      root.render(EmissionsHelper.render({
        counts, rows, statusFilter: 'all', onStatusFilterChange: noop, ...props,
      }));
    });
  };

  describe('.renderLoading', () => {
    beforeEach(async () => {
      await act(async () => { root.render(EmissionsHelper.renderLoading()); });
    });

    it('renders the loading spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });
  });

  describe('.renderError', () => {
    beforeEach(async () => {
      await act(async () => { root.render(EmissionsHelper.renderError('boom')); });
    });

    it('renders the error alert with the prefix', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
      expect(container.textContent).toContain('Failed to load emissions');
      expect(container.textContent).toContain('boom');
    });
  });

  describe('.render', () => {
    describe('the counts strip', () => {
      beforeEach(async () => { await render(); });

      it('shows every emission count', () => {
        const text = container.textContent;
        expect(text).toContain('Extracted: 5');
        expect(text).toContain('Emitted: 3');
        expect(text).toContain('Failed: 1');
        expect(text).toContain('Dead: 1');
      });
    });

    describe('with the "all" filter', () => {
      beforeEach(async () => { await render({ statusFilter: 'all' }); });

      it('renders one row per emission', () => {
        expect(container.querySelectorAll('tbody tr').length).toBe(3);
      });

      it('renders the feed columns', () => {
        const headers = Array.from(container.querySelectorAll('thead th')).map((th) => th.textContent);
        expect(headers).toEqual(['Time', 'Status', 'Method', 'Target URL', 'HTTP', 'Item', 'Error']);
      });

      it('maps success to a success badge', () => {
        const badges = Array.from(container.querySelectorAll('tbody .badge')).map((b) => b.className);
        expect(badges.some((c) => c.includes('text-bg-success'))).toBeTrue();
      });

      it('maps failed to a warning badge', () => {
        const badges = Array.from(container.querySelectorAll('tbody .badge')).map((b) => b.className);
        expect(badges.some((c) => c.includes('text-bg-warning'))).toBeTrue();
      });

      it('maps dead to a dark badge', () => {
        const badges = Array.from(container.querySelectorAll('tbody .badge')).map((b) => b.className);
        expect(badges.some((c) => c.includes('text-bg-dark'))).toBeTrue();
      });

      it('renders missing httpStatus and itemRef as a dash', () => {
        const deadRow = Array.from(container.querySelectorAll('tbody tr'))
          .find((tr) => tr.textContent.includes('gave up'));
        expect(deadRow.textContent).toContain('—');
      });

      it('orders the newest emission first', () => {
        const firstRow = container.querySelector('tbody tr');
        expect(firstRow.textContent).toContain('https://example.com/c');
      });
    });

    describe('with the "failed" filter', () => {
      beforeEach(async () => { await render({ statusFilter: 'failed' }); });

      it('only renders rows whose status matches', () => {
        const bodyRows = container.querySelectorAll('tbody tr');
        expect(bodyRows.length).toBe(1);
        expect(bodyRows[0].textContent).toContain('https://example.com/b');
      });
    });

    describe('with an empty feed', () => {
      beforeEach(async () => {
        await act(async () => {
          root.render(EmissionsHelper.render({
            counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 },
            rows: [],
            statusFilter: 'all',
            onStatusFilterChange: noop,
          }));
        });
      });

      it('shows the empty state message', () => {
        expect(container.textContent).toContain('No emissions recorded yet.');
      });

      it('does not render a table', () => {
        expect(container.querySelector('table')).toBeNull();
      });
    });
  });
});
