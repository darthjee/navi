// Stubs globalThis.fetch immediately (usable inside an `it` or `beforeEach`) to resolve
// with a successful response. `headers` (a Headers instance) is added to the response when given.
const stubFetchSuccess = (data, headers) => {
  const response = { ok: true, json: () => Promise.resolve(data) };
  if (headers) {
    response.headers = headers;
  }
  spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve(response));
};

// Stubs globalThis.fetch before each spec to resolve with a successful response.
// Call at describe level.
const mockFetchSuccess = (data, headers) => {
  beforeEach(() => {
    stubFetchSuccess(data, headers);
  });
};

// Stubs globalThis.fetch before each spec to resolve with a failed response.
// Call at describe level.
const mockFetchFailure = (status) => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve({ ok: false, status })
    );
  });
};

// Stubs globalThis.fetch before each spec with a promise that never resolves,
// keeping the component in its loading state. Call at describe level.
const mockFetchPending = () => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.returnValue(new Promise(() => {}));
  });
};

// Builds the PAGE / PAGE-SIZE / PAGES response headers (values as strings).
const paginationHeaders = ({ page = 1, pageSize = 10, pages = 1 } = {}) => new Headers({
  PAGE: String(page),
  'PAGE-SIZE': String(pageSize),
  PAGES: String(pages),
});

export {
  mockFetchFailure,
  mockFetchPending,
  mockFetchSuccess,
  paginationHeaders,
  stubFetchSuccess,
};
