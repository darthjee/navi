import { Link } from '../../../../lib/models/configs/Link.js';
import { LinksRequestHandler } from '../../../../lib/server/handlers/LinksRequestHandler.js';

describe('LinksRequestHandler', () => {
  let res;

  beforeEach(() => {
    res = { json: jasmine.createSpy('json') };
  });

  describe('#handle', () => {
    describe('when links are configured', () => {
      it('responds with serialized links', () => {
        const handler = new LinksRequestHandler({
          links: [
            new Link({ url: 'https://example.com' }),
            new Link({ text: 'Docs', url: 'https://example.com/docs' }),
          ],
        });

        handler.handle({}, res);

        expect(res.json).toHaveBeenCalledWith({
          links: [
            { text: 'https://example.com', url: 'https://example.com' },
            { text: 'Docs', url: 'https://example.com/docs' },
          ],
        });
      });
    });

    describe('when links are not configured', () => {
      it('responds with an empty list', () => {
        const handler = new LinksRequestHandler();
        handler.handle({}, res);
        expect(res.json).toHaveBeenCalledWith({ links: [] });
      });
    });
  });
});
