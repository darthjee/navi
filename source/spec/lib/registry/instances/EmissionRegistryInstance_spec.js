import { EmissionRegistryInstance } from '../../../../lib/registry/instances/EmissionRegistryInstance.js';
import { EmissionStore } from '../../../../lib/utils/emissions/EmissionStore.js';
import { RegistryInstanceExamples } from '../../../support/utils/RegistryInstanceExamples.js';

describe('EmissionRegistryInstance', () => {
  let instance;

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
    getInstance: () => instance,
    InstanceClass: EmissionRegistryInstance,
    StoreClass: EmissionStore,
    addRecord: (target) => target.recordEmission(emission()),
    keyField: 'itemRef'
  };

  beforeEach(() => {
    instance = new EmissionRegistryInstance();
  });

  describe('constructor', () => {
    RegistryInstanceExamples.constructorExamples(examples);
  });

  describe('#incExtracted', () => {
    it('delegates to the store with the default amount', () => {
      instance.incExtracted();
      expect(instance.counts.extracted).toBe(1);
    });

    it('delegates the given amount to the store', () => {
      instance.incExtracted(4);
      expect(instance.counts.extracted).toBe(4);
    });
  });

  describe('#recordEmission', () => {
    it('delegates to the store and returns the record', () => {
      const record = instance.recordEmission(emission({ itemRef: 'abc' }));
      expect(record.itemRef).toBe('abc');
    });

    it('bumps the matching counter', () => {
      instance.recordEmission(emission({ status: 'success' }));
      expect(instance.counts.emitted).toBe(1);
    });
  });

  describe('#getRecords', () => {
    beforeEach(() => {
      instance.recordEmission(emission({ itemRef: 'a' }));
      instance.recordEmission(emission({ itemRef: 'b' }));
      instance.recordEmission(emission({ itemRef: 'c' }));
    });

    RegistryInstanceExamples.getRecordsExamples(examples);
  });

  describe('#getRecordById', () => {
    RegistryInstanceExamples.getRecordByIdExamples(examples);
  });

  describe('#counts', () => {
    it('returns the store counters', () => {
      instance.incExtracted(2);
      instance.recordEmission(emission({ status: 'failed' }));
      expect(instance.counts).toEqual({ extracted: 2, emitted: 0, failed: 1, dead: 0 });
    });
  });

  describe('#clear', () => {
    it('clears records and counters', () => {
      instance.recordEmission(emission());
      instance.incExtracted(3);
      instance.clear();
      expect(instance.getRecords()).toEqual([]);
      expect(instance.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });
  });
});
