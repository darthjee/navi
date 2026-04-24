import { HtmlElementParser } from '../../../lib/utils/HtmlElementParser.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('HtmlElementParser', () => {
  let element;
  const selector = 'link[rel="stylesheet"]';

  beforeEach(() => {
    spyOn(Logger, 'warn').and.stub();
    element = jasmine.createSpyObj('element', ['getAttribute']);
  });

  describe('#getAttribute', () => {
    describe('when the attribute is present', () => {
      beforeEach(() => {
        element.getAttribute.and.returnValue('/styles.css');
      });

      it('returns the attribute value', () => {
        const parser = new HtmlElementParser(element, selector);
        expect(parser.getAttribute('href')).toBe('/styles.css');
      });

      it('does not log a warning', () => {
        const parser = new HtmlElementParser(element, selector);
        parser.getAttribute('href');
        expect(Logger.warn).not.toHaveBeenCalled();
      });
    });

    describe('when the attribute is absent (undefined)', () => {
      beforeEach(() => {
        element.getAttribute.and.returnValue(undefined);
      });

      it('returns null', () => {
        const parser = new HtmlElementParser(element, selector);
        expect(parser.getAttribute('src')).toBeNull();
      });

      it('logs a warning including the selector', () => {
        const parser = new HtmlElementParser(element, selector);
        parser.getAttribute('src');
        expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringContaining(selector));
      });

      it('logs a warning including the attribute name', () => {
        const parser = new HtmlElementParser(element, selector);
        parser.getAttribute('src');
        expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringContaining('src'));
      });
    });

    describe('when the attribute is absent (null)', () => {
      beforeEach(() => {
        element.getAttribute.and.returnValue(null);
      });

      it('returns null', () => {
        const parser = new HtmlElementParser(element, selector);
        expect(parser.getAttribute('src')).toBeNull();
      });

      it('logs a warning', () => {
        const parser = new HtmlElementParser(element, selector);
        parser.getAttribute('src');
        expect(Logger.warn).toHaveBeenCalled();
      });
    });
  });
});
