import { IncrementalIdGenerator } from '../../lib/utils/IncrementalIdGenerator.js';

describe('IncrementalIdGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new IncrementalIdGenerator();
  });

  describe('#generate', () => {
    it('starts at 1 by default', () => {
      expect(generator.generate()).toBe(1);
    });

    it('returns incrementally increasing ids', () => {
      expect(generator.generate()).toBe(1);
      expect(generator.generate()).toBe(2);
      expect(generator.generate()).toBe(3);
    });

    it('generates unique ids on each call', () => {
      const id1 = generator.generate();
      const id2 = generator.generate();
      expect(id1).not.toEqual(id2);
    });
  });

  describe('with a custom start', () => {
    it('starts from the given value', () => {
      generator = new IncrementalIdGenerator(10);
      expect(generator.generate()).toBe(10);
      expect(generator.generate()).toBe(11);
    });
  });
});
