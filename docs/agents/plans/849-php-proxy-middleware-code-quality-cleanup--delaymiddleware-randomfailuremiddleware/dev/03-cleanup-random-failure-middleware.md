# Clean up RandomFailureMiddleware.php

Bring `dev/proxy/middlewares/RandomFailureMiddleware.php` into compliance with the new ruleset, matching every finding from issue #849 without changing the failure-injection behavior:

- Rename `build(array $attributes)`'s parameter to `$_attributes` and add a PHPDoc block (`@param array $_attributes`, `@return self`)
- Add the expected 2 blank lines before `build()`, a `//end build()` closing comment, 1 blank line before its closing brace, and 2 blank lines after it
- Add a PHPDoc block (`@param`, `@return`) to `processRequest()`
- Replace the `?:` elvis check at `$rate = (float) (getenv('FAILURE_RATE') ?: 0);` with an explicit, non-implicit comparison per the new ruleset

After both middleware files are cleaned up, run `vendor/bin/phpcs --standard=phpcs.xml` and `vendor/bin/phpmd ... phpmd.xml` (via the `darthjee/tent-test` image, per `dev.md`'s Notes) against `dev/proxy/middlewares/` and confirm the `UnusedFormalParameter` finding on both `build()` methods is actually resolved by the `$_attributes` rename — if not, add the exemption to `dev/proxy/phpmd.xml` from Step 1 instead of adding a `@SuppressWarnings` annotation.

## Files to Change
- `dev/proxy/middlewares/RandomFailureMiddleware.php` — PHPDoc, spacing, closing comments, explicit comparison, `$_attributes` rename
- `dev/proxy/phpmd.xml` — only if verification shows the rename alone doesn't satisfy `UnusedFormalParameter`
