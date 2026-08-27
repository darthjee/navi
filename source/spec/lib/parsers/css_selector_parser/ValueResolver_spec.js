import { ValueResolver } from '../../../../lib/parsers/css_selector_parser/ValueResolver.js';

describe('ValueResolver', () => {
  describe('#resolve', () => {
    describe('when selector matches a target', () => {
      it('extracts the configured value from the target', () => {
        const target = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('  /widget  '),
        };
        const element = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(target),
        };
        const resolver = new ValueResolver({ selector: 'a', attribute: 'href' });

        expect(resolver.resolve(element)).toEqual('/widget');
        expect(element.querySelector).toHaveBeenCalledOnceWith('a');
      });
    });

    describe('when selector matches nothing', () => {
      it('returns null', () => {
        const element = {
          querySelector: jasmine.createSpy('querySelector').and.returnValue(null),
        };

        expect(new ValueResolver({ selector: 'a' }).resolve(element)).toBeNull();
      });
    });

    [undefined, '', null].forEach((selector) => {
      describe(`when selector is ${String(selector)}`, () => {
        it('uses the element itself', () => {
          const element = {
            text: '  Widget  ',
            querySelector: jasmine.createSpy('querySelector'),
          };

          expect(new ValueResolver({ selector }).resolve(element)).toEqual('Widget');
          expect(element.querySelector).not.toHaveBeenCalled();
        });
      });
    });

    describe('when trim is false', () => {
      it('preserves the raw value', () => {
        const target = { text: '  Widget  ' };
        const element = { querySelector: jasmine.createSpy('querySelector').and.returnValue(target) };

        expect(new ValueResolver({ selector: 'h2', trim: false }).resolve(element))
          .toEqual('  Widget  ');
      });
    });
  });
});
