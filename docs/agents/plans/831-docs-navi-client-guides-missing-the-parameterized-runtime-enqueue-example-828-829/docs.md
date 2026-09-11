# docs Plan: Docs: navi-client guides missing the parameterized runtime-enqueue example (#828/#829)

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add parameters example to library-usage.md and clients/node/README.md](docs/01-add-parameters-example-to-library-usage.md)
- [02 — Add parameters example to cli-usage.md](docs/02-add-parameters-example-to-cli-usage.md)
- [03 — Add a new parameterized-enqueue sample](docs/03-add-parameterized-enqueue-sample.md)

## Notes

- Purely additive: keep every existing bare-string `resources` example as-is: this
  is a "here's a new capability" addition, not a rewrite. Callers who don't use
  `parameters` see byte-identical behavior.
- `docs/guides/how_to_use_navi.md` and `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` are
  out of scope — confirmed during issue triage to be high-level indexes that defer
  request/response detail to the pages this plan touches and to `reference.md`
  (already updated by #829).
- No CI job lints Markdown content in this repo (`checks-client`'s `lint-and-report`
  is ESLint over `clients/node`'s JS, not `README.md`), so there is no CI Checks
  section — verification is a manual read-through plus the existing style each
  guide already uses.
