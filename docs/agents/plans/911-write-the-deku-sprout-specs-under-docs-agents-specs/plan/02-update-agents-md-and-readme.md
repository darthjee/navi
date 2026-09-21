# Update `AGENTS.md` and the `README.md` link
Point every reference of the dropped `future/` folder to `specs/`.

In `AGENTS.md`:
- Replace the `Future` row of the documentation table (`| [Future](docs/agents/future/) | Speculative or not-yet-implemented feature designs. |`) with a `Specs` row for `docs/agents/specs/`: specs of not-yet-implemented work, kept as a guideline while it is being developed.
- Replace the `### Future (docs/agents/future/)` section with a `### Specs (docs/agents/specs/)` section: one file per topic (`docs/agents/specs/<topic>.md`), split into a hub + subfolder when it grows (point to `docs/agents/specs/crawler.md` and `docs/agents/specs/crawler/` as the example, the same pattern as `architecture.md`, `flow.md` and `contributing.md`), and the spec is removed once the feature is implemented and documented in its permanent place.

In `README.md` (line 472): change the link to `docs/agents/future/crawler/flows.md` (relative text and the absolute `https://github.com/darthjee/navi/blob/main/...` URL) to `docs/agents/specs/crawler/flows.md`.

Then run a repository-wide search for `agents/future` and `future/crawler` (excluding `node_modules`) and fix any other reference found. Historical issue and plan files under `docs/agents/issues/` and `docs/agents/plans/` that only mention it in prose may be left as they are.

## Files to Change
- `AGENTS.md` — table row and the "Future" section become "Specs"
- `README.md` — the `crawler/flows.md` link
