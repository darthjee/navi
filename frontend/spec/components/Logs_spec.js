import { createElement } from 'react';
import { act } from 'react';
import Logs from '../../src/components/elements/Logs.jsx';
import noop from '../../src/utils/noop.js';
import { useContainer } from '../support/dom.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

const render = async (root, fetchLogs) => {
  await act(async () => {
    root.render(createElement(Logs, { fetchLogs }));
  });
};

describe('Logs', () => {
  const state = useContainer();

  describe('initial render', () => {
    beforeEach(async () => {
      const fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(new Promise(noop));
      await render(state.root, fetchLogs);
    });

    it('renders the terminal container', () => {
      expect(state.container.querySelector('.bg-dark')).not.toBeNull();
    });

    it('applies the text-light class to the terminal container', () => {
      expect(state.container.querySelector('.bg-dark.text-light')).not.toBeNull();
    });

    it('does not show any log entries', () => {
      const logEntries = Array.from(state.container.querySelectorAll('.bg-dark > div'))
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

    let fetchLogs;

    beforeEach(async () => {
      let callCount = 0;
      fetchLogs = jasmine.createSpy('fetchLogs').and.callFake(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(logs);
        return new Promise(noop);
      });
      await render(state.root, fetchLogs);
      await flushAsync();
    });

    it('renders the message for each log entry', () => {
      expect(state.container.textContent).toContain('Server started');
      expect(state.container.textContent).toContain('High memory usage');
      expect(state.container.textContent).toContain('Connection refused');
      expect(state.container.textContent).toContain('Cache hit');
    });

    it('shows the timestamp for each entry', () => {
      expect(state.container.textContent).toContain('2024-01-01T00:00:00Z');
      expect(state.container.textContent).toContain('2024-01-01T00:00:01Z');
    });

    it('shows the level label for each entry', () => {
      expect(state.container.textContent).toContain('[info]');
      expect(state.container.textContent).toContain('[warn]');
      expect(state.container.textContent).toContain('[error]');
      expect(state.container.textContent).toContain('[debug]');
    });

    it('applies text-warning class to warn entries', () => {
      expect(state.container.querySelector('.text-warning')).not.toBeNull();
    });

    it('applies text-danger class to error entries', () => {
      expect(state.container.querySelector('.text-danger')).not.toBeNull();
    });

    it('applies the text-debug class to debug entries', () => {
      expect(state.container.querySelector('.text-debug')).not.toBeNull();
    });

    it('polls again immediately after receiving entries', () => {
      expect(fetchLogs.calls.count()).toBeGreaterThan(1);
    });

    it('passes the newest log id as last_id on the next poll', () => {
      expect(fetchLogs.calls.argsFor(1)[0]).toEqual({ lastId: 4 });
    });
  });

  describe('when the response is empty', () => {
    let fetchLogs;

    beforeEach(async () => {
      fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(Promise.resolve([]));
      await render(state.root, fetchLogs);
      await flushAsync();
    });

    it('does not render any log entries', () => {
      const logEntries = Array.from(state.container.querySelectorAll('.bg-dark > div'))
        .filter((el) => el.textContent.trim() !== '');
      expect(logEntries.length).toBe(0);
    });

    it('does not poll again immediately', () => {
      expect(fetchLogs.calls.count()).toBe(1);
    });
  });

  describe('when the fetch fails', () => {
    let fetchLogs;

    beforeEach(async () => {
      fetchLogs = jasmine.createSpy('fetchLogs').and.returnValue(Promise.reject(new Error('HTTP 500')));
      await render(state.root, fetchLogs);
      await flushAsync();
    });

    it('renders the terminal container', () => {
      expect(state.container.querySelector('.bg-dark')).not.toBeNull();
    });

    it('does not render any log entries', () => {
      const logEntries = Array.from(state.container.querySelectorAll('.bg-dark > div'))
        .filter((el) => el.textContent.trim() !== '');
      expect(logEntries.length).toBe(0);
    });

    it('does not poll again immediately', () => {
      expect(fetchLogs.calls.count()).toBe(1);
    });
  });
});
