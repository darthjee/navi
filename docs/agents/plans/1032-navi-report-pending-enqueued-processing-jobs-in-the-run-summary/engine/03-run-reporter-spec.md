# RunReporter regression spec

`RunReporter` production code needs no change: it already builds one `LifetimeJobStats.fromStats(JobRegistry.stats())` and passes it to both consumers. Add a spec case where the registry has jobs left in `enqueued` (and/or `processing`), e.g. by stubbing `JobRegistry.stats()` the same way the existing spec does. Assert that:

- the logged summary contains `Pending: N`, with `N = enqueued + processing`;
- the failure check is unaffected: pending jobs never make `FailureChecker` exit.

Also make sure any existing `JobRegistry.stats()` stubs in this spec include `enqueued`/`processing`. Otherwise `pending` becomes `NaN` and the `> 0` check silently hides the line.

## Files to Change

- `source/spec/lib/services/execution/RunReporter_spec.js` — new case(s); add `enqueued`/`processing` to stats fixtures where missing.
