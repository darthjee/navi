# navi-release-scripts

Private package (never published) holding the validator for the root
[`release.yml`](../../release.yml), the release dependency tree read by the
release scripts.

## What it checks

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

## Usage

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

## Development

```bash
cd scripts/release
yarn install
npm test        # jasmine specs with coverage
npm run lint
```

The specs include one run against the real repository root, so a drift between
`release.yml` and the `package.json` files also fails the spec job.
