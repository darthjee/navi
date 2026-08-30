import ExtractionsController from '../../../src/components/pages/controllers/ExtractionsController.jsx';
import noop from '../../../src/utils/noop.js';

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

const mockPair = (extractions, emissions) => {
  spyOn(globalThis, 'fetch').and.callFake((url) => {
    const payload = url.startsWith('/extractions.json') ? extractions : emissions;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) });
  });
};

describe('ExtractionsController', () => {
  describe('.build', () => {
    it('returns an ExtractionsController instance', () => {
      const view = ExtractionsController.build(noop, noop, noop);
      expect(view).toBeInstanceOf(ExtractionsController);
    });
  });

  describe('#buildEffect', () => {
    let setData;
    let setError;
    let setLoading;
    let cleanup;

    beforeEach(() => {
      setData = jasmine.createSpy('setData');
      setError = jasmine.createSpy('setError');
      setLoading = jasmine.createSpy('setLoading');
    });

    afterEach(() => { cleanup && cleanup(); });

    describe('when both feeds resolve', () => {
      const extractions = {
        counts: { extracted: 40 },
        extractions: [
          { id: 1, parserType: 'json', originUrl: null, itemCount: 20, timestamp: 't1' },
          { id: 2, parserType: 'html', originUrl: 'https://x/list', itemCount: 20, timestamp: 't2' },
        ],
      };
      const emissions = {
        counts: { extracted: 40 },
        emissions: [
          { id: 10, extractionId: 2, status: 'success' },
          { id: 11, extractionId: 2, status: 'failed' },
          { id: 12, extractionId: null, status: 'success' },
        ],
      };

      beforeEach(async () => {
        mockPair(extractions, emissions);
        const view = ExtractionsController.build(setData, setError, setLoading);
        cleanup = view.buildEffect()();
        await flushAsync();
      });

      it('fetches both feeds', () => {
        const urls = globalThis.fetch.calls.all().map((c) => c.args[0]);
        expect(urls).toContain('/extractions.json');
        expect(urls).toContain('/emissions.json');
      });

      it('stops the loading state', () => {
        expect(setLoading).toHaveBeenCalledWith(false);
      });

      it('clears any previous error', () => {
        expect(setError).toHaveBeenCalledWith(null);
      });

      it('keeps the extracted total for the headline stat', () => {
        expect(setData.calls.mostRecent().args[0].extractedTotal).toBe(40);
      });

      it('joins emissions to their extraction by extractionId', () => {
        const row = setData.calls.mostRecent().args[0].rows.find((r) => r.id === 2);
        expect(row.emitsSent).toBe(2);
        expect(row.statusBreakdown).toEqual({ success: 1, failed: 1, dead: 0 });
      });

      it('ignores emissions without an extractionId', () => {
        const rows = setData.calls.mostRecent().args[0].rows;
        const total = rows.reduce((sum, r) => sum + r.emitsSent, 0);
        expect(total).toBe(2);
      });

      it('flags extractions with no retained emissions as partial when the buffer is truncated', () => {
        const row = setData.calls.mostRecent().args[0].rows.find((r) => r.id === 1);
        expect(row.partial).toBeTrue();
      });

      it('does not flag joined rows as partial', () => {
        const row = setData.calls.mostRecent().args[0].rows.find((r) => r.id === 2);
        expect(row.partial).toBeFalse();
      });
    });

    describe('when the emission buffer still covers every extraction', () => {
      beforeEach(async () => {
        mockPair(
          {
            counts: { extracted: 20 },
            extractions: [{ id: 5, parserType: 'json', originUrl: null, itemCount: 10, timestamp: 't' }],
          },
          { counts: { extracted: 20 }, emissions: [{ id: 5, extractionId: 5, status: 'success' }] }
        );
        const view = ExtractionsController.build(setData, setError, setLoading);
        cleanup = view.buildEffect()();
        await flushAsync();
      });

      it('does not mark rows as partial', () => {
        const row = setData.calls.mostRecent().args[0].rows.find((r) => r.id === 5);
        expect(row.partial).toBeFalse();
      });
    });

    describe('when a feed rejects', () => {
      beforeEach(async () => {
        spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({ ok: false, status: 500 }));
        const view = ExtractionsController.build(setData, setError, setLoading);
        cleanup = view.buildEffect()();
        await flushAsync();
      });

      it('reports the error message', () => {
        expect(setError).toHaveBeenCalledWith('HTTP 500');
      });

      it('stops the loading state', () => {
        expect(setLoading).toHaveBeenCalledWith(false);
      });
    });

    describe('cleanup', () => {
      it('clears the refresh interval', () => {
        spyOn(globalThis, 'clearInterval').and.callThrough();
        spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop));
        const view = ExtractionsController.build(setData, setError, setLoading);
        cleanup = view.buildEffect()();
        cleanup();
        expect(globalThis.clearInterval).toHaveBeenCalled();
      });
    });
  });
});
