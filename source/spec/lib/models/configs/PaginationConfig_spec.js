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
      it('defaults to 1-based page numbers', () => {
        const config = PaginationConfig.fromList([
          { pages: 'parsedBody.pages', page_key: 'page' },
        ]);
        expect(config.pageNumbers(3)).toEqual([1, 2, 3]);
      });
    });

    describe('when zero_indexed is true', () => {
      it('returns 0-based page numbers', () => {
        const config = PaginationConfig.fromList([
          { pages: 'parsedBody.pages', page_key: 'page' },
          { zero_indexed: true },
        ]);
        expect(config.pageNumbers(3)).toEqual([0, 1, 2]);
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

  describe('#pageNumbers', () => {
    describe('when zero_indexed is false (default)', () => {
      let config;

      beforeEach(() => {
        config = PaginationConfig.fromList([
          { pages: 'parsedBody.pages', page_key: 'page' },
        ]);
      });

      it('returns [1] for count 1', () => {
        expect(config.pageNumbers(1)).toEqual([1]);
      });

      it('returns [1, 2, 3] for count 3', () => {
        expect(config.pageNumbers(3)).toEqual([1, 2, 3]);
      });
    });

    describe('when zero_indexed is true', () => {
      let config;

      beforeEach(() => {
        config = PaginationConfig.fromList([
          { pages: 'parsedBody.pages', page_key: 'page' },
          { zero_indexed: true },
        ]);
      });

      it('returns [0] for count 1', () => {
        expect(config.pageNumbers(1)).toEqual([0]);
      });

      it('returns [0, 1, 2] for count 3', () => {
        expect(config.pageNumbers(3)).toEqual([0, 1, 2]);
      });
    });
  });
});
