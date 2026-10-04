# Delete the tag-check script
`scripts/check_deku_sprout_tag_version.sh` checked a pushed `deku-sprout-X.Y.Z` tag against `logger/package.json`. Its only caller was the `check-deku-sprout-version-tag` job removed in step 01. Delete it.

Before deleting, confirm there are no other references (excluding `docs/agents/issues/` and `docs/agents/plans/`, which are history):

```bash
grep -rn "check_deku_sprout_tag_version" --exclude-dir=node_modules . | grep -v "docs/agents/issues\|docs/agents/plans"
```

The only remaining hit should be the `docs/agents/logger.md` row that step 03 removes.

## Files to Change
- `scripts/check_deku_sprout_tag_version.sh` — delete.
