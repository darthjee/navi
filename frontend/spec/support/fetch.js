// Stubs globalThis.fetch immediately (usable inside an `it`) to resolve with a successful response.
const stubFetchSuccess = (data) => {
  spyOn(globalThis, 'fetch').and.returnValue(
    Promise.resolve({ ok: true, json: () => Promise.resolve(data) })
  );
};

// Stubs globalThis.fetch before each spec to resolve with a successful response.
const mockFetchSuccess = (data) => {
  beforeEach(() => {
    stubFetchSuccess(data);
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

export { mockFetchFailure, mockFetchSuccess, stubFetchSuccess };
