import noop from '../../src/utils/noop.js';

// Stubs globalThis.fetch to resolve with a successful response.
const mockFetchSuccess = (data) => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
    );
  });
};

// Stubs globalThis.fetch to resolve with a failed response.
const mockFetchFailure = (status) => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({ ok: false, status })
    );
  });
};

// Stubs globalThis.fetch with a promise that never resolves (loading state).
const mockFetchPending = () => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
  });
};

export { mockFetchFailure, mockFetchPending, mockFetchSuccess };
