# Docker Plan: Refactor Logs/Memory menu entries to be config-file driven

Main plan: [plan.md](plan.md)

## Shared contracts

Docker side of contract 2 (menu-file path) and contract 3 (stock file in the
image). The engine agent adds the `-m` / `--menu` option (default
`config/menu.yml`, `${VAR}`-interpolated) and ships `source/config/menu.yml` in
the npm package; this agent makes the **production image** ship its own copy and
pass the flag, exactly parallel to how `NAVI_CONFIG` / `web.yml` work today:

- today: `ENV NAVI_CONFIG=./config/web.yml`, `COPY … config/web.yml
  /home/node/app/config/web.yml`, `CMD navi-hey -c $NAVI_CONFIG`.
- add:  `ENV NAVI_MENU=./config/menu.yml`, `COPY … config/menu.yml
  /home/node/app/config/menu.yml`, `CMD navi-hey -c $NAVI_CONFIG -m $NAVI_MENU`.

> Note: SPEC-1's example uses `/navi/menu.yml`; this plan follows the repo's
> actual `./config/…` precedent for consistency with `NAVI_CONFIG`. Flag the
> deviation in the PR description.

## Implementation Steps

### Step 1 — Ship a stock `menu.yml` in the production image

Create `dockerfiles/production_navi_hey/config/menu.yml` with the default
entries:

```yaml
entries:
  - route: /logs
    text: Logs
  - route: /memory/status
    text: Memory
```

Add a `COPY` line in `dockerfiles/production_navi_hey/Dockerfile` next to the
existing `web.yml` copy:

```dockerfile
COPY dockerfiles/production_navi_hey/config/menu.yml /home/node/app/config/menu.yml
```

### Step 2 — Add `NAVI_MENU` and pass `-m` in `CMD`

In `dockerfiles/production_navi_hey/Dockerfile`:

- Add `ENV NAVI_MENU=./config/menu.yml` next to `ENV NAVI_CONFIG=./config/web.yml`.
- Change the final line to `CMD navi-hey -c $NAVI_CONFIG -m $NAVI_MENU`.

Operators override by mounting a file over `/home/node/app/config/menu.yml`
(Docker volume) or by relocating via `NAVI_MENU`.

## Files to Change

- `dockerfiles/production_navi_hey/config/menu.yml` — new stock file for the
  image.
- `dockerfiles/production_navi_hey/Dockerfile` — `ENV NAVI_MENU`, `COPY` the
  stock file, `-m $NAVI_MENU` in `CMD`.

## Notes

- No CI job builds this image on a PR (only on version tags), so there is no
  automated check — verify by reading the Dockerfile diff and, ideally, a local
  `docker build` of `dockerfiles/production_navi_hey/Dockerfile`.
- Keep changes minimal and strictly parallel to the existing `NAVI_CONFIG`
  lines; do not reorder or restyle the surrounding `ENV` block.
