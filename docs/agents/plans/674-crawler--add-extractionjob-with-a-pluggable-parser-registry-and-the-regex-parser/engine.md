# engine Plan: Crawler: add ExtractionJob with a pluggable parser registry and the regex parser

Main plan: [plan.md](plan.md)

## Shared contracts

Owns and exports the new job class `ExtractionJob` (`source/lib/jobs/ExtractionJob.js`), registered under the factory name `'Extraction'`. `frontend` depends on this exact class name for its own one-line change (see [plan.md](plan.md)).

## Steps

- [01 — Add parser exceptions](engine/01-add-parser-exceptions.md)
- [02 — Add RegexParser and ParserRegistry](engine/02-add-regex-parser-and-registry.md)
- [03 — Add ExtractionJob](engine/03-add-extraction-job.md)
- [04 — Wire ExtractionJob into the request pipeline](engine/04-wire-extraction-job.md)
- [05 — Specs](engine/05-specs.md)

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- `parser` config is already parsed and validated for `type` only (`ResourceRequestParser`, `source/lib/models/request/ResourceRequestParser.js`) — `match`/`field` are stored unvalidated in `.attributes` and must be validated by the `regex` parser itself (per issue discussion).
- Only `regex` is registered in this sub-issue. `json_path` (a separate sub-issue) will register into the same `ParserRegistry` without touching `ExtractionJob`.
- Emission (`EmitJob`) is explicitly out of scope — `ExtractionJob`'s only observable side effect here is logging the extracted items via the job's `logContext` (the same mechanism `HtmlParseJob`/`ActionProcessingJob` already use), per issue discussion.
- `ExtractionJob` has no retry rights (`maxRetries` returns `1`), matching `ActionProcessingJob`/`HtmlParseJob`.
