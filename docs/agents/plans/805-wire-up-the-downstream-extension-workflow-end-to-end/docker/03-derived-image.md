# Committed derived-image Dockerfile

SPEC-5 §6b / `extending-navi.md` describe the "bake the extension in" pattern only
in prose. Commit a real, buildable Dockerfile under `dockerfiles/` built from the
worked example, and cross-link it from the guide.

## What to do

`dockerfiles/navi_hey_extension_example/Dockerfile`:

```dockerfile
# Worked example: a derived image with the orders extension baked in.
# Build context = repo root; run `npm --prefix examples/navi-orders-extension ci`
# and `... run build` first so examples/navi-orders-extension/dist/ exists.
ARG NAVI_TAG=latest
FROM darthjee/navi-hey:${NAVI_TAG}

COPY examples/navi-orders-extension/dist/ /navi/extensions/
COPY examples/navi-orders-extension/config/menu.yml /home/node/app/config/menu.yml

ENV NAVI_EXTENSIONS_ENABLED=true
```

- `COPY dist/`, never `src/` — built artefacts only.
- Menu target is `/home/node/app/config/menu.yml` (the prod `NAVI_MENU` default
  after the `docs` reconciliation), **not** `/navi/menu.yml`.
- Add a matching compose snippet to the guide (image set to the derived tag, the
  two `volumes:` lines dropped) — the `docs` agent owns the prose; this step just
  provides the Dockerfile it points at.
- If the repo has a build-args convention (`Makefile` `build-image` uses
  `--build-arg NAVI_VERSION`), keep `ARG NAVI_TAG` consistent with it or reuse
  the same arg name.
- No CI build job for this image (production images build on version tags only);
  it exists as a documented, buildable reference. Optionally add a
  `build-extension-example-image` Make target that runs the example build then
  `docker build -f dockerfiles/navi_hey_extension_example/Dockerfile .`.

## Files to Change

- `dockerfiles/navi_hey_extension_example/Dockerfile` — new.
- `Makefile` — optional `build-extension-example-image` target (+ `.PHONY`).
