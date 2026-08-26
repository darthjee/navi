import { IncrementalIdGenerator } from '../../../../lib/utils/generators/IncrementalIdGenerator.js';
import { MemoryData } from '../../../../lib/utils/memory/MemoryData.js';
import { MemoryDataFactory } from '../../../../lib/utils/memory/MemoryDataFactory.js';

describe('MemoryDataFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new MemoryDataFactory();
  });

  describe('#build', () => {
    it('returns a MemoryData instance', () => {
      expect(factory.build(1024, 12.5)).toBeInstanceOf(MemoryData);
    });

    it('assigns the given value', () => {
      expect(factory.build(2048, 25.0).value).toBe(2048);
    });

    it('assigns the given percentage', () => {
      expect(factory.build(1024, 50.0).percentage).toBe(50.0);
    });

    it('assigns an incremental id starting at 1', () => {
      const entry = factory.build(1024, 10.0);
      expect(entry.id).toBe(1);
    });

    it('increments the id on each call', () => {
      const first = factory.build(1024, 10.0);
      const second = factory.build(2048, 20.0);
      expect(second.id).toBe(first.id + 1);
    });
  });

  describe('with a custom idGenerator', () => {
    it('uses the provided idGenerator', () => {
      const idGenerator = new IncrementalIdGenerator(42);
      factory = new MemoryDataFactory({ idGenerator });
      expect(factory.build(1024, 10.0).id).toBe(42);
    });
  });
});
