import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RequestHandler } from '../../../../lib/common/server/RequestHandler.js';
import { FrontendManifestHandler } from '../../../../lib/server/handlers/FrontendManifestHandler.js';

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../support/fixtures/extensions',
);

describe('FrontendManifestHandler', () => {
  const originalEnv = { ...process.env };
  let response;

  const enable = (subdir) => {
    process.env.NAVI_EXTENSIONS_ENABLED = 'true';
    process.env.NAVI_EXTENSIONS_DIR = path.join(FIXTURES, subdir);
  };

  beforeEach(() => {
    response = { json: jasmine.createSpy('json') };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('is a RequestHandler', () => {
    expect(new FrontendManifestHandler({}, response)).toEqual(jasmine.any(RequestHandler));
  });

  describe('when the feature is disabled', () => {
    beforeEach(() => {
      delete process.env.NAVI_EXTENSIONS_ENABLED;
      process.env.NAVI_EXTENSIONS_DIR = path.join(FIXTURES, 'frontend-ok');
    });

    it('responds with an empty bundles list', () => {
      new FrontendManifestHandler({}, response).handle();

      expect(response.json).toHaveBeenCalledWith({ bundles: [] });
    });
  });

  describe('when enabled but the frontend folder is missing', () => {
    beforeEach(() => {
      enable('does-not-exist');
    });

    it('responds with an empty bundles list', () => {
      new FrontendManifestHandler({}, response).handle();

      expect(response.json).toHaveBeenCalledWith({ bundles: [] });
    });
  });

  describe('when enabled but the frontend entry is absent', () => {
    beforeEach(() => {
      enable('ok');
    });

    it('responds with an empty bundles list', () => {
      new FrontendManifestHandler({}, response).handle();

      expect(response.json).toHaveBeenCalledWith({ bundles: [] });
    });
  });

  describe('with bundles present', () => {
    beforeEach(() => {
      enable('frontend-ok');
    });

    it('lists the .js bundles in lexicographic order', () => {
      new FrontendManifestHandler({}, response).handle();

      expect(response.json).toHaveBeenCalledWith({
        bundles: [
          { src: '/extensions/frontend/a.js' },
          { src: '/extensions/frontend/b.js', css: '/extensions/frontend/b.css' },
        ],
      });
    });

    it('attaches css only to bundles with a sibling stylesheet', () => {
      new FrontendManifestHandler({}, response).handle();

      const { bundles } = response.json.calls.mostRecent().args[0];

      expect(bundles[0].css).toBeUndefined();
      expect(bundles[1].css).toBe('/extensions/frontend/b.css');
    });

    it('ignores non-.js files', () => {
      new FrontendManifestHandler({}, response).handle();

      const { bundles } = response.json.calls.mostRecent().args[0];

      expect(bundles.map((bundle) => bundle.src)).not.toContain('/extensions/frontend/notes.md');
    });
  });
});
