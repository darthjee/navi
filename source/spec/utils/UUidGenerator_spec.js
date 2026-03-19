import { UUidGenerator } from '../../lib/utils/UUidGenerator.js';

describe('UUidGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new UUidGenerator();
  });

  describe('generate', () => {
    it('generates a unique identifier', () => {
      const id1 = generator.generate();
      const id2 = generator.generate();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toEqual(id2);
    });
  });
});