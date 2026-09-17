# Add a phpcs.xml/phpmd.xml ruleset for dev/proxy

Create `dev/proxy/phpcs.xml` and `dev/proxy/phpmd.xml`, formalizing the conventions Codacy's PHPCS/PHPMD analysis is already checking against for this folder, since no such ruleset exists anywhere in the repo today. Base the ruleset on the specific findings listed in issue #849 (doc comments on every method, `//end <methodName>()` closing comments, blank-line spacing before/after methods, explicit `=== true`/`!== false` comparisons instead of implicit truthy checks, no inline `if`, bracketed `??` operations) plus the standard `UnusedFormalParameter` PHPMD rule — leave that rule active for now; Step 3 covers whether it needs an explicit override once the `$_attributes` rename is in place.

Keep the ruleset scoped to `dev/proxy/` (`<file>` / `<arg name="basepath">` pointing at that folder) since it's the only PHP code in the repo — do not touch `source/eslint.config.mjs` or any other JS tooling config.

## Files to Change
- `dev/proxy/phpcs.xml` — new PHPCS ruleset
- `dev/proxy/phpmd.xml` — new PHPMD ruleset
