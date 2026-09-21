import { transformSync } from 'esbuild';

/**
 * Custom Node.js ESM loader hook.
 *
 * - Transforms .jsx files to ESM JavaScript using esbuild with React's
 *   automatic JSX runtime (no explicit React import required).
 * - Mocks CSS/SCSS imports so they don't cause parse errors in Node.js.
 */
export async function load(url, context, nextLoad) {
  if (/\.(css|scss|sass|less)$/.test(url)) {
    return { format: 'module', source: 'export default {};', shortCircuit: true };
  }

  if (url.endsWith('.jsx')) {
    const result = await nextLoad(url, { ...context, format: 'module' });
    const source = typeof result.source === 'string'
      ? result.source
      : Buffer.from(result.source).toString('utf-8');

    const { code } = transformSync(source, {
      loader: 'jsx',
      jsx: 'automatic',
      format: 'esm',
    });

    return { format: 'module', source: code, shortCircuit: true };
  }

  return nextLoad(url, context);
}
