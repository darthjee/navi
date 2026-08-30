import { EmissionRecord } from '../../../../lib/utils/emissions/EmissionRecord.js';

describe('EmissionRecord', () => {
  let record;

  beforeEach(() => {
    record = new EmissionRecord(1, {
      status: 'success',
      url: 'http://example.com/hook',
      method: 'POST',
      httpStatus: 200,
      error: null,
      itemRef: 'abc123',
      extractionId: 7
    });
  });

  describe('constructor', () => {
    it('creates a record with the given id', () => {
      expect(record.id).toBe(1);
    });

    it('creates a record with the given status', () => {
      expect(record.status).toBe('success');
    });

    it('creates a record with the given url', () => {
      expect(record.url).toBe('http://example.com/hook');
    });

    it('creates a record with the given method', () => {
      expect(record.method).toBe('POST');
    });

    it('creates a record with the given httpStatus', () => {
      expect(record.httpStatus).toBe(200);
    });

    it('creates a record with the given error', () => {
      expect(record.error).toBeNull();
    });

    it('creates a record with the given itemRef', () => {
      expect(record.itemRef).toBe('abc123');
    });

    it('creates a record with the given extractionId', () => {
      expect(record.extractionId).toBe(7);
    });

    it('creates a record with a timestamp', () => {
      expect(record.timestamp).toBeInstanceOf(Date);
    });

    describe('when optional fields are omitted', () => {
      let minimalRecord;

      beforeEach(() => {
        minimalRecord = new EmissionRecord(2, {
          status: 'failed',
          url: 'http://example.com/hook',
          method: 'GET'
        });
      });

      it('defaults httpStatus to null', () => {
        expect(minimalRecord.httpStatus).toBeNull();
      });

      it('defaults error to null', () => {
        expect(minimalRecord.error).toBeNull();
      });

      it('defaults itemRef to null', () => {
        expect(minimalRecord.itemRef).toBeNull();
      });

      it('defaults extractionId to null', () => {
        expect(minimalRecord.extractionId).toBeNull();
      });
    });
  });

  describe('#timestamp', () => {
    it('returns a Date created at construction time', () => {
      const before = new Date();
      const anotherRecord = new EmissionRecord(1, {
        status: 'success',
        url: 'http://example.com',
        method: 'POST'
      });
      const after = new Date();

      expect(anotherRecord.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(anotherRecord.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('#toJSON', () => {
    it('returns an object with the record id', () => {
      expect(record.toJSON().id).toBe(1);
    });

    it('returns an object with the record status', () => {
      expect(record.toJSON().status).toBe('success');
    });

    it('returns an object with the record url', () => {
      expect(record.toJSON().url).toBe('http://example.com/hook');
    });

    it('returns an object with the record method', () => {
      expect(record.toJSON().method).toBe('POST');
    });

    it('returns an object with the record httpStatus', () => {
      expect(record.toJSON().httpStatus).toBe(200);
    });

    it('returns an object with the record error', () => {
      expect(record.toJSON().error).toBeNull();
    });

    it('returns an object with the record itemRef', () => {
      expect(record.toJSON().itemRef).toBe('abc123');
    });

    it('returns an object with the record extractionId', () => {
      expect(record.toJSON().extractionId).toBe(7);
    });

    it('returns an object with the timestamp as ISO string', () => {
      expect(record.toJSON().timestamp).toBe(record.timestamp.toISOString());
    });
  });
});
