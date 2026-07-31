# Commits and Pull Requests

## Commit Guidelines

- **Atomic and Unitary:** Each commit must represent a single logical change.  
  *Example:*  
  - Good: `Add needsParams() method to ResourceRequest`  
  - Bad: `Add needsParams() and refactor Registry logic`
- **No Unrelated Changes:** Do not mix unrelated changes in the same commit.
- **Separate Refactoring:** Whenever possible, separate refactoring commits from new feature or bugfix commits.

## Pull Requests

- **Descriptive Summary:** Every PR must include a clear and descriptive summary of its purpose and changes.
- **PR Description Files:** If a description cannot be provided directly in the PR, generate a file with the PR description (e.g., `docs/issues/<pr_number>_description.md`), but do not commit this file.

### PR Description Template

Every PR description must follow this structure:

```markdown
## Issue

Brief description of the problem or requirement this PR addresses.
Reference the GitHub issue number if applicable (e.g., "Fixes #123").

## Solution

Brief description of the approach taken to solve the issue.
Focus on *what* was done and *why* this approach was chosen.

## Details

Any additional information that helps reviewers understand the changes:
- Notable implementation decisions
- Trade-offs considered
- Areas that may need extra attention
- Testing notes or edge cases covered

Omit this section if there is nothing relevant to add.
```

## Definition of Done for PRs

A PR is considered complete when:

- The stated objective has been achieved.
- All tests are passing.
- Linting passes without errors.
- Code coverage is as high as reasonably possible.
- Code is not overly complex:
  - Classes and methods should have clear, focused responsibilities.
  - If a class or method is taking on too many responsibilities, refactor to simplify.
  - Methods should be small and do exactly one thing. If a method is growing, extract parts into private helper methods or separate classes.
  - *Example (pseudo-code):*
    ```js
    // Good: Each method does one thing
    class Worker {
      fetchJob() { ... }
      processJob(job) { ... }
    }

    // Bad: Method does too much
    class Worker {
      run() {
        this.fetchJob();
        this.processJob();
        this.sendMetrics();
        this.cleanup();
      }
    }
    ```
  - This requirement applies primarily to source code. For specs, refactor only if there is excessive duplication.

### CI Checks

Before a PR is considered complete, all CI checks relevant to the modified parts of the project must pass locally. Run only the checks that correspond to the folders you changed:

| Modified folder | CircleCI jobs | Local commands to run |
|-----------------|---------------|-----------------------|
| `source/` | `jasmine`, `checks` | `cd source && yarn coverage && yarn lint && yarn report` |
| `dev/app/` | `jasmine-dev`, `checks-dev` | `cd dev/app && yarn coverage && yarn lint && yarn report` |
| `dev/frontend/` | `jasmine-dev-frontend`, `checks-dev-frontend` | `cd dev/frontend && yarn coverage && yarn lint && yarn report` |
| `frontend/` | `jasmine-frontend`, `checks-frontend` | `cd frontend && yarn coverage && yarn lint && yarn report` |

> **Note:** After making changes to the `frontend/` code, run `yarn build` inside the frontend container (or the `navi_frontend` Docker Compose service) to rebuild the production assets and update `source/static/`. Navi serves the built frontend directly from `source/static/`, so the bundled assets must be kept up to date whenever the frontend changes.

If a new container or application folder is added in the future, its corresponding test and check jobs must be run before merging any changes to that folder.
