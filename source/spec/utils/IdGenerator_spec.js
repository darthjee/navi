import { IdGenerator } from '../../lib/utils/IdGenerator.js';
import { UUidGenerator } from '../../lib/utils/UUidGenerator.js';

describe('IdGenerator', () => {
  let idGenerator;
  let object;
  let generateId;

  beforeEach(() => {
    idGenerator = new IdGenerator();
  });

  describe('generator', () => {
    describe('when called without arguments', () => {
      it('should generate a unique id', () => {
        generateId = idGenerator.generator();
        object = generateId();
        const object2 = generateId();

        expect(typeof object).toEqual('object');
        expect(object.id).toBeDefined();
        expect(object.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        );
        expect(object).not.toEqual(object2);
      });
    });

    describe('when called with arguments', () => {
      beforeEach(() => {
        const ids = [1,1,1,1,2, 2, 3];
        function customGenerator() {
          return ids.shift();
        }
        const uuidGenerator = new UUidGenerator({ generator: customGenerator });
        const idGenerator = new IdGenerator({ uuidGenerator });

        generateId = idGenerator.generator();
      });

      describe('when called without id argument', () => {
        it('should generate a unique id', () => {
          object = generateId({ key: 'value' });

          expect(typeof object).toEqual('object');
          expect(object.id).toBeDefined();
          expect(object.key).toEqual('value');
          expect(object.id).toEqual(1);
        });
      });

      describe('when called with id argument', () => {
        it('should generate a unique id', () => {
          object = generateId({ id: 2, key: 'value' });

          expect(typeof object).toEqual('object');
          expect(object.id).toBeDefined();
          expect(object.key).toEqual('value');
          expect(object.id).toEqual(2);
        });

        it('should store previous unique id', () => {
          generateId({ id: 2, key: 'value' });
          object = generateId({ key: 'other_value' });

          expect(typeof object).toEqual('object');
          expect(object.id).toBeDefined();
          expect(object.key).toEqual('other_value');
          expect(object.id).toEqual(1);
        });
      });
    });
  });
});
