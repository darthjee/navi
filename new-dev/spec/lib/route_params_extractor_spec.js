import RouteParamsExtractor from '../../lib/route_params_extractor.js';

describe('RouteParamsExtractor', () => {
  describe('#steps', () => {
    describe('with no URL params', () => {
      it('returns string segments', () => {
        const extractor = new RouteParamsExtractor('/categories.json', {});
        expect(extractor.steps()).toEqual(['categories']);
      });
    });

    describe('with a single URL param', () => {
      it('casts the param value to a number', () => {
        const extractor = new RouteParamsExtractor('/categories/:id.json', { id: '3' });
        expect(extractor.steps()).toEqual(['categories', 3]);
      });
    });

    describe('with a mixed route', () => {
      it('returns a mix of strings and numbers', () => {
        const extractor = new RouteParamsExtractor('/categories/:id/items.json', { id: '2' });
        expect(extractor.steps()).toEqual(['categories', 2, 'items']);
      });
    });

    describe('with multiple URL params', () => {
      it('casts each param to a number', () => {
        const extractor = new RouteParamsExtractor(
          '/categories/:id/items/:item_id.json', { id: '3', item_id: '7' }
        );
        expect(extractor.steps()).toEqual(['categories', 3, 'items', 7]);
      });
    });
  });
});
