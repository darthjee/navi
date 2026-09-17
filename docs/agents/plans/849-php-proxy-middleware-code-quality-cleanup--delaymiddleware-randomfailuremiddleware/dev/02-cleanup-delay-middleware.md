# Clean up DelayMiddleware.php

Bring `dev/proxy/middlewares/DelayMiddleware.php` into compliance with the new ruleset, matching every finding from issue #849 without changing the delay-injection behavior:

- Rename `build(array $attributes)`'s parameter to `$_attributes` and add a PHPDoc block (`@param array $_attributes`, `@return self`)
- Add the expected 2 blank lines before `build()`, a `//end build()` closing comment, 1 blank line before its closing brace, and 2 blank lines after it
- Add PHPDoc blocks (`@param`, `@return`) to `processResponse()`, `envMs()`, `noDelay()`, and `delayMs()`
- Replace `if ($this->noDelay())` with an explicit `=== true` comparison
- Replace the ternary at `return ($value !== false && $value !== '') ? (int) $value : null;` with whatever non-inline form the new `phpcs.xml` actually requires there (verify against the ruleset from Step 1 rather than guessing the exact rewrite up front)
- Bracket the `??` operations in `delayMs()`: `$minMs = $this->envMs('MIN_RESPONSE_DELAY') ?? 0;` and `$maxMs = $this->envMs('MAX_RESPONSE_DELAY') ?? $minMs;`

## Files to Change
- `dev/proxy/middlewares/DelayMiddleware.php` — PHPDoc, spacing, closing comments, explicit comparisons, bracketing, `$_attributes` rename
