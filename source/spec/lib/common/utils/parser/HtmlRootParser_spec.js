import { HtmlRootParser } from '../../../../../lib/common/utils/parser/HtmlRootParser.js';
import { InvalidHtmlResponseBody } from '../../../../../lib/exceptions/request/InvalidHtmlResponseBody.js';

describe('HtmlRootParser', () => {
  let parser;

  beforeEach(() => {
    parser = new HtmlRootParser();
  });

  describe('#parse', () => {
    describe('when rawBody contains valid HTML', () => {
      it('returns a DOM root', () => {
        const root = parser.parse('<main><h1>Title</h1></main>');

        expect(root.querySelector('h1').text).toEqual('Title');
      });
    });

    describe('when rawBody cannot be parsed', () => {
      it('throws InvalidHtmlResponseBody with the raw body and original cause', () => {
        let error;

        try {
          parser.parse(null);
        } catch (cause) {
          error = cause;
        }

        expect(error).toEqual(jasmine.any(InvalidHtmlResponseBody));
        expect(error.raw).toBeNull();
        expect(error.cause).toEqual(jasmine.any(Error));
      });
    });
  });
});
