import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import useFetchData from '../../src/hooks/useFetchData.js';
import noop from '../support/noop.js';

const flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('useFetchData', () => {
  let container;
  let root;
  let fetcher;

  const TestComponent = ({ id }) => {
    const { data, error, loading } = useFetchData(() => fetcher(id), [id]);

    if (loading) return createElement('div', { className: 'loading' }, 'loading');
    if (error) return createElement('div', { className: 'error' }, error);

    return createElement('div', { className: 'data' }, data);
  };

  const render = async (id) => {
    await act(async () => {
      root = root || createRoot(container);
      root.render(createElement(TestComponent, { id }));
    });
  };

  beforeEach(() => {
    root = null;
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    document.body.removeChild(container);
  });

  describe('while loading', () => {
    beforeEach(async () => {
      fetcher = jasmine.createSpy('fetcher').and.returnValue(new Promise(noop));
      await render(1);
    });

    it('reports loading', () => {
      expect(container.querySelector('.loading')).not.toBeNull();
    });

    it('calls the fetcher once', () => {
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('when the fetch succeeds', () => {
    beforeEach(async () => {
      fetcher = jasmine.createSpy('fetcher').and.returnValue(Promise.resolve('result-1'));
      await render(1);
      await flushAsync();
    });

    it('stops loading', () => {
      expect(container.querySelector('.loading')).toBeNull();
    });

    it('exposes the data', () => {
      expect(container.querySelector('.data').textContent).toBe('result-1');
    });
  });

  describe('when the fetch fails', () => {
    beforeEach(async () => {
      fetcher = jasmine.createSpy('fetcher').and.returnValue(Promise.reject(new Error('boom')));
      await render(1);
      await flushAsync();
    });

    it('stops loading', () => {
      expect(container.querySelector('.loading')).toBeNull();
    });

    it('exposes the error message', () => {
      expect(container.querySelector('.error').textContent).toBe('boom');
    });
  });

  describe('when a dependency changes', () => {
    beforeEach(async () => {
      fetcher = jasmine.createSpy('fetcher').and.callFake(
        (id) => Promise.resolve(`result-${id}`)
      );
      await render(1);
      await flushAsync();
    });

    it('goes back to loading while refetching', async () => {
      fetcher.and.returnValue(new Promise(noop));
      await render(2);

      expect(container.querySelector('.loading')).not.toBeNull();
    });

    it('refetches and exposes the new data', async () => {
      await render(2);
      await flushAsync();

      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(container.querySelector('.data').textContent).toBe('result-2');
    });
  });

  describe('when a dependency does not change', () => {
    beforeEach(async () => {
      fetcher = jasmine.createSpy('fetcher').and.returnValue(Promise.resolve('result-1'));
      await render(1);
      await flushAsync();
      await render(1);
      await flushAsync();
    });

    it('does not refetch', () => {
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });
});
