import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('App', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  describe('while loading', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}));
      await act(async () => {
        root = createRoot(container);
        root.render(createElement(App));
      });
    });

    it('renders a spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(container.textContent).toContain('Loading stats');
    });
  });

  describe('when stats load successfully', () => {
    const stats = {
      workers: { idle: 3, busy: 1 },
      jobs: { enqueued: 5, processing: 2, failed: 1, finished: 10, dead: 0 },
    };

    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: true, json: () => Promise.resolve(stats) })
      );
      await act(async () => {
        root = createRoot(container);
        root.render(createElement(App));
      });
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders the Workers section', () => {
      expect(container.textContent).toContain('Workers');
    });

    it('renders the Jobs section', () => {
      expect(container.textContent).toContain('Jobs');
    });

    it('shows the idle worker count', () => {
      const cards = container.querySelectorAll('.card');
      const idleCard = Array.from(cards).find((c) => c.textContent.includes('Idle'));
      expect(idleCard).not.toBeNull();
      expect(idleCard.textContent).toContain('3');
    });

    it('shows the busy worker count', () => {
      const cards = container.querySelectorAll('.card');
      const busyCard = Array.from(cards).find((c) => c.textContent.includes('Busy'));
      expect(busyCard).not.toBeNull();
      expect(busyCard.textContent).toContain('1');
    });

    it('shows all job stat items', () => {
      const text = container.textContent;
      expect(text).toContain('Enqueued');
      expect(text).toContain('Processing');
      expect(text).toContain('Failed');
      expect(text).toContain('Finished');
      expect(text).toContain('Dead');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      spyOn(globalThis, 'fetch').and.returnValue(
        Promise.resolve({ ok: false, status: 503 })
      );
      await act(async () => {
        root = createRoot(container);
        root.render(createElement(App));
      });
      await flushAsync();
    });

    it('does not show a spinner', () => {
      expect(container.querySelector('.spinner-border')).toBeNull();
    });

    it('renders an error alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('shows a descriptive error message', () => {
      expect(container.textContent).toContain('Failed to load stats');
    });

    it('includes the error details in the message', () => {
      expect(container.textContent).toContain('HTTP 503');
    });
  });
});
