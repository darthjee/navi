import { RequestHandler } from '../../../../../lib/common/server/RequestHandler.js';
import { EmissionRegistry } from '../../../../../lib/registry/EmissionRegistry.js';
import { EmissionsHandler } from '../../../../../lib/server/handlers/emissions/EmissionsHandler.js';

describe('EmissionsHandler', () => {
  let res;

  const record = (overrides = {}) => ({
    status: 'success',
    url: 'http://example.com/hook',
    method: 'POST',
    httpStatus: 200,
    error: null,
    itemRef: 'ref',
    ...overrides,
  });

  beforeEach(() => {
    EmissionRegistry.build();
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    EmissionRegistry.reset();
  });

  it('is an instance of RequestHandler', () => {
    expect(new EmissionsHandler({ query: {} }, res, 20)).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when the store is empty', () => {
      it('responds with zeroed counts and no emissions', () => {
        new EmissionsHandler({ query: {} }, res, 20).handle();

        expect(res.json).toHaveBeenCalledWith({
          counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 },
          emissions: [],
        });
      });
    });

    describe('when the store has records', () => {
      beforeEach(() => {
        EmissionRegistry.incExtracted(3);
        EmissionRegistry.recordEmission(record({ itemRef: 'a' }));
        EmissionRegistry.recordEmission(record({ itemRef: 'b', status: 'failed', error: 'boom' }));
        EmissionRegistry.recordEmission(record({ itemRef: 'c' }));
      });

      it('responds with all records serialized oldest-first', () => {
        new EmissionsHandler({ query: {} }, res, 20).handle();

        const { emissions } = res.json.calls.mostRecent().args[0];
        expect(emissions.map(e => e.itemRef)).toEqual(['a', 'b', 'c']);
        expect(typeof emissions[0].timestamp).toBe('string');
      });

      it('includes the current counts', () => {
        new EmissionsHandler({ query: {} }, res, 20).handle();

        expect(res.json.calls.mostRecent().args[0].counts).toEqual({
          extracted: 3, emitted: 2, failed: 1, dead: 0,
        });
      });

      it('respects the page size limit', () => {
        new EmissionsHandler({ query: {} }, res, 2).handle();

        const { emissions } = res.json.calls.mostRecent().args[0];
        expect(emissions.map(e => e.itemRef)).toEqual(['a', 'b']);
      });

      describe('when last_id is provided', () => {
        it('paginates from the given id', () => {
          const firstId = EmissionRegistry.getRecords()[0].id;

          new EmissionsHandler({ query: { last_id: String(firstId) } }, res, 20).handle();

          const { emissions } = res.json.calls.mostRecent().args[0];
          expect(emissions.map(e => e.itemRef)).toEqual(['b', 'c']);
        });
      });
    });
  });
});
