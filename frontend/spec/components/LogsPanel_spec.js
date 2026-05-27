import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LogsPanel from '../../src/components/elements/LogsPanel.jsx';

describe('LogsPanel', () => {
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

  describe('with no logs', () => {
    beforeEach(async () => {
      await act(async () => {
        root.render(createElement(LogsPanel, { logs: [], bottomRef }));
      });
    });

    it('renders the terminal container', () => {
      expect(container.querySelector('.bg-dark')).not.toBeNull();
    });

    it('applies text-light class', () => {
      expect(container.querySelector('.bg-dark.text-light')).not.toBeNull();
    });

    it('renders no log entries', () => {
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
      await act(async () => {
        root.render(createElement(LogsPanel, { logs, bottomRef }));
      });
    });

    it('renders a row for each log entry', () => {
      const rows = container.querySelectorAll('.bg-dark > div');
      expect(rows.length).toBe(logs.length + 1); // +1 for sentinel div
    });

    it('shows message text', () => {
      expect(container.textContent).toContain('Started');
      expect(container.textContent).toContain('Warning');
    });

    it('shows timestamps', () => {
      expect(container.textContent).toContain('[2024-01-01T00:00:00Z]');
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
  });
});
