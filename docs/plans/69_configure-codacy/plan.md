# Plan: Configure Codacy to Ignore Unwanted Files (#69)

Issue: https://github.com/darthjee/navi/issues/69

## Context

Codacy is analyzing non-source directories (e.g. `docs/`) and generating noise in quality reports.
A `.codacy.yaml` file at the project root tells Codacy which paths to exclude from analysis.

## Step 1 — Create `.codacy.yaml`

Create the file at the repository root with ignore patterns for all non-source directories:

```yaml
ignore:
  - docs/**
  - dev/**
  - docker_volumes/**
  - dockerfiles/**
```

- `docs/**` — documentation and issue/plan files
- `dev/**` — Express dev server (not application source)
- `docker_volumes/**` — runtime config and cache volumes
- `dockerfiles/**` — Docker build definitions, not analyzed code

`source/` is the only directory that should be analyzed.

## Step 2 — Commit and push

Commit the file on its own PR so the change is easy to verify in the Codacy dashboard.

## Acceptance Criteria

- [ ] `.codacy.yaml` exists at the project root
- [ ] Codacy no longer reports issues for `docs/`, `dev/`, `docker_volumes/`, or `dockerfiles/`
- [ ] `source/` continues to be analyzed normally
