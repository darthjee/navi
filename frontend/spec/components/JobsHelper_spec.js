import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import JobsHelper from '../../src/components/helpers/JobsHelper.jsx';

describe('JobsHelper', () => {
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

  const render = async (element) => {
    await act(async () => {
      root.render(
        createElement(MemoryRouter, { initialEntries: ['/jobs'] }, element)
      );
    });
  };

  describe('.renderLoading', () => {
    beforeEach(async () => {
      await render(JobsHelper.renderLoading());
    });

    it('renders a spinner', () => {
      expect(container.querySelector('.spinner-border')).not.toBeNull();
    });

    it('shows loading text', () => {
      expect(container.textContent).toContain('Loading jobs');
    });
  });

  describe('.renderError', () => {
    beforeEach(async () => {
      await render(JobsHelper.renderError('HTTP 503'));
    });

    it('renders an alert', () => {
      expect(container.querySelector('.alert-danger')).not.toBeNull();
    });

    it('includes the error message', () => {
      expect(container.textContent).toContain('HTTP 503');
    });
  });

  describe('.renderStatusTabs', () => {
    beforeEach(async () => {
      await render(JobsHelper.renderStatusTabs('failed', ''));
    });

    it('renders a tab for each status', () => {
      expect(container.querySelectorAll('.nav-item').length).toBe(5);
    });

    it('marks the active tab', () => {
      const active = container.querySelector('.nav-link.active');
      expect(active).not.toBeNull();
      expect(active.textContent).toBe('failed');
    });
  });

  describe('.renderStatusTab', () => {
    describe('when filter query is present', () => {
      beforeEach(async () => {
        await render(JobsHelper.renderStatusTab('failed', 'failed', 'filters[class][]=ResourceRequestJob'));
      });

      it('includes the filter query in the link href', () => {
        const link = container.querySelector('a');
        expect(link.getAttribute('href')).toContain('filters[class][]=ResourceRequestJob');
      });
    });
  });

  describe('.renderFilterPanel', () => {
    const activeFilters = { class: ['ResourceRequestJob'] };
    const handler = jasmine.createSpy('handler');

    beforeEach(async () => {
      await render(JobsHelper.renderFilterPanel(activeFilters, handler));
    });

    it('renders a checkbox for each job class', () => {
      expect(container.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0);
    });

    it('checks the active class checkbox', () => {
      const checked = Array.from(container.querySelectorAll('input[type="checkbox"]'))
        .filter((el) => el.checked);
      expect(checked.length).toBe(1);
    });
  });

  describe('.renderFilterCheckbox', () => {
    const handler = jasmine.createSpy('handler');

    beforeEach(async () => {
      await render(
        JobsHelper.renderFilterCheckbox('ResourceRequestJob', { class: ['ResourceRequestJob'] }, handler)
      );
    });

    it('renders a checked checkbox for the active class', () => {
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox.checked).toBeTrue();
    });

    it('renders a label with the class name', () => {
      expect(container.textContent).toContain('ResourceRequestJob');
    });
  });
});
