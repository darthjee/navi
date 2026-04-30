import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LogsPageHelper from '../../src/components/helpers/LogsPageHelper.jsx';

describe('LogsPageHelper', () => {
  describe('.build', () => {
    it('returns a LogsPageHelper instance', () => {
      const helper = LogsPageHelper.build([]);
      expect(helper).toBeInstanceOf(LogsPageHelper);
    });
  });

  describe('#render', () => {
    let container;
    let root;
    const bottomRef = { current: null };

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
    });

    afterEach(async () => {
      await act(async () => { root.unmount(); });
      document.body.removeChild(container);
    });

    describe('with no log entries', () => {
      beforeEach(async () => {
        const helper = LogsPageHelper.build([]);
        await act(async () => { root.render(helper.render(bottomRef)); });
      });

      it('renders the terminal container', () => {
        expect(container.querySelector('.bg-dark')).not.toBeNull();
      });

      it('applies the text-light class', () => {
        expect(container.querySelector('.bg-dark.text-light')).not.toBeNull();
      });

      it('renders no log rows', () => {
        const rows = Array.from(container.querySelectorAll('.bg-dark > div'))
          .filter((el) => el.textContent.trim() !== '');
        expect(rows.length).toBe(0);
      });
    });

    describe('with log entries', () => {
      const logs = [
        { id: 1, level: 'info', message: 'Started', timestamp: '2024-01-01T00:00:00Z' },
        { id: 2, level: 'warn', message: 'Warning', timestamp: '2024-01-01T00:00:01Z' },
        { id: 3, level: 'error', message: 'Failed', timestamp: '2024-01-01T00:00:02Z' },
        { id: 4, level: 'debug', message: 'Trace', timestamp: '2024-01-01T00:00:03Z' },
      ];

      beforeEach(async () => {
        const helper = LogsPageHelper.build(logs);
        await act(async () => { root.render(helper.render(bottomRef)); });
      });

      it('renders a row for each log entry', () => {
        const rows = container.querySelectorAll('.bg-dark > div');
        expect(rows.length).toBe(logs.length + 1); // +1 for bottomRef sentinel div
      });

      it('shows the message text', () => {
        expect(container.textContent).toContain('Started');
        expect(container.textContent).toContain('Warning');
      });

      it('shows the timestamp in brackets', () => {
        expect(container.textContent).toContain('[2024-01-01T00:00:00Z]');
      });

      it('shows the level in brackets', () => {
        expect(container.textContent).toContain('[info]');
        expect(container.textContent).toContain('[warn]');
        expect(container.textContent).toContain('[error]');
        expect(container.textContent).toContain('[debug]');
      });

      it('applies text-warning class to warn entries', () => {
        expect(container.querySelector('.text-warning')).not.toBeNull();
      });

      it('applies text-danger class to error entries', () => {
        expect(container.querySelector('.text-danger')).not.toBeNull();
      });

      it('applies text-debug class to debug entries', () => {
        expect(container.querySelector('.text-debug')).not.toBeNull();
      });

      it('does not apply a CSS colour class to info entries', () => {
        const rows = Array.from(container.querySelectorAll('.bg-dark > div'));
        const infoRow = rows.find((el) => el.textContent.includes('Started'));
        expect(infoRow).not.toBeNull();
        expect(infoRow.classList.contains('text-debug')).toBeFalse();
        expect(infoRow.classList.contains('text-warning')).toBeFalse();
        expect(infoRow.classList.contains('text-danger')).toBeFalse();
      });
    });
  });
});

