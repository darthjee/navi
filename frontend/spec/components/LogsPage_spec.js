import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import LogsPage from '../../src/components/LogsPage.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const render = async (root) => {
  await act(async () => {
    root.render(createElement(LogsPage));
  });
};

describe('LogsPage', () => {
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

  describe('initial render', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}));
      await render(root);
    });

    it('renders the terminal container', () => {
      expect(container.querySelector('.bg-dark')).not.toBeNull();
    });

    it('applies the text-light class to the terminal container', () => {
      expect(container.querySelector('.bg-dark.text-light')).not.toBeNull();
    });

    it('does not show any log entries', () => {
      const logEntries = Array.from(container.querySelectorAll('.bg-dark > div'))
        .filter((el) => el.textContent.trim() !== '');
      expect(logEntries.length).toBe(0);
    });
  });

  describe('when log entries are returned', () => {
    const logs = [
      { id: 1, level: 'info', message: 'Server started', timestamp: '2024-01-01T00:00:00Z' },
      { id: 2, level: 'warn', message: 'High memory usage', timestamp: '2024-01-01T00:00:01Z' },
      { id: 3, level: 'error', message: 'Connection refused', timestamp: '2024-01-01T00:00:02Z' },
      { id: 4, level: 'debug', message: 'Cache hit', timestamp: '2024-01-01T00:00:03Z' },
    ];

    beforeEach(async () => {
      let callCount = 0;
      spyOn(globalThis, 'fetch').and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(logs) });
        }
        return new Promise(() => {}); // Prevent further polling
      });
      await render(root);
      await flushAsync();
    });

    it('renders the message for each log entry', () => {
      expect(container.textContent).toContain('Server started');
      expect(container.textContent).toContain('High memory usage');
      expect(container.textContent).toContain('Connection refused');
      expect(container.textContent).toContain('Cache hit');
    });

    it('shows the timestamp for each entry', () => {
      expect(container.textContent).toContain('2024-01-01T00:00:00Z');
      expect(container.textContent).toContain('2024-01-01T00:00:01Z');
    });

    it('shows the level label for each entry', () => {
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

    it('applies a colour style to debug entries', () => {
      const entries = Array.from(container.querySelectorAll('.bg-dark > div'));
      const debugEntry = entries.find((el) => el.textContent.includes('Cache hit'));
      expect(debugEntry).not.toBeNull();
      expect(debugEntry.style.color).not.toBe('');
    });

    it('does not apply a colour style to info entries', () => {
      const entries = Array.from(container.querySelectorAll('.bg-dark > div'));
      const infoEntry = entries.find((el) => el.textContent.includes('Server started'));
      expect(infoEntry).not.toBeNull();
      expect(infoEntry.style.color).toBe('');
    });

    it('polls again immediately after receiving entries', () => {
      expect(globalThis.fetch.calls.count()).toBeGreaterThan(1);
    });

    it('passes the newest log id as last_id on the next poll', () => {
      const secondCallUrl = globalThis.fetch.calls.argsFor(1)[0];
      expect(secondCallUrl).toContain('last_id=4');
    });
  });

  describe('when the response is empty', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve([]) }),
      );
      await render(root);
      await flushAsync();
    });

    it('does not render any log entries', () => {
      const logEntries = Array.from(container.querySelectorAll('.bg-dark > div'))
        .filter((el) => el.textContent.trim() !== '');
      expect(logEntries.length).toBe(0);
    });

    it('does not poll again immediately', () => {
      expect(globalThis.fetch.calls.count()).toBe(1);
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 500 }),
      );
      await render(root);
      await flushAsync();
    });

    it('renders the terminal container', () => {
      expect(container.querySelector('.bg-dark')).not.toBeNull();
    });

    it('does not render any log entries', () => {
      const logEntries = Array.from(container.querySelectorAll('.bg-dark > div'))
        .filter((el) => el.textContent.trim() !== '');
      expect(logEntries.length).toBe(0);
    });

    it('does not poll again immediately', () => {
      expect(globalThis.fetch.calls.count()).toBe(1);
    });
  });
});
