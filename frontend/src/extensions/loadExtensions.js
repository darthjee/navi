const MANIFEST_URL = '/extensions/frontend.json';
const FETCH_TIMEOUT_MS = 2000;

const fetchManifest = () => {
  const controller = new AbortController();
  let timer;

  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('extensions manifest fetch timed out'));
    }, FETCH_TIMEOUT_MS);
    if (typeof timer.unref === 'function') timer.unref();
  });

  const request = fetch(MANIFEST_URL, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

  return Promise.race([request, timeout]).finally(() => clearTimeout(timer));
};

const appendStylesheet = (href) => {
  const selector = `link[rel="stylesheet"][href="${href}"]`;
  if (document.head.querySelector(selector)) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

const isValidDescriptor = (descriptor) => {
  if (!descriptor || typeof descriptor !== 'object') return false;

  const { path, text, component } = descriptor;
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/') || /\s/.test(path)) return false;
  if (typeof text !== 'string' || text.length === 0) return false;
  if (typeof component !== 'function') return false;

  return true;
};

const loadBundleDescriptors = async (bundle) => {
  if (bundle && typeof bundle.css === 'string') appendStylesheet(bundle.css);

  let mod;
  try {
    mod = await import(/* @vite-ignore */ bundle.src);
  } catch (err) {
    console.warn('[extensions] skipping', bundle.src, err);
    return [];
  }

  const descriptors = mod.default;
  if (!Array.isArray(descriptors)) {
    console.warn('[extensions] skipping', bundle.src, 'default export is not an array');
    return [];
  }

  return descriptors.filter((descriptor, i) => {
    if (isValidDescriptor(descriptor)) return true;
    console.warn('[extensions] skipping descriptor', i, 'in', bundle.src);
    return false;
  });
};

const doLoad = async () => {
  let manifest;
  try {
    manifest = await fetchManifest();
  } catch (err) {
    console.warn('[extensions] failed to load manifest', err);
    return [];
  }

  const bundles = manifest && manifest.bundles;
  if (!Array.isArray(bundles)) return [];

  const results = [];
  for (const bundle of bundles) {
    results.push(...await loadBundleDescriptors(bundle));
  }
  return results;
};

let promise;

/**
 * Loads externally built extension bundles described by the server manifest.
 * Fetches `/extensions/frontend.json`, dynamically imports each bundle, and
 * validates its default-exported route descriptors. Never rejects; on any
 * failure it warns and yields the survivors (possibly an empty array). The
 * fetch/import work runs at most once per page load.
 * @returns {Promise<Array<{path: string, text: string, component: Function}>>}
 */
export const loadExtensions = () => (promise ??= doLoad());

/**
 * Clears the memoised result so the next `loadExtensions()` call re-runs the
 * fetch and imports. Intended for tests and hot-module reloads.
 */
export const resetExtensionsCache = () => {
  promise = undefined;
};

export default loadExtensions;
