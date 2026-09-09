# `vite.config.js` vendor chunk + `index.html` import map

Guarantee exactly one React instance shared between the host SPA and externally
built extension bundles (shared contract #5).

## `frontend/vite.config.js`

Add to the existing `defineConfig({ build: { ... } })`:

```js
build: {
  outDir: 'dist',
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
      },
      chunkFileNames: (chunkInfo) =>
        chunkInfo.name === 'react-vendor'
          ? 'assets/react-vendor.js'
          : 'assets/[name]-[hash].js',
    },
  },
},
```

- Only the `react-vendor` chunk gets a stable, unhashed name; every other chunk
  keeps content-hashing.
- `entryFileNames` / `assetFileNames` are left at Vite defaults.
- Verify after `yarn build` that `frontend/dist/assets/react-vendor.js` exists
  and that the entry chunk imports it (so the host and the import map resolve to
  the same module instance / URL).

## `frontend/index.html`

Add the import map immediately before `<script type="module" src="/src/main.jsx">`:

```html
<script type="importmap">
{
  "imports": {
    "react": "/assets/react-vendor.js",
    "react-dom": "/assets/react-vendor.js",
    "react-dom/client": "/assets/react-vendor.js",
    "react-router-dom": "/assets/react-vendor.js"
  }
}
</script>
```

The import map only affects bare specifiers resolved at **runtime** (i.e. inside
mounted extension bundles). The host's own build-time imports are unaffected.

## Fallback

If pinning the chunk filename proves unreliable with the React 19 +
`babel-plugin-react-compiler` toolchain (e.g. the vendor chunk splits, or Vite
refuses the fixed name), switch to a tiny local Vite plugin with a
`generateBundle` / `transformIndexHtml` (post) hook that reads the emitted bundle
map and writes the import map into `index.html` with the real hashed filenames.
Keep the four specifiers and the "one React, host-provided" contract identical.

## Files to Change

- `frontend/vite.config.js` — `build.rollupOptions.output.manualChunks` +
  `chunkFileNames`.
- `frontend/index.html` — `<script type="importmap">`.
