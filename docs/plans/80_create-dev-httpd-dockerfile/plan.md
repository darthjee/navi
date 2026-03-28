# Plan: Create `dockerfiles/dev_httpd/Dockerfile` (#80)

Issue: https://github.com/darthjee/navi/issues/80
Parent: https://github.com/darthjee/navi/issues/68
Depends on: #79

## Context

With the Express app files in place (#79), this issue creates the Dockerfile that packages
`dev/` into a Docker image to replace the Apache `httpd` container.

The new image follows the same base as the existing dev image (`darthjee/node:0.2.1`) but is
simpler — no multi-stage build needed since there are no pre-cached dependencies to optimise.

## Step 1 — Create `dockerfiles/dev_httpd/Dockerfile`

```dockerfile
FROM darthjee/node:0.2.1

COPY --chown=node:node ./dev/ /home/node/app/

USER node
WORKDIR /home/node/app

RUN yarn install

CMD ["node", "app.js"]
```

- `COPY ./dev/` brings in `app.js`, `package.json`, and `yarn.lock`.
- `yarn install` installs `express` and `js-yaml` inside the image.
- `data.yml` is **not** baked in — it will be mounted as a volume at runtime (#81).

## Acceptance Criteria

- [ ] `dockerfiles/dev_httpd/Dockerfile` exists.
- [ ] `docker build -f dockerfiles/dev_httpd/Dockerfile .` completes without errors.
- [ ] A container started from the built image serves the Express endpoints on port `80`.
