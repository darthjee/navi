import { IdGenerator } from '../../lib/utils/IdGenerator.js';

describe('IdGenerator', () => {
  let idGenerator;

  beforeEach(() => {
    idGenerator = new IdGenerator();
  });

  describe('generator', () => {
    describe('when called without arguments', () => {
      it('should generate a unique id', () => {
        const generateId = idGenerator.generator();
        const object1 = generateId();
        const object2 = generateId();
        expect(typeof object1).toEqual('object');
        expect(object1.id).toBeDefined();
        expect(object1.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(object1).not.toEqual(object2);
      });
    });

    describe('when called with arguments', () => {
      it('should generate a unique id', () => {
        const generateId = idGenerator.generator();
        const object1 = generateId({ key: 'value' });
        expect(typeof object1).toEqual('object');
        expect(object1.id).toBeDefined();
        expect(object1.key).toEqual('value');
        expect(object1.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
      });
    });

    describe('when called with id argument', () => {
      it('should generate a unique id', () => {
        const generateId = idGenerator.generator();
        const object1 = generateId({ id: 'test-id', key: 'value' });
        expect(typeof object1).toEqual('object');
        expect(object1.id).toBeDefined();
        expect(object1.key).toEqual('value');
        expect(object1.id).toEqual('test-id');
      });
    });
  });
});
