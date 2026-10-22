# Rework the tag filters

Replace the `all-tags` anchor on the first workflow job (`jasmine`) with a filter that runs on all branches and only on `X.Y.Z` tags:

```yaml
filters: &test-filters
  tags:
    only: /^\d+\.\d+\.\d+$/
```

With no `branches` key, every branch runs. Update every `filters: *all-tags` reference in the workflow to the new anchor, which covers all the test/check jobs, `cascade-bump-check`, `smoke-extensions`, `test-extension-harness` and `coverage-final`. Drop the `ignore: /^(deku-sprout|worker)-.*/` line.

Anchor `version-tag-filters` the same way (`/^\d+\.\d+\.\d+$/`) and keep `branches: ignore: /.*/`, so release jobs never run on branches. Every other tag (`client-`, `worker-`, `deku-sprout-`, `sprout-`, `swarm-`, `node_client-`) now matches neither filter, so it triggers nothing.

## Files to Change
- `.circleci/config.yml` — new test-filter anchor, all references to it updated, and `version-tag-filters` anchored.
