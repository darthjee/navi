# Plan: Crawler: verify and test extraction/emit interaction with paginated_actions

Issue: [705-crawler-verify-and-test-extraction-emit-interaction-with-paginated-actions.md](../../issues/705-crawler-verify-and-test-extraction-emit-interaction-with-paginated-actions.md)

## Overview

Verify that the crawler's extraction/emit path composes correctly with `paginated_actions`,
add end-to-end test coverage for the combination, and document the interaction. All work is
within `source/` plus the crawler design doc, so it is owned entirely by the `engine` specialist.

See [engine.md](engine.md) for the full plan.
