import { loadExtensions, resetExtensionsCache } from '../../src/extensions/loadExtensions.js';

const fixture = (name) => new URL(`../support/fixtures/${name}`, import.meta.url).href;

const stubFetch = (impl) => spyOn(globalThis, 'fetch').and.callFake(impl);

const resolveManifest = (manifest) => () =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(manifest) });

describe('loadExtensions', () => {
  beforeEach(() => {
    resetExtensionsCache();
    spyOn(console, 'warn');
  });

  describe('when the manifest request fails', () => {
    beforeEach(() => {
      stubFetch(() => Promise.resolve({ ok: false, status: 503 }));
    });

    it('resolves to an empty array without throwing', async () => {
      await expectAsync(loadExtensions()).toBeResolvedTo([]);
    });

    it('warns about the failure', async () => {
      await loadExtensions();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('when the network rejects', () => {
    beforeEach(() => {
      stubFetch(() => Promise.reject(new Error('offline')));
    });

    it('resolves to an empty array', async () => {
      await expectAsync(loadExtensions()).toBeResolvedTo([]);
    });
  });

  describe('when the manifest body is not valid JSON', () => {
    beforeEach(() => {
      stubFetch(() => Promise.resolve({ ok: true, json: () => Promise.reject(new Error('bad json')) }));
    });

    it('resolves to an empty array', async () => {
      await expectAsync(loadExtensions()).toBeResolvedTo([]);
    });
  });

  describe('when bundles is missing or not an array', () => {
    beforeEach(() => {
      stubFetch(resolveManifest({ bundles: 'nope' }));
    });

    it('resolves to an empty array', async () => {
      await expectAsync(loadExtensions()).toBeResolvedTo([]);
    });
  });

  describe('when the manifest has no bundles', () => {
    beforeEach(() => {
      stubFetch(resolveManifest({ bundles: [] }));
    });

    it('resolves to an empty array', async () => {
      await expectAsync(loadExtensions()).toBeResolvedTo([]);
    });
  });

  describe('when a bundle import rejects', () => {
    beforeEach(() => {
      stubFetch(resolveManifest({
        bundles: [
          { src: fixture('does-not-exist.js') },
          { src: fixture('validReports.js') },
        ],
      }));
    });

    it('skips the broken bundle but still loads the others', async () => {
      const result = await loadExtensions();
      expect(result.map((d) => d.path)).toEqual(['/ext/reports']);
    });

    it('warns about the skipped bundle', async () => {
      await loadExtensions();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('when a bundle default export is not an array', () => {
    beforeEach(() => {
      stubFetch(resolveManifest({ bundles: [{ src: fixture('notArrayBundle.js') }] }));
    });

    it('skips the bundle and warns', async () => {
      const result = await loadExtensions();
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('when a bundle mixes valid and invalid descriptors', () => {
    beforeEach(() => {
      stubFetch(resolveManifest({ bundles: [{ src: fixture('mixedBundle.js') }] }));
    });

    it('keeps only the valid descriptors', async () => {
      const result = await loadExtensions();
      expect(result.map((d) => d.path)).toEqual(['/ext/valid', '/ext/also-valid']);
    });

    it('warns about the dropped descriptor', async () => {
      await loadExtensions();
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('when a bundle declares a stylesheet', () => {
    const href = '/extensions/frontend/reports.css';

    beforeEach(() => {
      stubFetch(resolveManifest({
        bundles: [{ src: fixture('validReports.js'), css: href }],
      }));
    });

    afterEach(() => {
      document.head
        .querySelectorAll(`link[href="${href}"]`)
        .forEach((link) => link.remove());
    });

    it('appends a single stylesheet link to the document head', async () => {
      await loadExtensions();
      resetExtensionsCache();
      await loadExtensions();

      const links = document.head.querySelectorAll(`link[rel="stylesheet"][href="${href}"]`);
      expect(links.length).toBe(1);
    });
  });

  describe('when several bundles resolve', () => {
    beforeEach(() => {
      stubFetch(resolveManifest({
        bundles: [
          { src: fixture('validReports.js') },
          { src: fixture('secondBundle.js') },
        ],
      }));
    });

    it('preserves manifest order then in-bundle order', async () => {
      const result = await loadExtensions();
      expect(result.map((d) => d.path)).toEqual(['/ext/reports', '/ext/metrics']);
    });

    it('memoises the result across calls', async () => {
      await loadExtensions();
      await loadExtensions();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
