# Dev-container `navi-hey/extension` parity

Production (`dockerfiles/production_navi_hey/Dockerfile`) already sets
`ENV NAVI_EXTENSIONS_DIR=/navi/extensions` and symlinks the globally-installed
package to `/navi/node_modules/navi-hey` so that `import ... from
'navi-hey/extension'` resolves from a file under the `/navi/extensions` mount.
The dev image has neither, so the worked-example fixture would not resolve the
same way under `spec/` or in `navi_extensions_app`.

## What to do

In `dockerfiles/dev_navi_hey/Dockerfile`:

- Add `ENV NAVI_EXTENSIONS_DIR=/navi/extensions` (parity with prod; the default
  is the same value, but set it explicitly per the image's "every setting → ENV"
  convention).
- Add the symlink one level **above** the mount point. The dev image installs
  nothing globally — the package *is* the bind-mounted source tree at
  `/home/node/app` — so the link target is that path:
  ```dockerfile
  RUN mkdir -p /navi/node_modules \
   && ln -s /home/node/app /navi/node_modules/navi-hey
  ```
  Node resolving `navi-hey/extension` from `/navi/extensions/backend/orders.js`
  then walks `.../backend/node_modules` → `/navi/extensions/node_modules` →
  `/navi/node_modules/navi-hey` → `source/package.json` `exports` ✓.
- Confirm ordering: the `mkdir`/`ln` must come after any step that would clobber
  `/navi`, and the `USER` switch (if any) must still leave `/navi` writable at
  build time only (the link is static).

## Files to Change

- `dockerfiles/dev_navi_hey/Dockerfile` — `ENV NAVI_EXTENSIONS_DIR` + the
  `/navi/node_modules/navi-hey` → `/home/node/app` symlink.

## Notes

- `make build-dev` rebuilds `navi:dev`; the `smoke-extensions` target/job runs it
  before booting the service, so this change is picked up without any registry
  push.
- No change to `dockerfiles/production_navi_hey/Dockerfile` — it is already done.
