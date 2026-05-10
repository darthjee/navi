import { Link } from '../../../../lib/models/configs/Link.js';
import { ClientRegistry } from '../../../../lib/registry/ClientRegistry.js';
import { LinksRequestHandler } from '../../../../lib/server/handlers/LinksRequestHandler.js';
import { Client } from '../../../../lib/services/Client.js';

describe('LinksRequestHandler', () => {
  let res;

  beforeEach(() => {
    ClientRegistry.reset();
    ClientRegistry.build({
      default: new Client({ name: 'default', baseUrl: 'https://example.com' }),
    });
    res = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    ClientRegistry.reset();
  });

  describe('#handle', () => {
    describe('when links are configured', () => {
      it('responds with serialized links', () => {
        const handler = new LinksRequestHandler({
          links: [
            new Link({ url: 'https://shared.com' }),
            new Link({ text: 'Docs', url: 'https://shared.com/docs' }),
          ],
        });

        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({
          links: [
            { text: 'https://shared.com', url: 'https://shared.com' },
            { text: 'Docs', url: 'https://shared.com/docs' },
            { text: 'default', url: 'https://example.com' },
          ],
        });
      });
    });

    describe('when clients have link text configured', () => {
      it('uses the configured text instead of client key', () => {
        ClientRegistry.reset();
        ClientRegistry.build({
          default: new Client({ name: 'default', baseUrl: 'https://example.com', linkText: 'Default Domain' }),
        });

        const handler = new LinksRequestHandler();
        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({
          links: [
            { text: 'Default Domain', url: 'https://example.com' },
          ],
        });
      });
    });

    describe('when links are not configured', () => {
      it('responds with an empty list', () => {
        const handler = new LinksRequestHandler();
        handler.handle({}, res);
        expect(res.json).toHaveBeenCalledWith({
          links: [{ text: 'default', url: 'https://example.com' }],
        });
      });
    });
  });
});
