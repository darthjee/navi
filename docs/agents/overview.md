# Application Overview

## What is Navi?

Navi is a **queue-based cache-warmer** written in Node.js, designed to run inside Docker.
It reads a YAML configuration file, discovers which HTTP resources can be requested
immediately (no parameters required), fires those requests concurrently, and chains the
responses into further parameterised requests — repeating until the entire resource graph
has been warmed.

An optional read-only **web monitoring interface** allows observing jobs and workers in
real time.

See [Runtime Flow](flow.md) for the detailed technical reference.

---

## Resource Chaining Concept

```
ResourceRequest (no params)           ← enqueued at startup
  → HTTP response
    → parse JSON → items[]
      → for each item × action:
          → map variables
            → enqueue ResourceRequestJob (with params)
              → HTTP response → ...   (recursive)
    → paginated_actions (whole response):
        → evaluate pages expression
          → for each page number:
              → enqueue ResourceRequestJob (with page param merged)
```

Actions define how response fields are mapped to parameters for the next request via
`parameters`. Each value in the `parameters` map is a path expression (e.g. `parsedBody.id`,
`headers['page']`) resolved against a response wrapper that exposes the parsed JSON body and
HTTP headers. A resource with no actions is a leaf node and ends the chain.

`paginated_actions` operate on the whole response (not per-item) and use a `pages` expression
to determine the page count, then enqueue one `ResourceRequestJob` per page with the page
number merged into the parameter set.
