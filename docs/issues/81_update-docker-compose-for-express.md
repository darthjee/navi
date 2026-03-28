# 81: Update `docker-compose.yml` to Use Express Container

Parent issue: https://github.com/darthjee/navi/issues/68
Depends on: #80

## Background

With the Dockerfile ready (X03), `docker-compose.yml` must be updated to replace the static Apache `httpd` service with the new Express build.

## Task

Replace the `navi_httpd` service definition in `docker-compose.yml`:

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

Only `data.yml` is mounted as a volume so the data can be updated without rebuilding the image.

## Acceptance Criteria

- [ ] `docker compose up navi_httpd` builds and starts the Express container without errors.
- [ ] `navi_proxy` continues to forward requests to `navi_httpd` (`backend` alias unchanged).
- [ ] Changing `dev/data.yml` and running `docker compose restart navi_httpd` reflects new data without rebuilding.
