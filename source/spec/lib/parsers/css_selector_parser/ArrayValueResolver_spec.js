import { ArrayValueResolver } from '../../../../lib/parsers/css_selector_parser/ArrayValueResolver.js';

describe('ArrayValueResolver', () => {
  describe('#resolve', () => {
    describe('when selector matches multiple targets', () => {
      it('extracts every target directly', () => {
        const targets = [{ text: '  new  ' }, { text: '  sale  ' }];
        const element = {
          querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue(targets),
        };

        expect(new ArrayValueResolver({ selector: '.tag' }).resolve(element))
          .toEqual(['new', 'sale']);
        expect(element.querySelectorAll).toHaveBeenCalledOnceWith('.tag');
      });
    });

    describe('when selector matches no targets', () => {
      it('returns an empty array', () => {
        const element = {
          querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([]),
        };

        expect(new ArrayValueResolver({ selector: '.tag' }).resolve(element)).toEqual([]);
      });
    });

    describe('when selector is absent', () => {
      describe('and the element resolves to a value', () => {
        it('wraps the value in an array through ValueResolver', () => {
          const element = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue('  A1  '),
          };

          expect(new ArrayValueResolver({ attribute: 'data-sku' }).resolve(element))
            .toEqual(['A1']);
        });
      });

      describe('and the element resolves to null', () => {
        it('returns an empty array', () => {
          const element = {
            getAttribute: jasmine.createSpy('getAttribute').and.returnValue(undefined),
          };

          expect(new ArrayValueResolver({ attribute: 'data-sku' }).resolve(element)).toEqual([]);
        });
      });
    });

    describe('when trim is false', () => {
      it('preserves every raw value', () => {
        const element = {
          querySelectorAll: jasmine.createSpy('querySelectorAll').and.returnValue([
            { text: '  new  ' },
            { text: '  sale  ' },
          ]),
        };

        expect(new ArrayValueResolver({ selector: '.tag', trim: false }).resolve(element))
          .toEqual(['  new  ', '  sale  ']);
      });
    });
  });
});
