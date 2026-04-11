# Issue #220 — ResourceRequestAction enqueue ResourceRequest jobs

## Summary

`ResourceRequestAction.execute()` currently only logs a message when an action is triggered.
The intended behaviour is to enqueue a new `ResourceRequestJob` for the resource named by the action,
using the mapped variables as job parameters.

## Current Behaviour

When a `ResourceRequest` completes successfully and has actions configured, the system:

1. Parses the response body
2. Normalises it to an array
3. For each `(item × action)` pair, creates an `ActionProcessingJob`
4. Each `ActionProcessingJob.perform()` calls `action.execute(item)`, which **only logs**

There is an explicit TODO comment in the source:

> "In the future, instead of logging, this method should create a new Job referencing the resource
> named by this.resource, passing vars as the job parameters. The job will be enqueued for async
> processing."

## Expected Behaviour

`ResourceRequestAction.execute(item, jobRegistry, resourceRegistry)` should:

1. Map the response item to variables via `VariablesMapper`
2. Look up the target resource in `resourceRegistry`
3. For each `ResourceRequest` in that resource, enqueue a `ResourceRequestJob` with the mapped variables as parameters

## Example

Given this YAML config:

```yaml
resources:
  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: products
          variables_map:
            id: category_id
  products:
    - url: /products.json
      status: 200
```

And a response `[{ "id": 1 }, { "id": 2 }]`, the system should enqueue:
- `ResourceRequestJob` for `products` with `parameters: { category_id: 1 }`
- `ResourceRequestJob` for `products` with `parameters: { category_id: 2 }`
