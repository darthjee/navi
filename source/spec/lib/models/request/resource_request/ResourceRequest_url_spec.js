import { ResourceRequestFactory } from '../../../../support/factories/ResourceRequestFactory.js';

describe('ResourceRequest', () => {
  describe('#resolveUrl', () => {
    [
      {
        description: 'when there are no placeholders and no parameters',
        url: '/categories.json',
        parameters: {},
        expectedUrl: '/categories.json',
      },
      {
        description: 'when there is a single placeholder',
        url: '/categories/{:id}.json',
        parameters: { id: 1 },
        expectedUrl: '/categories/1.json',
      },
      {
        description: 'when there are multiple placeholders',
        url: '/categories/{:cat}/items/{:item}',
        parameters: { cat: 5, item: 3 },
        expectedUrl: '/categories/5/items/3',
      },
      {
        description: 'when no matching key exists',
        url: '/categories/{:id}.json',
        parameters: {},
        expectedUrl: '/categories/{:id}.json',
      },
      {
        description: 'when extra parameters are given for a plain URL',
        url: '/categories.json',
        parameters: { id: 1 },
        expectedUrl: '/categories.json',
      },
      {
        description: 'when called without arguments',
        url: '/categories/{:id}.json',
        expectedUrl: '/categories/{:id}.json',
      },
    ].forEach(({ description, url, parameters, expectedUrl }) => {
      it(`returns the expected URL ${description}`, () => {
        const request = ResourceRequestFactory.build({ url });
        expect(request.resolveUrl(parameters)).toEqual(expectedUrl);
      });
    });
  });

  describe('#needsParams', () => {
    [
      { description: 'when the URL has no placeholders', url: '/categories.json', expected: false },
      { description: 'when the URL has one placeholder', url: '/categories/{:id}.json', expected: true },
      {
        description: 'when the URL has multiple placeholders',
        url: '/categories/{:id}/items/{:item_id}',
        expected: true,
      },
      { description: 'for an empty URL', url: '', expected: false },
      {
        description: 'for a malformed placeholder without the colon prefix',
        url: '/categories/{id}.json',
        expected: false,
      },
    ].forEach(({ description, url, expected }) => {
      it(`returns ${expected} ${description}`, () => {
        expect(ResourceRequestFactory.build({ url }).needsParams()).toBe(expected);
      });
    });
  });

  describe('#hasUnresolvedTokens', () => {
    describe('when placeholders are satisfied', () => {
      [
        {
          description: 'when the URL has no placeholders',
          url: '/categories.json',
          parameters: {},
          expected: false,
        },
        {
          description: 'when a single placeholder is present as a non-empty string',
          url: '/bundle/{:slug}/',
          parameters: { slug: 'shoes' },
          expected: false,
        },
        {
          description: 'when a single placeholder is present as an empty string',
          url: '/bundle/{:slug}/',
          parameters: { slug: '' },
          expected: false,
        },
        {
          description: 'when a single placeholder is present as a number',
          url: '/categories/{:id}.json',
          parameters: { id: 1 },
          expected: false,
        },
        {
          description: 'when a single placeholder is present as a boolean',
          url: '/categories/{:active}.json',
          parameters: { active: false },
          expected: false,
        },
        {
          description: 'when all placeholders are satisfied',
          url: '/categories/{:cat}/items/{:item}',
          parameters: { cat: 5, item: 3 },
          expected: false,
        },
        {
          description: 'when extra unrelated keys are given alongside a satisfied placeholder',
          url: '/categories/{:id}.json',
          parameters: { id: 1, unrelated: 'value' },
          expected: false,
        },
      ].forEach(({ description, url, parameters, expected }) => {
        it(`returns ${expected} ${description}`, () => {
          const request = ResourceRequestFactory.build({ url });
          expect(request.hasUnresolvedTokens(parameters)).toBe(expected);
        });
      });
    });

    describe('when placeholders are unresolved', () => {
      [
        {
          description: 'when a single placeholder is absent',
          url: '/categories/{:id}.json',
          parameters: {},
          expected: true,
        },
        {
          description: 'when a single placeholder is explicitly null',
          url: '/categories/{:id}.json',
          parameters: { id: null },
          expected: true,
        },
        {
          description: 'when one of multiple placeholders is satisfied and the other is not',
          url: '/categories/{:cat}/items/{:item}',
          parameters: { cat: 5 },
          expected: true,
        },
        {
          description: 'when extra unrelated keys are given but the placeholder is absent',
          url: '/categories/{:id}.json',
          parameters: { unrelated: 'value' },
          expected: true,
        },
        {
          description: 'when called without arguments and the URL has a placeholder',
          url: '/categories/{:id}.json',
          expected: true,
        },
      ].forEach(({ description, url, parameters, expected }) => {
        it(`returns ${expected} ${description}`, () => {
          const request = ResourceRequestFactory.build({ url });
          expect(request.hasUnresolvedTokens(parameters)).toBe(expected);
        });
      });
    });

    it('is equivalent to needsParams() when called with no parameters', () => {
      [
        '/categories.json',
        '/categories/{:id}.json',
        '/categories/{:id}/items/{:item_id}',
      ].forEach((url) => {
        const request = ResourceRequestFactory.build({ url });
        expect(request.hasUnresolvedTokens()).toBe(request.needsParams());
      });
    });
  });
});
