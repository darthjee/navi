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

// Stubs globalThis.fetch (usable inside an `it` or `beforeEach`) with a bounded
// sequence of successful JSON payloads. The final payload is repeated for any
// extra call, so for polling controllers it must be an empty batch to stop the
// controller's immediate re-poll on success.
const mockResponses = (payloads) => {
  let call = 0;
  spyOn(globalThis, 'fetch').and.callFake(() => {
    const payload = payloads[Math.min(call, payloads.length - 1)];
    call += 1;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
  });
};

export { mockFetchFailure, mockFetchSuccess, mockResponses, stubFetchSuccess };
