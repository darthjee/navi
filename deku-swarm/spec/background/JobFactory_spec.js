import { Job } from '../../lib/background/Job.js';
import { JobFactory } from '../../lib/background/JobFactory.js';
import { MyClass } from '../support/dummies/models/MyClass.js';

describe('JobFactory', () => {
  afterEach(() => {
    JobFactory.reset();
  });

  describe('#build', () => {
    let factory;

    describe('when no klass is provided', () => {
      beforeEach(() => {
        factory = new JobFactory({});
      });

      it('builds an instance of the generic Job base class', () => {
        const job = factory.build({});
        expect(job).toBeInstanceOf(Job);
      });
    });

    describe('when a klass is provided', () => {
      beforeEach(() => {
        factory = new JobFactory({ klass: MyClass, attributes: { value: 'from-constructor' } });
      });

      it('builds an instance of the given klass', () => {
        expect(factory.build({})).toBeInstanceOf(MyClass);
      });

      it('merges constructor-level attributes into every build call', () => {
        expect(factory.build({})).toEqual(new MyClass({ value: 'from-constructor' }));
      });

      it('lets build-time params override constructor-level attributes', () => {
        expect(factory.build({ value: 'from-build' })).toEqual(new MyClass({ value: 'from-build' }));
      });
    });
  });

  describe('.build', () => {
    it('creates and registers a factory under the given name', () => {
      const factory = JobFactory.build('MyFactory', { klass: MyClass });

      expect(factory).toBeInstanceOf(JobFactory);
      expect(JobFactory.get('MyFactory')).toBe(factory);
    });
  });

  describe('.registry / .get / .reset', () => {
    let factory;

    beforeEach(() => {
      factory = new JobFactory({ klass: MyClass });
    });

    describe('.registry and .get', () => {
      it('registers and retrieves a factory by name', () => {
        JobFactory.registry('MyFactory', factory);
        expect(JobFactory.get('MyFactory')).toBe(factory);
      });

      it('returns undefined for an unregistered name', () => {
        expect(JobFactory.get('Unknown')).toBeUndefined();
      });
    });

    describe('.reset', () => {
      it('clears all registered factories', () => {
        JobFactory.registry('MyFactory', factory);
        JobFactory.reset();
        expect(JobFactory.get('MyFactory')).toBeUndefined();
      });
    });
  });
});
