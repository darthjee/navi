import { ExtractionStore } from '../../../../lib/utils/extractions/ExtractionStore.js';
import { StoreExamples } from '../../../support/utils/StoreExamples.js';

describe('ExtractionStore', () => {
  let store;

  const extraction = (overrides = {}) => ({
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 10,
    ...overrides
  });

  const examples = {
    getStore: () => store,
    buildStore: (retention) => new ExtractionStore(retention),
    addRecord: (target, key = 'http://example.com/list?page=1') => (
      target.recordExtraction(extraction({ originUrl: key }))
    ),
    keyField: 'originUrl'
  };

  beforeEach(() => {
    store = new ExtractionStore();
  });

  describe('constructor', () => {
    StoreExamples.constructorExamples(examples);

    it('starts with the extracted counter at zero', () => {
      expect(store.counts).toEqual({ extracted: 0 });
    });
  });

  describe('#recordExtraction', () => {
    it('adds a record to the store', () => {
      store.recordExtraction(extraction());
      expect(store.size).toBe(1);
    });

    it('returns the created record', () => {
      const record = store.recordExtraction(extraction({ parserType: 'regex' }));
      expect(record.parserType).toBe('regex');
    });

    it('assigns incremental IDs starting at 1', () => {
      const first = store.recordExtraction(extraction());
      const second = store.recordExtraction(extraction());
      expect(first.id).toBe(1);
      expect(second.id).toBe(2);
    });

    it('adds the itemCount to the extracted counter', () => {
      store.recordExtraction(extraction({ itemCount: 7 }));
      store.recordExtraction(extraction({ itemCount: 3 }));
      expect(store.counts.extracted).toBe(10);
    });

    describe('when retention limit is reached', () => {
      let smallStore;

      beforeEach(() => {
        smallStore = new ExtractionStore(3);
        smallStore.recordExtraction(extraction({ originUrl: '1' }));
        smallStore.recordExtraction(extraction({ originUrl: '2' }));
        smallStore.recordExtraction(extraction({ originUrl: '3' }));
      });

      StoreExamples.retentionLimitExamples({ ...examples, getStore: () => smallStore });

      it('keeps the extracted counter exact past retention', () => {
        smallStore.recordExtraction(extraction({ originUrl: '4', itemCount: 10 }));
        expect(smallStore.counts.extracted).toBe(40);
      });
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
      store.recordExtraction(extraction({ itemCount: 2 }));
      store.recordExtraction(extraction({ itemCount: 3 }));
      store.clear();
    });

    StoreExamples.clearExamples(examples);

    it('resets the extracted counter to zero', () => {
      expect(store.counts).toEqual({ extracted: 0 });
    });
  });

  describe('#size', () => {
    StoreExamples.sizeExamples(examples);
  });

  describe('#retention', () => {
    StoreExamples.retentionExamples(examples);
  });

  describe('#counts', () => {
    StoreExamples.countsCopyExamples({ ...examples, counterKey: 'extracted' });
  });

  describe('#toJSON', () => {
    it('returns counts and an empty records array when store is empty', () => {
      expect(store.toJSON()).toEqual({
        counts: { extracted: 0 },
        records: []
      });
    });

    StoreExamples.toJSONRecordsExamples(examples);

    it('includes the current counters', () => {
      store.recordExtraction(extraction({ itemCount: 3 }));
      expect(store.toJSON().counts).toEqual({ extracted: 3 });
    });
  });
});
