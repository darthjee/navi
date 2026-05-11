import { HandlerConfig } from '../../../../lib/common/server/HandlerConfig.js';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { Link } from '../../../../lib/models/configs/Link.js';
import { ClientRegistry } from '../../../../lib/registry/ClientRegistry.js';
import { LinksHandler } from '../../../../lib/server/handlers/LinksHandler.js';
import { Client } from '../../../../lib/services/Client.js';

describe("describe('LinksHandler'", () => {
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

  it('is an instance of RequestHandlerExecutor', () => {
    expect(new LinksHandler({}, res, [])).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when links are configured', () => {
      it('responds with serialized links', () => {
        const links = [
          new Link({ url: 'https://shared.com' }),
          new Link({ text: 'Docs', url: 'https://shared.test/docs' }),
        ];

        new LinksHandler({}, res, links).handle();

        expect(res.json).toHaveBeenCalledWith({
          links: [
            { text: 'https://shared.com', url: 'https://shared.com' },
            { text: 'Docs', url: 'https://shared.test/docs' },
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

        new LinksHandler({}, res, []).handle();

        expect(res.json).toHaveBeenCalledWith({
          links: [{ text: 'Default Domain', url: 'https://example.com' }],
        });
      });
    });

    describe('when no links are configured', () => {
      it('responds with only client-derived links', () => {
        new LinksHandler({}, res, []).handle();

        expect(res.json).toHaveBeenCalledWith({
          links: [{ text: 'default', url: 'https://example.com' }],
        });
      });
    });

    describe('when instantiated via HandlerConfig', () => {
      const handleConfiguredLinks = (links) => {
        new HandlerConfig(LinksHandler, [links]).handle({}, res);
      };

      it('responds with client-derived links when no links are configured', () => {
        handleConfiguredLinks([]);

        expect(res.json).toHaveBeenCalledWith({
          links: [{ text: 'default', url: 'https://example.com' }],
        });
      });

      it('responds with configured and client-derived links when one link is configured', () => {
        handleConfiguredLinks([new Link({ text: 'Docs', url: 'https://shared.test/docs' })]);

        expect(res.json).toHaveBeenCalledWith({
          links: [
            { text: 'Docs', url: 'https://shared.test/docs' },
            { text: 'default', url: 'https://example.com' },
          ],
        });
      });

      it('responds with configured and client-derived links when multiple links are configured', () => {
        handleConfiguredLinks([
          new Link({ url: 'https://shared.com' }),
          new Link({ text: 'Docs', url: 'https://shared.test/docs' }),
        ]);

        expect(res.json).toHaveBeenCalledWith({
          links: [
            { text: 'https://shared.com', url: 'https://shared.com' },
            { text: 'Docs', url: 'https://shared.test/docs' },
            { text: 'default', url: 'https://example.com' },
          ],
        });
      });
    });
  });
});
