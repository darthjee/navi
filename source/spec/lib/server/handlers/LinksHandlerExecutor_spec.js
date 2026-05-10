import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { Link } from '../../../../lib/models/configs/Link.js';
import { ClientRegistry } from '../../../../lib/registry/ClientRegistry.js';
import { LinksHandlerExecutor } from '../../../../lib/server/handlers/LinksHandlerExecutor.js';
import { Client } from '../../../../lib/services/Client.js';

describe('LinksHandlerExecutor', () => {
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
    expect(new LinksHandlerExecutor({}, res, [])).toBeInstanceOf(RequestHandler);
  });

  describe('#handle', () => {
    describe('when links are configured', () => {
      it('responds with serialized links', () => {
        const links = [
          new Link({ url: 'https://shared.com' }),
          new Link({ text: 'Docs', url: 'https://shared.test/docs' }),
        ];

        new LinksHandlerExecutor({}, res, links).handle();

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

        new LinksHandlerExecutor({}, res, []).handle();

        expect(res.json).toHaveBeenCalledWith({
          links: [{ text: 'Default Domain', url: 'https://example.com' }],
        });
      });
    });

    describe('when no links are configured', () => {
      it('responds with only client-derived links', () => {
        new LinksHandlerExecutor({}, res, []).handle();

        expect(res.json).toHaveBeenCalledWith({
          links: [{ text: 'default', url: 'https://example.com' }],
        });
      });
    });
  });
});
