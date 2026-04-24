import { InvalidHtmlResponseBody } from '../../../lib/exceptions/InvalidHtmlResponseBody.js';
import { HtmlParser } from '../../../lib/utils/HtmlParser.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

describe('HtmlParser', () => {
  beforeEach(() => {
    spyOn(Logger, 'warn').and.stub();
  });

  describe('.parse', () => {
    describe('with a single matching element', () => {
      it('returns the attribute value in an array', () => {
        const html = '<html><head><link rel="stylesheet" href="/styles.css"></head></html>';

        const result = HtmlParser.parse(html, 'link[rel="stylesheet"]', 'href');

        expect(result).toEqual(['/styles.css']);
      });
    });

    describe('with multiple matching elements', () => {
      it('returns values from all matching elements', () => {
        const html = '<html><head>' +
          '<link rel="stylesheet" href="/a.css">' +
          '<link rel="stylesheet" href="/b.css">' +
          '</head></html>';

        const result = HtmlParser.parse(html, 'link[rel="stylesheet"]', 'href');

        expect(result).toEqual(['/a.css', '/b.css']);
      });
    });

    describe('when no elements match the selector', () => {
      it('returns an empty array', () => {
        const html = '<html><body></body></html>';

        const result = HtmlParser.parse(html, 'link[rel="stylesheet"]', 'href');

        expect(result).toEqual([]);
      });

      it('logs a warning', () => {
        const html = '<html><body></body></html>';

        HtmlParser.parse(html, 'link[rel="stylesheet"]', 'href');

        expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringContaining('link[rel="stylesheet"]'));
      });
    });

    describe('when a matched element is missing the target attribute', () => {
      it('skips the element and returns values from elements that have the attribute', () => {
        const html = '<html><body>' +
          '<img src="/img1.png">' +
          '<img alt="no-src">' +
          '<img src="/img2.png">' +
          '</body></html>';

        const result = HtmlParser.parse(html, 'img', 'src');

        expect(result).toEqual(['/img1.png', '/img2.png']);
      });

      it('logs a warning for each skipped element', () => {
        const html = '<html><body><img alt="no-src"></body></html>';

        HtmlParser.parse(html, 'img', 'src');

        expect(Logger.warn).toHaveBeenCalledWith(jasmine.stringContaining('src'));
      });
    });

    describe('when the HTML cannot be parsed', () => {
      it('throws InvalidHtmlResponseBody when passed null', () => {
        expect(() => HtmlParser.parse(null, 'img', 'src')).toThrowError(InvalidHtmlResponseBody);
      });
    });
  });
});
