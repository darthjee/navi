import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Invariant: the path is built solely from the hardcoded relative literal
// '../index.html' and import.meta.url — no variable/user input is involved.
// eslint-disable-next-line security/detect-non-literal-fs-filename
const indexHtml = readFileSync(
  fileURLToPath(new URL('../index.html', import.meta.url)),
  'utf-8',
);

const importmap = JSON.parse(
  indexHtml.match(/<script type="importmap">\s*([\s\S]*?)<\/script>/)[1],
);

const VENDOR_CHUNK = '/assets/react-vendor.js';

describe('index.html importmap', () => {
  it('points every React specifier at the shared react-vendor chunk', () => {
    const specifiers = [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ];

    specifiers.forEach((specifier) => {
      expect(importmap.imports[specifier]).toBe(VENDOR_CHUNK);
    });
  });

  it('exposes react/jsx-runtime so externalised extension bundles resolve', () => {
    expect(importmap.imports['react/jsx-runtime']).toBe(VENDOR_CHUNK);
  });

  it('exposes react/jsx-dev-runtime for dev builds of extension bundles', () => {
    expect(importmap.imports['react/jsx-dev-runtime']).toBe(VENDOR_CHUNK);
  });
});
