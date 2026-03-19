import { Factory } from '../../lib/utils/Factory.js';

describe('Factory', () => {
  let factory;

  describe('build', () => {
    describe('when nothing is not provided', () => {
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
      class MyClass {
        constructor({ value = 'value' } = {}) {
          this.key = value;
        }
      }

      beforeEach(() => {
        factory = new Factory({ klass: MyClass });
      });

      describe ('when building without arguments', () => {
        it('builds an object using the class', () => {
          expect(factory.build()).toEqual(new MyClass());
        });
      });

      describe ('when building with arguments', () => {
        it('builds an object using the class with the provided arguments', () => {
          expect(factory.build({ value: 'custom' })).toEqual(new MyClass({ value: 'custom' }));
        });
      });
    });
  });
});