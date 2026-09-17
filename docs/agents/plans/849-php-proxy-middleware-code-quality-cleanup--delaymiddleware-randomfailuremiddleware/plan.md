# Plan: PHP proxy middleware code-quality cleanup (DelayMiddleware/RandomFailureMiddleware)

Issue: [849-php-proxy-middleware-code-quality-cleanup--delaymiddleware-randomfailuremiddleware.md](../../issues/849-php-proxy-middleware-code-quality-cleanup--delaymiddleware-randomfailuremiddleware.md)

## Overview
Add a PHPCS/PHPMD ruleset for the dev proxy's PHP code, then bring `DelayMiddleware.php` and `RandomFailureMiddleware.php` into compliance with it (PHPDoc blocks, spacing/closing-comment conventions, explicit boolean comparisons, bracketed `??` operations, and the intentionally-unused `build()` parameter).

See [dev.md](dev.md) for the full plan.
