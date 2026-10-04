# Remove the standalone deku-sprout workflow and ignore marker tags
In `.circleci/config.yml`:

1. Remove the two `test-and-release` workflow entries for the standalone track: `check-deku-sprout-version-tag` (which defines the `&deku-sprout-tag-filters` anchor) and `publish-deku-sprout-standalone` (which uses `*deku-sprout-tag-filters`). No other entry refers to that anchor.
2. Remove the matching job definitions under `jobs:`: `check-deku-sprout-version-tag` (runs `bash scripts/check_deku_sprout_tag_version.sh`) and `publish-deku-sprout-standalone` (runs `SKIP_BUMP_CHECK=true scripts/ci.sh check-and-publish-deku-sprout`).
3. Extend the `&all-tags` anchor (on the first `jasmine` entry) so CI-pushed marker tags start no pipeline:

   ```yaml
   filters: &all-tags
     tags:
       only: /.*/
       ignore: /^(deku-sprout|worker)-.*/
   ```

   Leave the `&version-tag-filters` (`/\d+\.\d+\.\d+/`) and `&client-tag-filters` (`/client-\d+\.\d+\.\d+/`) anchors unchanged. CircleCI filter regexes must match the whole tag, so they already skip marker tags. The `worker-1.11.3` pipeline (#29601–#29611) confirms it: only all-tags jobs ran, and no publish jobs.

Keep `check-and-publish-deku-sprout` (under `X.Y.Z` tags) as is: it is now the only publisher of `deku-sprout`.

Validate with `circleci config validate .circleci/config.yml`. Optionally, run `circleci config process .circleci/config.yml` and confirm that no job remains whose filters would match a `deku-sprout-*` or `worker-*` tag.

## Files to Change
- `.circleci/config.yml` — remove the 2 workflow entries, the 2 job definitions and the `deku-sprout-tag-filters` anchor. Add the marker-tag `ignore` to `&all-tags`.
