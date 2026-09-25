# Plan: Reduce the size of Client_spec.js

Issue: [937-reduce-the-size-of-client-spec-js.md](../../issues/937-reduce-the-size-of-client-spec-js.md)

## Overview
Split the 398-line `source/spec/lib/client/Client_spec.js` into three spec files (request behavior, `#emit`, and the `.fromObject`/`.fromListObject` builders), each under 300 lines, without losing any assertion. The work is entirely inside `source/spec/`, so the `engine` agent owns it.

See [engine.md](engine.md) for the full plan.
