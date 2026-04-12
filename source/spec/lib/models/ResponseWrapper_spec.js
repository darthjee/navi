import { InvalidResponseBody } from '../../../lib/exceptions/InvalidResponseBody.js';
import { ResponseWrapper } from '../../../lib/models/ResponseWrapper.js';

describe('ResponseWrapper', () => {
  describe('#parsed_body', () => {
    describe('when the response body is a JSON object', () => {
      it('returns the parsed object', () => {
        const response = { data: '{"id":1,"name":"Electronics"}', headers: {} };
        const wrapper = new ResponseWrapper(response);
        expect(wrapper.parsed_body).toEqual({ id: 1, name: 'Electronics' });
      });
    });

    describe('when the response body is a JSON array', () => {
      it('returns the parsed array', () => {
        const response = { data: '[{"id":1},{"id":2}]', headers: {} };
        const wrapper = new ResponseWrapper(response);
        expect(wrapper.parsed_body).toEqual([{ id: 1 }, { id: 2 }]);
      });
    });

    describe('when the response body is invalid JSON', () => {
      it('throws InvalidResponseBody', () => {
        const response = { data: 'not json', headers: {} };
        const wrapper = new ResponseWrapper(response);
        expect(() => wrapper.parsed_body).toThrowMatching(
          (error) => error instanceof InvalidResponseBody
        );
      });
    });

    describe('when called multiple times', () => {
      it('returns the same cached value', () => {
        const response = { data: '{"id":1}', headers: {} };
        const wrapper = new ResponseWrapper(response);
        const first = wrapper.parsed_body;
        const second = wrapper.parsed_body;
        expect(first).toBe(second);
      });
    });
  });

  describe('#headers', () => {
    it('returns the response headers', () => {
      const headers = { 'content-type': 'application/json', page: '3' };
      const response = { data: '{}', headers };
      const wrapper = new ResponseWrapper(response);
      expect(wrapper.headers).toEqual(headers);
    });
  });

  describe('#parameters', () => {
    describe('when parameters are provided', () => {
      it('returns the given parameters', () => {
        const response = { data: '{}', headers: {} };
        const parameters = { id: 7, category_id: 3 };
        const wrapper = new ResponseWrapper(response, parameters);
        expect(wrapper.parameters).toBe(parameters);
      });
    });

    describe('when no parameters are provided', () => {
      it('defaults to an empty object', () => {
        const response = { data: '{}', headers: {} };
        const wrapper = new ResponseWrapper(response);
        expect(wrapper.parameters).toEqual({});
      });
    });
  });

  describe('#toItemWrappers', () => {
    describe('when the parsed body is an array', () => {
      it('returns one wrapper per array element', () => {
        const headers = { page: '1' };
        const response = { data: '[{"id":1},{"id":2}]', headers };
        const wrapper = new ResponseWrapper(response);

        const items = wrapper.toItemWrappers();

        expect(items.length).toBe(2);
        expect(items[0].parsed_body).toEqual({ id: 1 });
        expect(items[1].parsed_body).toEqual({ id: 2 });
      });

      it('shares the same headers across all item wrappers', () => {
        const headers = { page: '1' };
        const response = { data: '[{"id":1},{"id":2}]', headers };
        const wrapper = new ResponseWrapper(response);

        const items = wrapper.toItemWrappers();

        expect(items[0].headers).toBe(headers);
        expect(items[1].headers).toBe(headers);
      });

      it('propagates parameters to all item wrappers', () => {
        const headers = { page: '1' };
        const parameters = { category_id: 5 };
        const response = { data: '[{"id":1},{"id":2}]', headers };
        const wrapper = new ResponseWrapper(response, parameters);

        const items = wrapper.toItemWrappers();

        expect(items[0].parameters).toBe(parameters);
        expect(items[1].parameters).toBe(parameters);
      });
    });

    describe('when the parsed body is a single object', () => {
      it('returns a single-element array', () => {
        const headers = { page: '1' };
        const response = { data: '{"id":1}', headers };
        const wrapper = new ResponseWrapper(response);

        const items = wrapper.toItemWrappers();

        expect(items.length).toBe(1);
        expect(items[0].parsed_body).toEqual({ id: 1 });
        expect(items[0].headers).toBe(headers);
      });

      it('propagates parameters to the single item wrapper', () => {
        const headers = { page: '1' };
        const parameters = { category_id: 5 };
        const response = { data: '{"id":1}', headers };
        const wrapper = new ResponseWrapper(response, parameters);

        const items = wrapper.toItemWrappers();

        expect(items[0].parameters).toBe(parameters);
      });
    });
  });
});
