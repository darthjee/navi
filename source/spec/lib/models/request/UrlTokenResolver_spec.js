import { UrlTokenResolver } from '../../../../lib/models/request/UrlTokenResolver.js';

describe('UrlTokenResolver', () => {
  describe('.resolve', () => {
    describe('when the URL has no tokens', () => {
      it('returns the URL unchanged', () => {
        expect(UrlTokenResolver.resolve('/categories.json', {})).toEqual('/categories.json');
      });
    });

    describe('when a token has a matching parameter', () => {
      it('replaces the token with the parameter value', () => {
        expect(UrlTokenResolver.resolve('/categories/{:id}.json', { id: 1 })).toEqual('/categories/1.json');
      });
    });

    describe('when a token has no matching parameter', () => {
      it('leaves the token unchanged', () => {
        expect(UrlTokenResolver.resolve('/categories/{:id}.json', {})).toEqual('/categories/{:id}.json');
      });
    });

    describe('when the URL has multiple tokens', () => {
      it('replaces every token that has a matching parameter', () => {
        const url = '/categories/{:cat}/items/{:item}';

        expect(UrlTokenResolver.resolve(url, { cat: 5, item: 3 })).toEqual('/categories/5/items/3');
      });

      it('leaves unmatched tokens unchanged while resolving matched ones', () => {
        const url = '/categories/{:cat}/items/{:item}';

        expect(UrlTokenResolver.resolve(url, { cat: 5 })).toEqual('/categories/5/items/{:item}');
      });
    });
  });
});
