import { Link } from '../../../lib/models/configs/Link.js';
import { LinksSerializer } from '../../../lib/serializers/LinksSerializer.js';

describe('LinksSerializer', () => {
  describe('.serialize', () => {
    describe('when given a single link', () => {
      it('returns a plain object with url and text', () => {
        const link = new Link({ url: 'https://example.com', text: 'Example' });

        expect(LinksSerializer.serialize(link)).toEqual({
          url: 'https://example.com',
          text: 'Example',
        });
      });
    });

    describe('when given a list of links', () => {
      it('returns an array of serialized links', () => {
        const links = [
          new Link({ url: 'https://example.com' }),
          new Link({ url: 'https://example.com/docs', text: 'Docs' }),
        ];

        expect(LinksSerializer.serialize(links)).toEqual([
          { url: 'https://example.com', text: 'https://example.com' },
          { url: 'https://example.com/docs', text: 'Docs' },
        ]);
      });
    });
  });
});
