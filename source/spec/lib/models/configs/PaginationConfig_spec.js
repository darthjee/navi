import { MissingMappingVariable } from '../../../../lib/exceptions/registry/MissingMappingVariable.js';
import { PaginationConfig } from '../../../../lib/models/configs/PaginationConfig.js';

describe('PaginationConfig', () => {
  describe('.fromList', () => {
    describe('when called with a list of config objects', () => {
      it('returns a PaginationConfig instance', () => {
        const config = PaginationConfig.fromList([
          { pages: 'headers[\'x-total-pages\']', page_key: 'page' },
        ]);
        expect(config).toBeInstanceOf(PaginationConfig);
      });
    });

    describe('when zero_indexed is not provided', () => {
      it('defaults zeroIndexed to false', () => {
        const config = PaginationConfig.fromList([
          { pages: 'parsedBody.pages', page_key: 'page' },
        ]);
        expect(config.zeroIndexed).toBeFalse();
      });
    });

    describe('when zero_indexed is true', () => {
      it('sets zeroIndexed to true', () => {
        const config = PaginationConfig.fromList([
          { pages: 'parsedBody.pages', page_key: 'page' },
          { zero_indexed: true },
        ]);
        expect(config.zeroIndexed).toBeTrue();
      });
    });
  });

  describe('#pageKey', () => {
    it('returns the page_key value', () => {
      const config = PaginationConfig.fromList([
        { pages: 'parsedBody.pages', page_key: 'p' },
      ]);
      expect(config.pageKey).toBe('p');
    });
  });

  describe('#resolvePages', () => {
    describe('when resolving from parsedBody', () => {
      it('returns the resolved value from parsedBody', () => {
        const config = PaginationConfig.fromList([
          { pages: 'parsedBody.total_pages', page_key: 'page' },
        ]);
        const responseWrapper = { parsedBody: { total_pages: 5 }, headers: {} };
        expect(config.resolvePages(responseWrapper)).toBe(5);
      });
    });

    describe('when resolving from headers', () => {
      it('returns the resolved value from headers', () => {
        const config = PaginationConfig.fromList([
          { pages: 'headers[\'x-total-pages\']', page_key: 'page' },
        ]);
        const responseWrapper = { parsedBody: {}, headers: { 'x-total-pages': 4 } };
        expect(config.resolvePages(responseWrapper)).toBe(4);
      });
    });

    describe('when the path is missing from the wrapper', () => {
      it('throws MissingMappingVariable', () => {
        const config = PaginationConfig.fromList([
          { pages: 'parsedBody.missing_field', page_key: 'page' },
        ]);
        const responseWrapper = { parsedBody: {}, headers: {} };
        expect(() => config.resolvePages(responseWrapper))
          .toThrowMatching((error) => error instanceof MissingMappingVariable);
      });
    });
  });

  describe('#zeroIndexed', () => {
    it('returns false by default', () => {
      const config = PaginationConfig.fromList([
        { pages: 'parsedBody.pages', page_key: 'page' },
      ]);
      expect(config.zeroIndexed).toBeFalse();
    });

    it('returns true when zero_indexed is configured', () => {
      const config = PaginationConfig.fromList([
        { pages: 'parsedBody.pages', page_key: 'page' },
        { zero_indexed: true },
      ]);
      expect(config.zeroIndexed).toBeTrue();
    });
  });
});
