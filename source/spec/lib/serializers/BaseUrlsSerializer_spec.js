import { BaseUrlsSerializer } from '../../../lib/serializers/BaseUrlsSerializer.js';

describe('BaseUrlsSerializer', () => {
  describe('.serialize', () => {
    describe('with a single client', () => {
      const client = { baseUrl: 'https://example.com' };

      it('returns the base URL string', () => {
        expect(BaseUrlsSerializer.serialize(client)).toBe('https://example.com');
      });
    });

    describe('with an array of clients', () => {
      const clients = [
        { baseUrl: 'https://example.com' },
        { baseUrl: 'https://other.com' },
      ];

      it('returns an array of base URL strings', () => {
        expect(BaseUrlsSerializer.serialize(clients)).toEqual([
          'https://example.com',
          'https://other.com',
        ]);
      });
    });

    describe('with an empty array', () => {
      it('returns an empty array', () => {
        expect(BaseUrlsSerializer.serialize([])).toEqual([]);
      });
    });
  });
});
