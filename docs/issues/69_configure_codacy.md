# Issue 69: Configure Codacy to Ignore Unwanted Files

https://github.com/darthjee/navi/issues/69

## Background

Codacy is currently analyzing files and folders that should not be included in code quality checks, such as the `docs/` directory. This results in unnecessary warnings and noise in the analysis reports, making it harder to focus on relevant issues in the source code.

## Proposal

Add a Codacy configuration file (`.codacy.yaml`) to the project root to explicitly ignore files and directories that are not part of the source code, such as documentation and other non-code assets.

### Steps

1. Create a `.codacy.yaml` file in the root of the repository.
2. Add ignore patterns for the following (and any other non-source directories as needed):
    - `docs/**`
    - Any other folders or files that should not be analyzed by Codacy.
3. Commit and push the configuration file to the repository.
4. Verify that Codacy no longer analyzes the ignored files in subsequent runs.

### Example `.codacy.yaml`

```yaml
ignore:
  - docs/**