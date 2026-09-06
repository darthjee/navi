# Docs Plan: engine: json_path parser supports a root-level array

Main plan: [plan.md](plan.md)

## Shared contracts

Document exactly the `json_path` root-array convention from `plan.md`:

- `type: json_path` with `match` omitted / `''` / `'.'` → the whole parsed response body is the array
  of items; no path navigation.
- `fields` stays required; `filter` and field mapping behave as for a nested path.
- Non-array body in that case → the same "did not resolve to an array" error as a bad nested path.
- `regex` and `css` still require `match` — only `json_path` relaxes it.

Wait for `engine` to confirm the shipped marker spelling (`match` omitted is canonical, `'.'` an
alias) before finalising wording.

## Implementation Steps

### Step 1 — README: `parser.match` row and the `json_path` description

- `README.md`, "Configuration File Fields" table — the `parser.match` row currently ends
  "Required for all three." Change it so it still says the pattern/selector is required for `regex`
  and `css`, but notes that `json_path` may **omit `match`** (or set `match: '.'`) to extract from a
  response body that is itself a top-level JSON array.
- `README.md`, "Data Extraction and Emission" section — the `json_path` bullet ("navigates to an
  array within the parsed JSON body…") gains a clause that the array may be the body's root (omit
  `match`). Optionally add a one-line note under the `json_path` example showing the `match`-less form.
- Keep the existing nested-path example and all other rows unchanged.

### Step 2 — `docs/guides/navi/` consistency check

- There is currently **no `parser` guide** under `docs/guides/navi/`. The only related pages are
  `emit-configuration.md` and `samples/emit-extracted-items.md`, which document `emit` alone and
  predate the `parser`-block requirement (they still claim Navi "parses the body as JSON and runs
  `emit` once per item" with no `parser`). That mismatch is **pre-existing and out of scope for
  #778** — do not rewrite those pages here.
- In scope: if touching either page for the root-array note, ensure any `json_path` snippet added
  uses the `match`-omitted form and cross-references the README fields table. If no `parser` content
  is added to the guides in this issue, this step is a no-op and README (Step 1) is the whole change.

## Notes

- The substantive change is README; the guide docs have no `parser` reference to update.
- Pre-existing discrepancy (guides showing `emit` without a required `parser` block) is worth its own
  docs issue — flag it, don't fix it here.
- Do not touch `source/` — engine owns the parser and its specs.
