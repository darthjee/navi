# Remove Duplications from Specs

## Description

There is significant duplication across our Jasmine specs under `source/spec/`. Many test files repeat object creation, setup logic, and sample data, which increases maintenance cost and makes it harder to update tests consistently.

This issue proposes to:

- Identify and extract common setup logic and test data into reusable factory functions (e.g., `factories/` directory).
- Replace repeated inline object creation with calls to these factories.
- Ensure all specs use the new factories for creating model instances, registry objects, and other test fixtures.
- Update documentation and code comments to reflect the new approach.

**Acceptance Criteria:**

- All duplicated setup and data in specs are replaced by factories or shared helpers.
- Factories are well-documented and easy to extend for future tests.
- No loss of test coverage or scenario diversity.
- Code style and linting rules are followed.

This refactor will improve test maintainability, readability, and consistency across the codebase.