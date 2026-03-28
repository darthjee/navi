# Plan: Update `docker-compose.yml` to Use Express Container (#81)

Issue: https://github.com/darthjee/navi/issues/81
Parent: https://github.com/darthjee/navi/issues/68
Depends on: #80

## Context

With the Dockerfile ready (#80), `docker-compose.yml` must replace the static Apache `httpd`
service with the new Express build. The `navi_httpd` service name and `backend` alias are
preserved so `navi_proxy` requires no changes.

## Step 1 — Update `navi_httpd` in `docker-compose.yml`

```yaml
# Before
navi_httpd:
  image: httpd
  volumes:
    - ./dev:/usr/local/apache2/htdocs
  ports:
    - "0.0.0.0:3020:80"

# After
navi_httpd:
  build:
    context: .
    dockerfile: dockerfiles/dev_httpd/Dockerfile
  volumes:
    - ./dev/data.yml:/home/node/app/data.yml
  ports:
    - "0.0.0.0:3020:80"
```

Only `data.yml` is mounted as a volume so the data file can be edited and the container
restarted — without rebuilding the image.

## Acceptance Criteria

- [ ] `docker compose up navi_httpd` builds and starts the Express container without errors.
- [ ] `navi_proxy` continues to forward and cache requests correctly (`backend` alias unchanged).
- [ ] Editing `dev/data.yml` and running `docker compose restart navi_httpd` reflects new data
  without a rebuild.
