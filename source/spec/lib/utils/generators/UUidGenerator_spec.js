import { UUidGenerator } from '../../../../lib/utils/generators/UUidGenerator.js';

describe('UUidGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new UUidGenerator();
  });

  describe('generate', () => {
    describe('when generating a new identifier', () => {
      it('generates a unique identifier', () => {
        const id1 = generator.generate();
        const id2 = generator.generate();

        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id1).not.toEqual(id2);
      });

      it('generates an uuid', () => {
        const id = generator.generate();

        expect(id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
      });
    });

    describe('when generating an identifier that has already been generated', () => {
      it('generates a new identifier', () => {
        const ids = [1,1,1,1,2];
        function customGenerator() {
          return ids.shift();
        }

        generator = new UUidGenerator({ generator: customGenerator });

        const id1 = generator.generate();
        const id2 = generator.generate();

        expect(id1).toEqual(1);
        expect(id2).toEqual(2);
      });
    });
  });

  describe('push', () => {
    it('stores the generated identifier', () => {
      const ids = [1,1,1,1,2];
      function customGenerator() {
        return ids.shift();
      }

      generator = new UUidGenerator({ generator: customGenerator });

      generator.push(1);
      expect(generator.generate()).toEqual(2);
    });
  });
});