import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { ExtractionRegistry } from '../../../../../lib/registry/ExtractionRegistry.js';
import { ExtractionsHandler } from '../../../../../lib/server/handlers/extractions/ExtractionsHandler.js';

describe('ExtractionsHandler', () => {
  let res;

  const record = (overrides = {}) => ({
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 10,
    ...overrides,
  });

  beforeEach(() => {
    ExtractionRegistry.build();
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    ExtractionRegistry.reset();
  });

  it('is an instance of RequestHandler', () => {
    expect(new ExtractionsHandler({ query: {} }, res, 20)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when the store is empty', () => {
      it('responds with zeroed counts and no extractions', () => {
        new ExtractionsHandler({ query: {} }, res, 20).handle();

        expect(res.json).toHaveBeenCalledWith({
          counts: { extracted: 0 },
          extractions: [],
        });
      });
    });

    describe('when the store has records', () => {
      beforeEach(() => {
        ExtractionRegistry.recordExtraction(record({ originUrl: 'a', itemCount: 3 }));
        ExtractionRegistry.recordExtraction(record({ originUrl: 'b', itemCount: 2 }));
        ExtractionRegistry.recordExtraction(record({ originUrl: 'c', itemCount: 5 }));
      });

      it('responds with all records serialized oldest-first', () => {
        new ExtractionsHandler({ query: {} }, res, 20).handle();

        const { extractions } = res.json.calls.mostRecent().args[0];
        expect(extractions.map(e => e.originUrl)).toEqual(['a', 'b', 'c']);
        expect(typeof extractions[0].timestamp).toBe('string');
      });

      it('includes the current counts', () => {
        new ExtractionsHandler({ query: {} }, res, 20).handle();

        expect(res.json.calls.mostRecent().args[0].counts).toEqual({ extracted: 10 });
      });

      it('respects the page size limit', () => {
        new ExtractionsHandler({ query: {} }, res, 2).handle();

        const { extractions } = res.json.calls.mostRecent().args[0];
        expect(extractions.map(e => e.originUrl)).toEqual(['a', 'b']);
      });

      describe('when last_id is provided', () => {
        it('paginates from the given id', () => {
          const firstId = ExtractionRegistry.getRecords()[0].id;

          new ExtractionsHandler({ query: { last_id: String(firstId) } }, res, 20).handle();

          const { extractions } = res.json.calls.mostRecent().args[0];
          expect(extractions.map(e => e.originUrl)).toEqual(['b', 'c']);
        });
      });
    });
  });
});
