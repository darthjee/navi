import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { BaseUrlsRequestHandler } from '../../../lib/server/BaseUrlsRequestHandler.js';
import { Client } from '../../../lib/services/Client.js';

describe('BaseUrlsRequestHandler', () => {
  let handler;
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
    handler = new BaseUrlsRequestHandler();
  });

  afterEach(() => {
    ClientRegistry.reset();
  });

  describe('#handle', () => {
    describe('with multiple clients with distinct base URLs', () => {
      beforeEach(() => {
        ClientRegistry.build({
          default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
          other:   new Client({ name: 'other', baseUrl: 'https://other.com' }),
        });
      });

      it('responds with all base URLs', () => {
        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({
          base_urls: jasmine.arrayContaining(['https://example.com', 'https://other.com']),
        });
      });

      it('responds with the correct number of base URLs', () => {
        handler.handle({}, res);

        const [response] = res.json.calls.mostRecent().args;

        expect(response.base_urls.length).toBe(2);
      });
    });

    describe('with duplicate base URLs across clients', () => {
      beforeEach(() => {
        ClientRegistry.build({
          first:  new Client({ name: 'first', baseUrl: 'https://example.com' }),
          second: new Client({ name: 'second', baseUrl: 'https://example.com' }),
        });
      });

      it('deduplicates the base URLs', () => {
        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ base_urls: ['https://example.com'] });
      });
    });

    describe('with a single client', () => {
      beforeEach(() => {
        ClientRegistry.build({
          default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
        });
      });

      it('responds with a single-element array', () => {
        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({ base_urls: ['https://example.com'] });
      });
    });
  });
});
