import { ValueExtractor } from '../../../../lib/parsers/css_selector_parser/ValueExtractor.js';

describe('ValueExtractor', () => {
  describe('#extract', () => {
    describe('when attribute is undefined', () => {
      it('returns trimmed text content without reading an attribute', () => {
        const target = {
          text: '  Widget  ',
          getAttribute: jasmine.createSpy('getAttribute'),
        };

        expect(new ValueExtractor(undefined).extract(target)).toEqual('Widget');
        expect(target.getAttribute).not.toHaveBeenCalled();
      });
    });

    describe('when attribute is a non-empty string', () => {
      it('returns the trimmed attribute value', () => {
        const target = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('  /widget  '),
        };

        expect(new ValueExtractor('href').extract(target)).toEqual('/widget');
        expect(target.getAttribute).toHaveBeenCalledOnceWith('href');
      });
    });

    describe('when attribute is an empty string', () => {
      it('still reads the attribute instead of falling back to text', () => {
        const target = {
          text: 'fallback',
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('empty-key'),
        };

        expect(new ValueExtractor('').extract(target)).toEqual('empty-key');
        expect(target.getAttribute).toHaveBeenCalledOnceWith('');
      });
    });

    describe('when attribute is null', () => {
      it('still reads the attribute instead of falling back to text', () => {
        const target = {
          text: 'fallback',
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('null-key'),
        };

        expect(new ValueExtractor(null).extract(target)).toEqual('null-key');
        expect(target.getAttribute).toHaveBeenCalledOnceWith(null);
      });
    });

    describe('when the attribute is absent', () => {
      it('returns null', () => {
        const target = {
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue(undefined),
        };

        expect(new ValueExtractor('href').extract(target)).toBeNull();
      });
    });

    describe('when trim is false', () => {
      it('returns the raw value', () => {
        const target = { text: '  Widget  ' };

        expect(new ValueExtractor(undefined, false).extract(target)).toEqual('  Widget  ');
      });
    });
  });
});
