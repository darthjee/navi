# Dev Plan: PHP proxy middleware code-quality cleanup (DelayMiddleware/RandomFailureMiddleware)

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add a phpcs.xml/phpmd.xml ruleset for dev/proxy](dev/01-add-ruleset-config.md)
- [02 — Clean up DelayMiddleware.php](dev/02-cleanup-delay-middleware.md)
- [03 — Clean up RandomFailureMiddleware.php](dev/03-cleanup-random-failure-middleware.md)

## Files to Change
- `dev/proxy/phpcs.xml` — new ruleset formalizing the PSR/Squiz-style conventions Codacy already checks (doc comments, spacing, explicit boolean comparisons, no inline `if`, bracketed operations)
- `dev/proxy/phpmd.xml` — new ruleset covering the `UnusedFormalParameter` rule, exempting/renaming-aware for the `build()` parameter if the plain rename in Step 3 below doesn't already satisfy it
- `dev/proxy/middlewares/DelayMiddleware.php` — PHPDoc, spacing, comparisons, bracketing, `$_attributes` rename
- `dev/proxy/middlewares/RandomFailureMiddleware.php` — PHPDoc, spacing, comparisons, `$_attributes` rename

## Notes
- There is no existing phpcs.xml/phpmd.xml or PHP style convention anywhere else in the repo (these two files are the only PHP classes with method bodies), and no CI job runs PHP linting locally (`.circleci/config.yml`'s `checks-dev`/`jasmine-dev` jobs target `dev/app`, not `dev/proxy`) — Codacy's findings come from its own external default analysis, so there's no existing ruleset to copy from and no automated way to verify sniff-by-sniff compliance before pushing.
- Verify locally using the `darthjee/tent-test` image referenced in `docs/agents/external/tent/extending-tent.md`: mount `dev/proxy/` and run `vendor/bin/phpcs --standard=phpcs.xml dev/proxy/middlewares` and `vendor/bin/phpmd dev/proxy/middlewares text phpmd.xml` (adjust paths/flags as needed once the tool's actual CLI is in hand) before considering the cleanup done — there's no CI job to catch mistakes here.
- Per the discuss-issue dialogue: rename `$attributes` to `$_attributes` on both `build()` methods (required by the abstract `Tent\Middlewares\Middleware::build(array $attributes)` signature, so it can't be removed). If PHPMD's `UnusedFormalParameter` rule still flags the renamed parameter, add an explicit exemption to `phpmd.xml` (e.g. an `unusedcode` ruleset override or exclude-pattern) rather than reaching for a `@SuppressWarnings` doc-comment annotation.
- No `## CI Checks` section: no CircleCI job currently covers `dev/proxy`, so there is no local command tied to an existing CI job to list here.
