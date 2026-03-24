import { Factory } from '../../lib/factories/Factory.js';
import { MyClass } from '../support/models/MyClass.js';

describe('Factory', () => {
  let factory;

  describe('build', () => {
    describe('when no options are provided', () => {
      beforeEach(() => {
        factory = new Factory();
      });

      it('builds a blank object', () => {
        expect(factory.build()).toEqual({});
      });
    });

    describe('when a builder is provided', () => {
      beforeEach(() => {
        factory = new Factory({ builder: ({ value = 'value' } = {}) => ({ key: value }) });
      });

      describe('when building without arguments', () => {
        it('builds an object using the builder', () => {
          expect(factory.build()).toEqual({ key: 'value' });
        });
      });

      describe('when building with arguments', () => {
        it('builds an object using the builder with the provided arguments', () => {
          expect(factory.build({ value: 'custom' })).toEqual({ key: 'custom' });
        });
      });
    });

    describe('when a class is provided', () => {
      beforeEach(() => {
        factory = new Factory({ klass: MyClass });
      });

      describe('when building without arguments', () => {
        it('builds an object using the class', () => {
          expect(factory.build()).toEqual(new MyClass());
        });
      });

      describe('when building with arguments', () => {
        it('builds an object using the class with the provided arguments', () => {
          expect(factory.build({ value: 'custom' })).toEqual(new MyClass({ value: 'custom' }));
        });
      });
    });

    describe('when an attributes generator is provided', () => {
      beforeEach(() => {
        const generator = {
          generate: (args) => ({ value: 'value', ...args})
        };
        const builder = (attributes) => ({ ...attributes });
        factory = new Factory({ attributesGenerator: generator, builder });
      });

      describe('when building without arguments', () => {
        it('builds an object using the attributes generator', () => {
          expect(factory.build()).toEqual({ value: 'value' });
        });
      });

      describe('when building with arguments without override', () => {
        it('builds an object using the attributes generator with the provided arguments', () => {
          expect(factory.build({ other: 'custom' })).toEqual({ value: 'value', other: 'custom' });
        });
      });

      describe('when building with arguments with override', () => {
        it('builds an object using the attributes generator with the provided arguments', () => {
          expect(factory.build({ value: 'custom' })).toEqual({ value: 'custom' });
        });
      });
    });
  });
});