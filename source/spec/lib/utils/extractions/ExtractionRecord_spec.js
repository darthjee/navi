import { ExtractionRecord } from '../../../../lib/utils/extractions/ExtractionRecord.js';
import { RecordExamples } from '../../../support/utils/RecordExamples.js';

describe('ExtractionRecord', () => {
  let record;

  beforeEach(() => {
    record = new ExtractionRecord(1, {
      parserType: 'json_path',
      originUrl: 'http://example.com/list?page=1',
      itemCount: 20
    });
  });

  const examples = {
    getRecord: () => record,
    expectedId: 1,
    buildRecord: () => new ExtractionRecord(1, { parserType: 'regex' })
  };

  describe('constructor', () => {
    RecordExamples.constructorExamples(examples);

    it('creates a record with the given parserType', () => {
      expect(record.parserType).toBe('json_path');
    });

    it('creates a record with the given originUrl', () => {
      expect(record.originUrl).toBe('http://example.com/list?page=1');
    });

    it('creates a record with the given itemCount', () => {
      expect(record.itemCount).toBe(20);
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
    RecordExamples.timestampExamples(examples);
  });

  describe('#toJSON', () => {
    RecordExamples.toJSONExamples(examples);

    it('returns an object with the record parserType', () => {
      expect(record.toJSON().parserType).toBe('json_path');
    });

    it('returns an object with the record originUrl', () => {
      expect(record.toJSON().originUrl).toBe('http://example.com/list?page=1');
    });

    it('returns an object with the record itemCount', () => {
      expect(record.toJSON().itemCount).toBe(20);
    });
  });
});
