#80: Create `dockerfiles/dev_httpd/Dockerfile`

Parent issue: https://github.com/darthjee/navi/issues/68
Depends on: #79

## Background

With the Express app in place (X02), we need a Dockerfile to build it into a Docker image that will replace the Apache `httpd` container.

## Task

Create `dockerfiles/dev_httpd/Dockerfile` based on `darthjee/node:0.2.1`:

1. Copy `dev/` contents into the image working directory (`/home/node/app`).
2. Run `yarn install` to install dependencies.
3. Set the default command to `node app.js`.

## Acceptance Criteria

- [ ] `dockerfiles/dev_httpd/Dockerfile` exists.
- [ ] Running `docker build -f dockerfiles/dev_httpd/Dockerfile .` completes without errors.
- [ ] A container started from the built image serves the Express endpoints on port `80`.
