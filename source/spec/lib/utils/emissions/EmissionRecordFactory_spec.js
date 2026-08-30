import { EmissionRecord } from '../../../../lib/utils/emissions/EmissionRecord.js';
import { EmissionRecordFactory } from '../../../../lib/utils/emissions/EmissionRecordFactory.js';
import { IncrementalIdGenerator } from '../../../../lib/utils/generators/IncrementalIdGenerator.js';

describe('EmissionRecordFactory', () => {
  let factory;
  let params;

  beforeEach(() => {
    factory = new EmissionRecordFactory();
    params = {
      status: 'success',
      url: 'http://example.com/hook',
      method: 'POST',
      httpStatus: 200,
      error: null,
      itemRef: 'abc123',
      extractionId: 7
    };
  });

  describe('#build', () => {
    it('returns an EmissionRecord instance', () => {
      expect(factory.build(params)).toBeInstanceOf(EmissionRecord);
    });

    it('assigns the given status', () => {
      expect(factory.build(params).status).toBe('success');
    });

    it('assigns the given url', () => {
      expect(factory.build(params).url).toBe('http://example.com/hook');
    });

    it('assigns the given method', () => {
      expect(factory.build(params).method).toBe('POST');
    });

    it('assigns the given httpStatus', () => {
      expect(factory.build(params).httpStatus).toBe(200);
    });

    it('assigns the given error', () => {
      expect(factory.build({ ...params, error: 'boom' }).error).toBe('boom');
    });

    it('assigns the given itemRef', () => {
      expect(factory.build(params).itemRef).toBe('abc123');
    });

    it('assigns the given extractionId', () => {
      expect(factory.build(params).extractionId).toBe(7);
    });

    it('defaults extractionId to null when omitted', () => {
      expect(factory.build({ ...params, extractionId: undefined }).extractionId).toBeNull();
    });

    it('assigns an incremental id starting at 1', () => {
      expect(factory.build(params).id).toBe(1);
    });

    it('increments the id on each call', () => {
      const first = factory.build(params);
      const second = factory.build(params);
      expect(second.id).toBe(first.id + 1);
    });
  });

  describe('with a custom idGenerator', () => {
    it('uses the provided idGenerator', () => {
      const idGenerator = new IncrementalIdGenerator(42);
      factory = new EmissionRecordFactory({ idGenerator });
      expect(factory.build(params).id).toBe(42);
    });
  });
});
