# Reconcile `NAVI_MENU` path in `extending-navi.md`

`docs/guides/navi/extending-navi.md` claims the production image defaults
`NAVI_MENU` to `/navi/menu.yml`. It does not — the image ships
`ENV NAVI_MENU=./config/menu.yml` (resolved against WORKDIR `/home/node/app`).
Every mount/COPY that targets `/navi/menu.yml` is therefore wrong.

## What to do

Edit these locations (line numbers approximate — match on content):

- **~line 21** — "Enabling extensions" env table row for `NAVI_MENU`: drop the
  "the production image defaults it to `/navi/menu.yml`" clause. New text:
  "Path to the menu file (`-m` / `--menu`). Defaults to `./config/menu.yml`
  (resolved against the image WORKDIR `/home/node/app`). Mount your own menu file
  there to control menu position or labels."
- **~lines 32 & 35** — "Enabling extensions" compose sample: change the comment
  to `# NAVI_MENU defaults to ./config/menu.yml` and the volume line to
  `- ./config/menu.yml:/home/node/app/config/menu.yml:ro`.
- **~line 191** — "A menu entry" YAML comment: `# config/menu.yml — mounted over
  /home/node/app/config/menu.yml, NOT inside /navi/extensions`.
- **~line 271** — "Worked example" `docker-compose.yml`: volume line to
  `- ./config/menu.yml:/home/node/app/config/menu.yml:ro`.
- **~line 293** — "Baking into a derived image": `COPY config/menu.yml
  /home/node/app/config/menu.yml`.

Also make the worked-example compose snippet here match `docker`'s real
`navi_extensions_app` shape (image/dist mount) as far as a user-facing bind-mount
example sensibly can — the `./dist:/navi/extensions:ro` +
`./config/menu.yml:/home/node/app/config/menu.yml:ro` pair, `NAVI_EXTENSIONS_ENABLED: "true"`.

## Files to Change

- `docs/guides/navi/extending-navi.md` — the five locations above.
