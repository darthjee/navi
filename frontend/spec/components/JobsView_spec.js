import JobsView from '../../src/components/JobsView.jsx';

describe('JobsView', () => {
  const navigate = jasmine.createSpy('navigate');

  beforeEach(() => {
    navigate.calls.reset();
  });

  describe('#activeFilters', () => {
    describe('when the search string contains class filters', () => {
      it('parses the class array', () => {
        const view = new JobsView('failed', '?filters%5Bclass%5D%5B%5D=ResourceRequestJob', navigate);
        expect(view.activeFilters.class).toEqual(['ResourceRequestJob']);
      });
    });

    describe('when the search string is empty', () => {
      it('returns empty class array', () => {
        const view = new JobsView('failed', '', navigate);
        expect(view.activeFilters.class).toEqual([]);
      });
    });
  });

  describe('#filterQuery', () => {
    describe('when active filters are present', () => {
      it('serialises the class filters into a query string', () => {
        const view = new JobsView('failed', '?filters%5Bclass%5D%5B%5D=ResourceRequestJob', navigate);
        expect(view.filterQuery).toContain('filters');
        expect(view.filterQuery).toContain('ResourceRequestJob');
      });
    });

    describe('when no active filters are present', () => {
      it('returns an empty string', () => {
        const view = new JobsView('failed', '', navigate);
        expect(view.filterQuery).toBe('');
      });
    });
  });

  describe('#handleClassFilterChange', () => {
    describe('when checking a class with a status set', () => {
      it('navigates to the status path with the new filter query', () => {
        const view = new JobsView('failed', '', navigate);
        view.handleClassFilterChange('ResourceRequestJob', true);
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('/jobs/failed'));
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('ResourceRequestJob'));
      });
    });

    describe('when checking a class with no status set', () => {
      it('navigates to /jobs with the new filter query', () => {
        const view = new JobsView(undefined, '', navigate);
        view.handleClassFilterChange('ResourceRequestJob', true);
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('/jobs'));
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('ResourceRequestJob'));
        const arg = navigate.calls.mostRecent().args[0];
        expect(arg).not.toContain('/jobs/undefined');
      });
    });

    describe('when unchecking the only active class', () => {
      it('navigates to the base path without a query string', () => {
        const view = new JobsView(
          'failed',
          '?filters%5Bclass%5D%5B%5D=ResourceRequestJob',
          navigate
        );
        view.handleClassFilterChange('ResourceRequestJob', false);
        expect(navigate).toHaveBeenCalledWith('/jobs/failed');
      });
    });

    describe('when unchecking one of two active classes', () => {
      it('keeps the remaining class in the query string', () => {
        const view = new JobsView(
          'failed',
          '?filters%5Bclass%5D%5B%5D=ResourceRequestJob&filters%5Bclass%5D%5B%5D=AssetDownloadJob',
          navigate
        );
        view.handleClassFilterChange('ResourceRequestJob', false);
        const arg = navigate.calls.mostRecent().args[0];
        expect(arg).not.toContain('ResourceRequestJob');
        expect(arg).toContain('AssetDownloadJob');
      });
    });

    describe('when used as a detached callback', () => {
      it('still works because it is pre-bound', () => {
        const view = new JobsView('failed', '', navigate);
        const cb = view.handleClassFilterChange;
        cb('ResourceRequestJob', true);
        expect(navigate).toHaveBeenCalled();
      });
    });
  });
});
