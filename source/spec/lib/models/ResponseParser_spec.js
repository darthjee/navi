import { InvalidResponseBody } from '../../../lib/exceptions/InvalidResponseBody.js';
import { ResponseParser } from '../../../lib/models/ResponseParser.js';

describe('ResponseParser', () => {
  describe('#parse', () => {
    describe('when the body is a JSON array', () => {
      it('returns the parsed array', () => {
        const parser = new ResponseParser('[{"id":1},{"id":2}]');
        expect(parser.parse()).toEqual([{ id: 1 }, { id: 2 }]);
      });
    });

    describe('when the body is a JSON object', () => {
      it('returns the parsed object (not wrapped in an array)', () => {
        const parser = new ResponseParser('{"id":1,"name":"Electronics"}');
        expect(parser.parse()).toEqual({ id: 1, name: 'Electronics' });
      });
    });

    describe('when the body is invalid JSON', () => {
      it('throws InvalidResponseBody', () => {
        const parser = new ResponseParser('not valid json');
        expect(() => parser.parse()).toThrowMatching(
          (error) => error instanceof InvalidResponseBody
        );
      });

      it('exposes the raw body on the error', () => {
        const raw = 'not valid json';
        const parser = new ResponseParser(raw);
        let thrownError;
        try { parser.parse(); } catch (e) { thrownError = e; }
        expect(thrownError.raw).toBe(raw);
      });
    });

    describe('when the body is an empty string', () => {
      it('throws InvalidResponseBody', () => {
        const parser = new ResponseParser('');
        expect(() => parser.parse()).toThrowMatching(
          (error) => error instanceof InvalidResponseBody
        );
      });
    });
  });
});
