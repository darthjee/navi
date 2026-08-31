# Plan: Refactor ResourceRequestEmit

Issue: [749-refactor-resourcerequestemit.md](../../issues/749-refactor-resourcerequestemit.md)

## Overview

Extract `ResourceRequestEmit`'s URL-token resolution and body-template rendering pipeline into four dedicated, stateless static-method classes in `source/lib/models/request/`, and deduplicate the URL-resolution logic currently copy-pasted into `ResourceRequest.js`. Pure refactor — no observable behavior change.

See [engine.md](engine.md) for the full plan.
