import { IdGenerator } from '../../lib/utils/IdGenerator.js';

describe('IdGenerator', () => {
  let idGenerator;

  beforeEach(() => {
    idGenerator = new IdGenerator();
  });

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
