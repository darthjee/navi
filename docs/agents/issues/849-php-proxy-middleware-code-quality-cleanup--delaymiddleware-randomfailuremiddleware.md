# Issue: PHP proxy middleware code-quality cleanup (DelayMiddleware/RandomFailureMiddleware)

## Description
Codacy's PHPCS/PHPMD analysis flags a cluster of small code-quality findings concentrated in two dev-proxy middleware classes: `dev/proxy/middlewares/DelayMiddleware.php` and `dev/proxy/middlewares/RandomFailureMiddleware.php`. None are individually severe, but together they make these two small files disproportionately noisy in the Codacy report.

## Problem
**`dev/proxy/middlewares/DelayMiddleware.php`**
- `:10` — unused parameter `$attributes` in `build()` (PHPMD `UnusedFormalParameter`) — required by the abstract `Tent\Middlewares\Middleware::build(array $attributes)` signature, so it can't simply be dropped
- `:10` — missing doc comment for `build()`
- `:10` — expected 2 blank lines before function; 0 found
- `:13` — expected `//end build()` closing comment
- `:13` — expected 1 blank line before closing function brace; 0 found
- `:13` — expected 2 blank lines after function; 1 found
- `:15` — missing doc comment for `processResponse()`
- `:17` — implicit `true` comparison prohibited; use `=== TRUE`
- `:26` — missing doc comment for `envMs()`
- `:30` — inline `if` statements not allowed
- `:33` — missing doc comment for `noDelay()`
- `:39` — missing doc comment for `delayMs()`
- `:41`, `:42` — operation must be bracketed

**`dev/proxy/middlewares/RandomFailureMiddleware.php`**
- `:11` — unused parameter `$attributes` in `build()` (PHPMD `UnusedFormalParameter`) — same abstract-signature constraint as above
- `:11` — missing doc comment for `build()`
- `:11` — expected 2 blank lines before function; 0 found
- `:14` — expected `//end build()` closing comment
- `:14` — expected 1 blank line before closing function brace; 0 found
- `:14` — expected 2 blank lines after function; 1 found
- `:16` — missing doc comment for `processRequest()`
- `:18` — implicit `true` comparison prohibited; use `=== TRUE`

There is no existing PHPCS/PHPMD ruleset or PHP style convention checked into this repo (Tent's own `phpcs.xml`/`phpmd.xml` aren't bundled — see `docs/agents/external/tent/extending-tent.md`), and no CI workflow runs PHP linting locally; these findings come solely from Codacy's own default analysis of the two files above, which are also the only PHP classes with method bodies in the repo.

## Expected Behavior
Codacy reports no PHPCS/PHPMD findings for `DelayMiddleware.php` and `RandomFailureMiddleware.php`, with no change to either middleware's runtime behavior (delay/failure-injection logic for the dev proxy stays identical).

## Solution
- Add a `phpcs.xml`/`phpmd.xml` ruleset to the repo, formalizing the PSR/Squiz-style conventions Codacy is already checking against, so the style is documented and future PHP files inherit the same rules
- Cleanup pass over both middleware files:
  - Add PHPDoc blocks (`@param`, `@return`) to every method, including `build()`
  - Add `//end <methodName>()` closing comments and the expected blank-line spacing around each method
  - Replace implicit truthy checks (`if ($this->noDelay())`, the `?:` elvis check in `RandomFailureMiddleware`) with explicit `=== true`/`!== false` comparisons
  - Bracket the null-coalescing (`??`) operations flagged in `DelayMiddleware::delayMs()`
  - Rename the unused `build(array $attributes)` parameter to `$_attributes` on both classes, signaling it's intentionally unused since it's required by the abstract `Middleware::build(array $attributes)` signature — note PHPMD's `UnusedFormalParameter` rule may still flag an underscore-prefixed parameter unless the new ruleset explicitly exempts/renames it; if it does, add that exemption to the new ruleset rather than reaching for a `@SuppressWarnings` annotation

## Benefits
- Removes recurring noise from the Codacy report for these two files
- Establishes a documented, consistent PHPCS/PHPMD ruleset and PHPDoc/formatting baseline that future dev-proxy middleware classes follow automatically
