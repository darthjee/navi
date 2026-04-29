import { Factory } from '../../../lib/factory/Factory.js';
import { MyClass } from '../../support/dummies/models/MyClass.js';

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
        factory = new Factory({ attributesGenerator: generator, klass: MyClass });
      });

      describe('when building without arguments', () => {
        it('builds an object using the attributes generator', () => {
          expect(factory.build()).toEqual(new MyClass({ value: 'value' }));
        });
      });

      describe('when building with arguments without override', () => {
        it('builds an object using the attributes generator with the provided arguments', () => {
          expect(factory.build({ other: 'custom' })).toEqual(new MyClass({ value: 'value', other: 'custom' }));
        });
      });

      describe('when building with arguments with override', () => {
        it('builds an object using the attributes generator with the provided arguments', () => {
          expect(factory.build({ value: 'custom' })).toEqual(new MyClass({ value: 'custom' }));
        });
      });
    });
  });
});