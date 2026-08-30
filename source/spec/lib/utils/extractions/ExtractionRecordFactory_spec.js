import { ExtractionRecord } from '../../../../lib/utils/extractions/ExtractionRecord.js';
import { ExtractionRecordFactory } from '../../../../lib/utils/extractions/ExtractionRecordFactory.js';
import { IncrementalIdGenerator } from '../../../../lib/utils/generators/IncrementalIdGenerator.js';

describe('ExtractionRecordFactory', () => {
  let factory;
  let params;

  beforeEach(() => {
    factory = new ExtractionRecordFactory();
    params = {
      parserType: 'json_path',
      originUrl: 'http://example.com/list?page=1',
      itemCount: 20
    };
  });

  describe('#build', () => {
    it('returns an ExtractionRecord instance', () => {
      expect(factory.build(params)).toBeInstanceOf(ExtractionRecord);
    });

    it('assigns the given parserType', () => {
      expect(factory.build(params).parserType).toBe('json_path');
    });

    it('assigns the given originUrl', () => {
      expect(factory.build(params).originUrl).toBe('http://example.com/list?page=1');
    });

    it('assigns the given itemCount', () => {
      expect(factory.build(params).itemCount).toBe(20);
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
      factory = new ExtractionRecordFactory({ idGenerator });
      expect(factory.build(params).id).toBe(42);
    });
  });
});
