# Stock `config/menu.yml` + packaging

Ship a stock menu file whose defaults reproduce today's menu, and make it part of
the published npm package so `navi-hey` has a default on disk (the in-code
fallback constant from step 02 still covers a deleted/blank file).

## Stock file

`source/config/menu.yml`:

```yaml
entries:
  - route: /logs
    text: Logs
  - route: /memory/status
    text: Memory
```

## Packaging

`source/package.json` — add `"config"` to the `"files"` array
(currently `["bin", "lib", "static"]`) so `config/menu.yml` is included in the
npm tarball. Confirm nothing else under `source/config/` would be unintentionally
published (today there is no `source/config/` dir; this creates it with only
`menu.yml`).

The production Docker image's own copy of the file is handled by the docker
agent ([docker.md](../docker.md)) — this step is package-only.

## Files to Change

- `source/config/menu.yml` — new stock file.
- `source/package.json` — add `"config"` to `"files"`.
