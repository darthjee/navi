import JobsController from '../../src/components/controllers/JobsController.jsx';

describe('JobsController', () => {
  const navigate = jasmine.createSpy('navigate');

  beforeEach(() => {
    navigate.calls.reset();
  });

  describe('#activeFilters', () => {
    describe('when the search string contains class filters', () => {
      it('parses the class array', () => {
        const view = new JobsController('failed', '?filters%5Bclass%5D%5B%5D=ResourceRequestJob', navigate);
        expect(view.activeFilters.class).toEqual(['ResourceRequestJob']);
      });
    });

    describe('when the search string is empty', () => {
      it('returns empty class array', () => {
        const view = new JobsController('failed', '', navigate);
        expect(view.activeFilters.class).toEqual([]);
      });
    });
  });

  describe('#filterQuery', () => {
    describe('when active filters are present', () => {
      it('serialises the class filters into a query string', () => {
        const view = new JobsController('failed', '?filters%5Bclass%5D%5B%5D=ResourceRequestJob', navigate);
        expect(view.filterQuery).toContain('filters');
        expect(view.filterQuery).toContain('ResourceRequestJob');
      });
    });

    describe('when no active filters are present', () => {
      it('returns an empty string', () => {
        const view = new JobsController('failed', '', navigate);
        expect(view.filterQuery).toBe('');
      });
    });
  });

  describe('#handleClassFilterChange', () => {
    describe('when checking a class with a status set', () => {
      it('navigates to the status path with the new filter query', () => {
        const view = new JobsController('failed', '', navigate);
        view.handleClassFilterChange('ResourceRequestJob', true);
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('/jobs/failed'));
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('ResourceRequestJob'));
      });
    });

    describe('when checking a class with no status set', () => {
      it('navigates to /jobs with the new filter query', () => {
        const view = new JobsController(undefined, '', navigate);
        view.handleClassFilterChange('ResourceRequestJob', true);
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('/jobs'));
        expect(navigate).toHaveBeenCalledWith(jasmine.stringContaining('ResourceRequestJob'));
        const arg = navigate.calls.mostRecent().args[0];
        expect(arg).not.toContain('/jobs/undefined');
      });
    });

    describe('when unchecking the only active class', () => {
      it('navigates to the base path without a query string', () => {
        const view = new JobsController(
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
        const view = new JobsController(
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
        const view = new JobsController('failed', '', navigate);
        const cb = view.handleClassFilterChange;
        cb('ResourceRequestJob', true);
        expect(navigate).toHaveBeenCalled();
      });
    });
  });

  describe('#buildLoad', () => {
    describe('when status is provided', () => {
      it('fetches from /jobs/:status.json', async () => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        );
        const view = new JobsController('failed', '', navigate);
        await view.buildLoad();
        expect(globalThis.fetch).toHaveBeenCalledWith('/jobs/failed.json');
      });
    });

    describe('when status is undefined', () => {
      it('fetches all status endpoints', async () => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
        );
        const view = new JobsController(undefined, '', navigate);
        await view.buildLoad();
        expect(globalThis.fetch.calls.count()).toBe(5);
      });
    });
  });

  describe('#buildSuccessHandler', () => {
    describe('when not cancelled', () => {
      it('calls setJobs and clears the error', () => {
        const view = new JobsController('failed', '', navigate);
        const state = { cancelled: false };
        const setJobs = jasmine.createSpy('setJobs');
        const setError = jasmine.createSpy('setError');
        const handler = view.buildSuccessHandler(state, setJobs, setError);

        handler([{ id: 'abc' }]);

        expect(setJobs).toHaveBeenCalledWith([{ id: 'abc' }]);
        expect(setError).toHaveBeenCalledWith(null);
      });
    });

    describe('when cancelled', () => {
      it('does not call setJobs or setError', () => {
        const view = new JobsController('failed', '', navigate);
        const state = { cancelled: true };
        const setJobs = jasmine.createSpy('setJobs');
        const setError = jasmine.createSpy('setError');
        const handler = view.buildSuccessHandler(state, setJobs, setError);

        handler([{ id: 'abc' }]);

        expect(setJobs).not.toHaveBeenCalled();
        expect(setError).not.toHaveBeenCalled();
      });
    });
  });

  describe('#buildEffect', () => {
    describe('when the fetch succeeds', () => {
      it('calls setJobs with the returned data and clears loading', async () => {
        spyOn(globalThis, 'fetch').and.returnValue(
          Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 'x' }]) })
        );
        const view = new JobsController('failed', '', navigate);
        const setJobs = jasmine.createSpy('setJobs');
        const setError = jasmine.createSpy('setError');
        const setLoading = jasmine.createSpy('setLoading');

        const cleanup = view.buildEffect(setJobs, setError, setLoading)();
        await new Promise((r) => setTimeout(r, 0));

        expect(setJobs).toHaveBeenCalledWith([{ id: 'x' }]);
        expect(setError).toHaveBeenCalledWith(null);
        expect(setLoading).toHaveBeenCalledWith(false);
        cleanup();
      });
    });

    describe('when cancelled before the fetch resolves', () => {
      it('does not update state', async () => {
        let resolve;
        spyOn(globalThis, 'fetch').and.returnValue(
          new Promise((r) => { resolve = r; })
        );
        const view = new JobsController('failed', '', navigate);
        const setJobs = jasmine.createSpy('setJobs');
        const setError = jasmine.createSpy('setError');
        const setLoading = jasmine.createSpy('setLoading');

        const cleanup = view.buildEffect(setJobs, setError, setLoading)();
        cleanup();
        resolve({ ok: true, json: () => Promise.resolve([]) });
        await new Promise((r) => setTimeout(r, 0));

        expect(setJobs).not.toHaveBeenCalled();
      });
    });
  });
});
