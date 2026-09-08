# Docker Plan: Backend: load and register extra route handlers from a mounted folder

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **relies on** the engine agent having added the `exports` map to
`source/package.json` (`"./extension": "./lib/common/server/RequestHandler.js"`),
which ships in the published `navi-hey` package via `npm install -g navi-hey`.
This agent **produces**:

- `ENV NAVI_EXTENSIONS_DIR=/navi/extensions` in the production image (matches the
  in-code default; `NAVI_EXTENSIONS_ENABLED` stays unset → feature off by
  default).
- A `node_modules` symlink so a mounted `backend/*.js` file can resolve
  `import { RequestHandler } from 'navi-hey/extension'`. Node's ESM resolver
  walks `node_modules` **upward** from the importing file, and the operator's
  bind mount shadows anything the image writes *inside* `NAVI_EXTENSIONS_DIR`, so
  the link must sit one level **above** the mount point:

  ```dockerfile
  RUN mkdir -p /navi/node_modules \
   && ln -s "$(npm root -g)/navi-hey" /navi/node_modules/navi-hey
  ```

  Resolution from `/navi/extensions/backend/foo.js` then walks
  `.../backend/node_modules` → `/navi/extensions/node_modules` →
  `/navi/node_modules/navi-hey` ✓.

The env-var names, the truthy list, and the `backend/` layout are all owned by
the engine agent (see [plan.md](plan.md)); this agent only sets the `DIR` default
and wires the volume example.

## Implementation Steps

### Step 1 — Production image: symlink + env default

`dockerfiles/production_navi_hey/Dockerfile`:

- After `RUN npm install -g navi-hey@${NAVI_VERSION}`, add the
  `mkdir -p /navi/node_modules && ln -s "$(npm root -g)/navi-hey"
  /navi/node_modules/navi-hey` `RUN` step.
- Add `ENV NAVI_EXTENSIONS_DIR=/navi/extensions` alongside the other `ENV` lines.
  Do **not** set `NAVI_EXTENSIONS_ENABLED` (off by default).
- The base image runs as `USER node` at the end; make sure the symlink `RUN`
  happens while still `root` (it currently is — `USER node` is the last
  instruction before `CMD`). `ln -s` does not need the target to exist at build
  time, but `$(npm root -g)/navi-hey` **does** exist here because the global
  install ran just above.

Verify: `make build` succeeds; `docker run --rm --entrypoint sh navi:latest -c
'readlink -f /navi/node_modules/navi-hey && node -e "import(\"navi-hey/extension\").then(m=>console.log(typeof m.RequestHandler))"'`
prints `function` (run the node check from `/navi/extensions/backend` to also
prove the upward walk — `mkdir -p /navi/extensions/backend` first).

### Step 2 — docker-compose.yml: opt-in example

`docker-compose.yml` is the local dev stack. Add a **commented** block to the
`navi_app` service showing how to exercise the feature locally, so it is
discoverable without turning it on for every dev run:

```yaml
  navi_app:
    <<: *base
    # environment:
    #   NAVI_EXTENSIONS_ENABLED: "true"
    # volumes:
    #   - ./docker_volumes/extensions:/navi/extensions
```

(Keep it consistent with how the file already merges `*base` and adds per-service
`volumes`; if a merge-key clash makes a commented `volumes:` awkward, put the
example in a comment header instead.) No behavioural change to the default stack.

## CI Checks

- production image: `make build` (CI job: `build-and-release`)

## Notes

- **Dev image is intentionally not changed.** `dockerfiles/dev_navi_hey` has no
  global `navi-hey` install, and the spec fixtures resolve `navi-hey/extension`
  via package **self-referencing** (the `exports` map) because they live inside
  the bind-mounted `source/` tree. A dev symlink would only be needed for an
  integration test that loads from a real `/navi/extensions` directory, which
  #803 does not add.
- If `$(npm root -g)` differs on the `darthjee/production_node:0.2.1` base from
  the usual `/usr/local/lib/node_modules`, the `$(npm root -g)` command
  substitution still resolves it correctly at build time — do not hard-code the
  path.
