# navi-release-scripts

Private package (never published) holding two checks built on the root
[`release.yml`](../../release.yml), the release dependency tree read by the
release scripts:

- the `release.yml` validator;
- the cascade-bump check.

## release.yml validator

### What it checks

For each entry of `release.yml`:

1. Its `folder` holds a `package.json`; for an `npm` entry, the key equals that
   `package.json`'s `name`.
2. For an `npm` entry, `depends_on` matches the local packages (the `npm` keys
   of `release.yml`) declared in `dependencies` or `peerDependencies`, both
   ways. `devDependencies` are ignored, and the version specifier does not
   matter.
3. A `docker` entry depends on exactly the `npm` package living in the same
   folder.

Every problem is reported, then the script exits 1. When everything matches it
prints `release.yml OK (<n> packages)` and exits 0.

### Usage

From the repository root:

```bash
scripts/ci.sh validate-release-yml
```

Or directly:

```bash
cd scripts/release
yarn install
node bin/validate-release-yml.js ../..
```

## Cascade-bump check

### Rule

For every `npm` entry of `release.yml` whose `package.json` `version` differs
between a base ref and `HEAD`, every package depending on it, directly or
transitively through `depends_on`, must also have a different `version`.
Otherwise each missing bump is reported, e.g.:

```text
navi-hey-client must be bumped because deku-sprout changed 0.3.0 -> 0.4.0
```

- `docker` entries are not checked on their own: their version is the
  `package.json` version of their folder, so they follow their `npm` package.
- A package with no `package.json` at the base ref counts as not bumped.
- Only the version bump is checked, not whether a dependent's declared range
  accepts the new version.

### Base ref

Resolved from CircleCI's environment:

| Context | Base ref |
|---------|----------|
| `X.Y.Z` tag (`CIRCLE_TAG`) | the previous `X.Y.Z` tag reachable from `HEAD^` |
| `main` (`CIRCLE_BRANCH=main`) | `HEAD^` |
| any other branch, or outside CI | `git merge-base HEAD origin/main` |

When no base can be found (e.g. no previous `X.Y.Z` tag), the check passes with
`No comparison base found — skipping cascade-bump check`.

### Usage

From the repository root (fetches `origin/main` and tags first, best-effort):

```bash
scripts/ci.sh cascade-bump-check
```

Or directly, with an optional explicit base ref overriding the resolution:

```bash
cd scripts/release
yarn install
node bin/check-cascade-bumps.js ../.. [baseRef]
```

## Development

```bash
cd scripts/release
yarn install
npm test        # jasmine specs with coverage
npm run lint
```

The specs include one run against the real repository root, so a drift between
`release.yml` and the `package.json` files also fails the spec job.
