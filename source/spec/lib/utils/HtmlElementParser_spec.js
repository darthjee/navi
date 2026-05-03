import { HtmlElementParser } from '../../../lib/utils/HtmlElementParser.js';

describe('HtmlElementParser', () => {
  let element;
  let logContext;
  const selector = 'link[rel="stylesheet"]';

  beforeEach(() => {
    logContext = jasmine.createSpyObj('logContext', ['debug', 'info', 'warn', 'error']);
    element = jasmine.createSpyObj('element', ['getAttribute']);
  });

  describe('#getAttribute', () => {
    describe('when the attribute is present', () => {
      beforeEach(() => {
        element.getAttribute.and.returnValue('/styles.css');
      });

      it('returns the attribute value', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        expect(parser.getAttribute('href')).toBe('/styles.css');
      });

      it('does not log a warning', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        parser.getAttribute('href');
        expect(logContext.warn).not.toHaveBeenCalled();
      });
    });

    describe('when the attribute is absent (undefined)', () => {
      beforeEach(() => {
        element.getAttribute.and.returnValue(undefined);
      });

      it('returns null', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        expect(parser.getAttribute('src')).toBeNull();
      });

      it('logs a warning including the selector', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        parser.getAttribute('src');
        expect(logContext.warn).toHaveBeenCalledWith(jasmine.stringContaining(selector));
      });

      it('logs a warning including the attribute name', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        parser.getAttribute('src');
        expect(logContext.warn).toHaveBeenCalledWith(jasmine.stringContaining('src'));
      });
    });

    describe('when the attribute is absent (null)', () => {
      beforeEach(() => {
        element.getAttribute.and.returnValue(null);
      });

      it('returns null', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        expect(parser.getAttribute('src')).toBeNull();
      });

      it('logs a warning', () => {
        const parser = new HtmlElementParser(element, selector, logContext);
        parser.getAttribute('src');
        expect(logContext.warn).toHaveBeenCalled();
      });
    });
  });
});
