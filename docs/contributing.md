# Contributing

## Commit Guidelines

- Always make commits unitary and atomic: each commit should represent a single logical change.
- Do not mix unrelated changes in the same commit.
- Whenever possible, separate refactoring commits from new feature commits.

## Pull Requests

- Every PR must include a clear and descriptive summary of its purpose and changes.
- If a description cannot be provided directly in the PR, generate a file with the PR description, but do not commit it.

## Definition of Done for PRs

A PR is considered complete when:

- The stated objective has been achieved.
- All tests are passing.
- Linting passes without errors.
- Code coverage is as high as reasonably possible.
- Code is not overly complex:
  - Classes and methods should have clear, focused responsibilities.
  - If a class or method is taking on too many responsibilities, refactor to simplify.
  - This requirement applies primarily to source code. For specs, refactor only if there is excessive duplication.

## Refactoring Guidelines

When refactoring, aim to:

- Reduce code duplication.
- Minimize and clarify responsibilities for each class and method.
- Clearly define what is injected, inherited, or composed in each component.