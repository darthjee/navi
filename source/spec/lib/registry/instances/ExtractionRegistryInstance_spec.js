import { ExtractionRegistryInstance } from '../../../../lib/registry/instances/ExtractionRegistryInstance.js';
import { ExtractionStore } from '../../../../lib/utils/extractions/ExtractionStore.js';
import { RegistryInstanceExamples } from '../../../support/utils/RegistryInstanceExamples.js';

describe('ExtractionRegistryInstance', () => {
  let instance;

  const extraction = (overrides = {}) => ({
    parserType: 'json_path',
    originUrl: 'http://example.com/list?page=1',
    itemCount: 10,
    ...overrides
  });

  const examples = {
    getInstance: () => instance,
    InstanceClass: ExtractionRegistryInstance,
    StoreClass: ExtractionStore,
    addRecord: (target) => target.recordExtraction(extraction()),
    keyField: 'originUrl'
  };

  beforeEach(() => {
    instance = new ExtractionRegistryInstance();
  });

  describe('constructor', () => {
    RegistryInstanceExamples.constructorExamples(examples);
  });

  describe('#recordExtraction', () => {
    it('delegates to the store and returns the record', () => {
      const record = instance.recordExtraction(extraction({ parserType: 'regex' }));
      expect(record.parserType).toBe('regex');
    });

    it('adds the itemCount to the extracted counter', () => {
      instance.recordExtraction(extraction({ itemCount: 4 }));
      expect(instance.counts.extracted).toBe(4);
    });
  });

  describe('#getRecords', () => {
    beforeEach(() => {
      instance.recordExtraction(extraction({ originUrl: 'a' }));
      instance.recordExtraction(extraction({ originUrl: 'b' }));
      instance.recordExtraction(extraction({ originUrl: 'c' }));
    });

    RegistryInstanceExamples.getRecordsExamples(examples);
  });

  describe('#getRecordById', () => {
    RegistryInstanceExamples.getRecordByIdExamples(examples);
  });

  describe('#counts', () => {
    it('returns the store counters', () => {
      instance.recordExtraction(extraction({ itemCount: 2 }));
      expect(instance.counts).toEqual({ extracted: 2 });
    });
  });

  describe('#clear', () => {
    it('clears records and counters', () => {
      instance.recordExtraction(extraction({ itemCount: 3 }));
      instance.clear();
      expect(instance.getRecords()).toEqual([]);
      expect(instance.counts).toEqual({ extracted: 0 });
    });
  });
});
