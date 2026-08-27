# Plan: Fix broken import

Issue: [721-fix-broken-import.md](../issues/721-fix-broken-import.md)

## Overview
The `navi_dev_app` container's test suite crashes on a missing module because `source/lib/common/utils/parser/HtmlRootParser.js` (mounted into the dev app as shared "common" code) imports `InvalidHtmlResponseBody` from outside `lib/common`. The fix moves `InvalidHtmlResponseBody` and its base class `AppError` into `source/lib/common/exceptions/`, and repoints every other importer — all within `source/`.

See [engine.md](engine.md) for the full plan.
