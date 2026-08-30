import { ExtractionRecord } from '../../../../lib/utils/extractions/ExtractionRecord.js';

describe('ExtractionRecord', () => {
  let record;

  beforeEach(() => {
    record = new ExtractionRecord(1, {
      parserType: 'json_path',
      originUrl: 'http://example.com/list?page=1',
      itemCount: 20
    });
  });

  describe('constructor', () => {
    it('creates a record with the given id', () => {
      expect(record.id).toBe(1);
    });

    it('creates a record with the given parserType', () => {
      expect(record.parserType).toBe('json_path');
    });

    it('creates a record with the given originUrl', () => {
      expect(record.originUrl).toBe('http://example.com/list?page=1');
    });

    it('creates a record with the given itemCount', () => {
      expect(record.itemCount).toBe(20);
    });

    it('creates a record with a timestamp', () => {
      expect(record.timestamp).toBeInstanceOf(Date);
    });

    describe('when optional fields are omitted', () => {
      let minimalRecord;

      beforeEach(() => {
        minimalRecord = new ExtractionRecord(2, { parserType: 'regex' });
      });

      it('defaults originUrl to null', () => {
        expect(minimalRecord.originUrl).toBeNull();
      });

      it('defaults itemCount to 0', () => {
        expect(minimalRecord.itemCount).toBe(0);
      });
    });
  });

  describe('#timestamp', () => {
    it('returns a Date created at construction time', () => {
      const before = new Date();
      const anotherRecord = new ExtractionRecord(1, { parserType: 'regex' });
      const after = new Date();

      expect(anotherRecord.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(anotherRecord.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('#toJSON', () => {
    it('returns an object with the record id', () => {
      expect(record.toJSON().id).toBe(1);
    });

    it('returns an object with the record parserType', () => {
      expect(record.toJSON().parserType).toBe('json_path');
    });

    it('returns an object with the record originUrl', () => {
      expect(record.toJSON().originUrl).toBe('http://example.com/list?page=1');
    });

    it('returns an object with the record itemCount', () => {
      expect(record.toJSON().itemCount).toBe(20);
    });

    it('returns an object with the timestamp as ISO string', () => {
      expect(record.toJSON().timestamp).toBe(record.timestamp.toISOString());
    });
  });
});
