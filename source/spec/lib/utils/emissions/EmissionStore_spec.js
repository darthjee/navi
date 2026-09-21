import { EmissionStore } from '../../../../lib/utils/emissions/EmissionStore.js';
import { StoreExamples } from '../../../support/utils/StoreExamples.js';

describe('EmissionStore', () => {
  let store;

  const emission = (overrides = {}) => ({
    status: 'success',
    url: 'http://example.com/hook',
    method: 'POST',
    httpStatus: 200,
    error: null,
    itemRef: 'ref',
    ...overrides
  });

  const examples = {
    getStore: () => store,
    buildStore: (retention) => new EmissionStore(retention),
    addRecord: (target, key = 'ref') => target.recordEmission(emission({ itemRef: key })),
    keyField: 'itemRef'
  };

  beforeEach(() => {
    store = new EmissionStore();
  });

  describe('constructor', () => {
    StoreExamples.constructorExamples(examples);

    it('starts with all counters at zero', () => {
      expect(store.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });

  describe('#recordEmission', () => {
    it('adds a record to the store', () => {
      store.recordEmission(emission());
      expect(store.size).toBe(1);
    });

    it('returns the created record', () => {
      const record = store.recordEmission(emission({ itemRef: 'abc' }));
      expect(record.itemRef).toBe('abc');
    });

    it('forwards extractionId to the record', () => {
      const record = store.recordEmission(emission({ extractionId: 42 }));
      expect(record.extractionId).toBe(42);
    });

    it('defaults extractionId to null when omitted', () => {
      const record = store.recordEmission(emission());
      expect(record.extractionId).toBeNull();
    });

    it('assigns incremental IDs starting at 1', () => {
      const first = store.recordEmission(emission());
      const second = store.recordEmission(emission());
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it('increments the emitted counter for a success', () => {
      store.recordEmission(emission({ status: 'success' }));
      expect(store.counts.emitted).toBe(1);
    });

    it('increments the failed counter for a failure', () => {
      store.recordEmission(emission({ status: 'failed' }));
      expect(store.counts.failed).toBe(1);
    });

    it('increments the dead counter for a terminal failure', () => {
      store.recordEmission(emission({ status: 'dead' }));
      expect(store.counts.dead).toBe(1);
    });

    it('does not re-increment failed for a dead emission', () => {
      store.recordEmission(emission({ status: 'dead' }));
      expect(store.counts.failed).toBe(0);
    });

    describe('when retention limit is reached', () => {
      let smallStore;

      beforeEach(() => {
        smallStore = new EmissionStore(3);
        smallStore.recordEmission(emission({ itemRef: '1' }));
        smallStore.recordEmission(emission({ itemRef: '2' }));
        smallStore.recordEmission(emission({ itemRef: '3' }));
      });

      StoreExamples.retentionLimitExamples({ ...examples, getStore: () => smallStore });

      it('keeps counters exact past retention', () => {
        smallStore.recordEmission(emission({ itemRef: '4' }));
        expect(smallStore.counts.emitted).toBe(4);
      });
    });
  });

  describe('#incExtracted', () => {
    it('increments by 1 by default', () => {
      store.incExtracted();
      expect(store.counts.extracted).toBe(1);
    });

    it('increments by the given amount', () => {
      store.incExtracted(5);
      expect(store.counts.extracted).toBe(5);
    });

    it('does not create a record', () => {
      store.incExtracted(3);
      expect(store.size).toBe(0);
    });
  });

  describe('#getRecords', () => {
    StoreExamples.getRecordsExamples(examples);
  });

  describe('#getRecordById', () => {
    StoreExamples.getRecordByIdExamples(examples);
  });

  describe('#clear', () => {
    beforeEach(() => {
      store.recordEmission(emission({ status: 'success' }));
      store.recordEmission(emission({ status: 'failed' }));
      store.incExtracted(2);
      store.clear();
    });

    StoreExamples.clearExamples(examples);

    it('resets all counters to zero', () => {
      expect(store.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });

  describe('#size', () => {
    StoreExamples.sizeExamples(examples);
  });

  describe('#retention', () => {
    StoreExamples.retentionExamples(examples);
  });

  describe('#counts', () => {
    StoreExamples.countsCopyExamples({ ...examples, counterKey: 'emitted' });
  });

  describe('#toJSON', () => {
    it('returns counts and an empty records array when store is empty', () => {
      expect(store.toJSON()).toEqual({
        counts: { extracted: 0, emitted: 0, failed: 0, dead: 0 },
        records: []
      });
    });

    StoreExamples.toJSONRecordsExamples(examples);

    it('includes the current counters', () => {
      store.recordEmission(emission({ status: 'success' }));
      store.incExtracted(3);
      expect(store.toJSON().counts).toEqual({
        extracted: 3, emitted: 1, failed: 0, dead: 0
      });
    });
  });
});
