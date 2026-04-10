# Issue: Refactor JobRegistry to Singleton Pattern with Static Delegation

## Description

Currently, `JobRegistry` is instantiated and passed throughout the application to various models and services. This creates unnecessary coupling and requires threading the instance through multiple layers of the codebase.

### Proposed Solution

Refactor `JobRegistry` to implement a **Singleton pattern with static method delegation**:

#### 1. **Static Factory & Instance Management**
- Add a static `build()` method that creates and stores a single `JobRegistry` instance
- Add a private static `instance()` method that returns the stored instance
- Add a static `reset()` method for test isolation and cleanup

#### 2. **Static Delegated Methods**
The following instance methods should be wrapped with static delegates that forward calls to the singleton instance:
- `enqueue()`
- `fail()`
- `finish()`
- `pick()`
- `promoteReadyJobs()`
- `hasReadyJob()`
- `stats()`

#### 3. **Remove Unused Methods**
Audit and remove the following methods if they are confirmed unused:
- `lock()`
- `hasLock()`

#### 4. **Initialization**
- Initialize the singleton instance in the `application` bootstrap phase via `JobRegistry.build()`
- Remove `JobRegistry` instance passing from model constructors and method signatures

### Benefits

✅ **Reduced Coupling**: No need to pass `JobRegistry` through constructor chains  
✅ **Simplified API**: Direct static access via `JobRegistry.enqueue()` instead of `registry.enqueue()`  
✅ **Cleaner Architecture**: Single source of truth for job management  
✅ **Test Isolation**: `reset()` method enables clean test setup/teardown  
✅ **Backward Compatibility**: Can be implemented incrementally, deprecating old instance methods

### Implementation Notes

- Maintain both static and instance methods during transition (optional deprecation warnings)
- Ensure thread-safe singleton initialization for async operations
- Document the initialization requirement in application setup
- Add tests for singleton behavior and method delegation