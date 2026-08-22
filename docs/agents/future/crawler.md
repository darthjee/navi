# Feature: Information Crawling & Data Emission

This feature extends Navi beyond cache-warming, turning it into an information crawling tool: extracting structured data from HTTP responses via configurable parsers and emitting each extracted item to an external endpoint, in parallel with the existing chaining mechanism. **This design is incomplete** — see [Gaps](crawler/gaps.md) for open questions.

| Topic | Description |
|---|---|
| [Overview](crawler/overview.md) | What Navi is today, how the crawler extends it, the job pipeline diagram, and objectives. |
| [Scope](crawler/scope.md) | What's included in this feature vs. explicitly out of scope for now. |
| [Flows](crawler/flows.md) | Worked examples (Loot Studios JSON extraction, regex-standalone extraction) and how extraction interacts with existing chaining. |
| [Decisions](crawler/decisions.md) | Design decisions made so far and their rationale. |
| [Gaps](crawler/gaps.md) | Open questions and points left for future/incremental definition. |
| [Reference: Loot Studios Pattern](crawler/reference-loot-studios.md) | The real-world crawling pattern (approaches A/B/C) this feature is designed against. |
