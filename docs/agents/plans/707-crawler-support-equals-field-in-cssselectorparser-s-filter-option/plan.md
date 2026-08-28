# Plan: Crawler: support `equals_field` in CssSelectorParser's `filter` option

Issue: [707-crawler-support-equals-field-in-cssselectorparser-s-filter-option.md](../issues/707-crawler-support-equals-field-in-cssselectorparser-s-filter-option.md)

## Overview

Add a field-to-field comparator (`equals_field`) to `CssSelectorParser`'s `filter`
conditions from #700: the left operand stays inline on the condition, the right
operand is a nested `{ selector, attribute, trim }` resolver config, both resolved
relative to the same matched container and compared with `===`. Purely additive —
literal `equals` conditions are untouched. Includes a one-time `Logger.warn` when a
single condition carries both `equals` and `equals_field`, and a small refactor
hoisting `new FilterMatcher(filter)` to one construction per `extract()`.

All work is within `source/lib/parsers/` and owned by the `engine` specialist.

See [engine.md](engine.md) for the full plan.
