import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import JobsHelper from '../../src/components/pages/helpers/JobsHelper.jsx';
import { renderInAct, useContainer } from '../support/dom.js';
import { itBehavesLikeHelperFetchStates } from '../support/helper_states.js';

describe('JobsHelper', () => {
  const state = useContainer();

  const withRouter = (element) => createElement(MemoryRouter, { initialEntries: ['/jobs'] }, element);

  const render = (element) => renderInAct(state.root, withRouter(element));

  itBehavesLikeHelperFetchStates({
    state,
    helper: JobsHelper,
    wrap: withRouter,
    loadingText: 'Loading jobs',
    errorMessage: 'HTTP 503',
  });

  describe('.renderStatusTabs', () => {
    beforeEach(async () => {
      await render(JobsHelper.renderStatusTabs('failed', ''));
    });

    it('renders a tab for each status', () => {
      expect(state.container.querySelectorAll('.nav-item').length).toBe(5);
    });

    it('marks the active tab', () => {
      const active = state.container.querySelector('.nav-link.active');
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
        const link = state.container.querySelector('a');
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
      expect(state.container.querySelectorAll('input[type="checkbox"]').length).toBeGreaterThan(0);
    });

    it('checks the active class checkbox', () => {
      const checked = Array.from(state.container.querySelectorAll('input[type="checkbox"]'))
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
      const checkbox = state.container.querySelector('input[type="checkbox"]');
      expect(checkbox.checked).toBeTrue();
    });

    it('renders a label with the class name', () => {
      expect(state.container.textContent).toContain('ResourceRequestJob');
    });
  });
});
