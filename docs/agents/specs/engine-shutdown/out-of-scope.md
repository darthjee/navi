# Out of scope

[Engine Graceful Shutdown](../engine-shutdown.md)

- **Flush mode** (keep allocating until every queue is empty, then exit). It changes the contract from "pending jobs are untouched" to "pending jobs are run", and a large backlog would easily exceed any reasonable timeout. It could be added later as an opt-in, e.g. `shutdown({ flush: true })`, in a separate issue.
- **`drain` / `drained` events.** `Engine` never self-emits today; hosts can emit around `await shutdown()`.
- **Switching Navi's `EngineController` to `shutdown()`.** Adoption belongs to consumers (darthjee/kerghan#479) or a separate Navi issue.
- **Cooperative cancellation of `Job.perform()`.** It would require a signature change.
