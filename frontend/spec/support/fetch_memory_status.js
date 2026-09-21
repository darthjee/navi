// `MemoryStatus` also mounts `MemoryUsageChart`, which fetches
// `/memory/history.json` on its own. Stub fetch URL-aware so the status
// card gets `statusData` and the chart's history poll gets an empty batch
// (ending its poll loop without throwing on a non-array payload).
// Lives here (not in fetch.js) because fetch.js is shipped verbatim in the
// navi-hey-test image and must not gain memory-specific helpers.
const mockFetchSuccessWithHistory = (statusData) => {
  beforeEach(() => {
    spyOn(globalThis, 'fetch').and.callFake((url) => {
      const data = url.toString().includes('/memory/history.json') ? [] : statusData;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
    });
  });
};

export { mockFetchSuccessWithHistory };
