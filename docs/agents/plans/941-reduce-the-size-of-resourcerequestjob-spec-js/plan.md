# Plan: Reduce the size of ResourceRequestJob_spec.js

Issue: [941-reduce-the-size-of-resourcerequestjob-spec-js.md](../../issues/941-reduce-the-size-of-resourcerequestjob-spec-js.md)

## Overview
Bring `source/spec/lib/jobs/ResourceRequestJob_spec.js` (313 lines) under the 300-line spec size limit without losing coverage. Shared setup moves into a new `ResourceRequestJobSpecUtils` support util, and the `#perform` hook/namespace contexts move into a sibling `ResourceRequestJobEnqueue_spec.js`. This follows the pattern used for #935–#940.

See [engine.md](engine.md) for the full plan.
