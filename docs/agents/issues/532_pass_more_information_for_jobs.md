# Issue: Pass More Information for Jobs

## Description

Some jobs lack information about what triggered them. While the first job enqueued is always a `ResourceRequestJob`, downstream jobs (such as `HtmlParseJob`, `ActionProcessingJob`, and `PaginatedActionProcessingJob`) do not carry information about the originating `ResourceRequestJob`.

## Problem

- Downstream jobs lose track of the original URL that triggered them
- The job detail page ("show job") does not display the originating URL in its arguments
- The API/jobs page has no way to surface this traceability information

## Expected Behavior

- The original URL from `ResourceRequestJob` is propagated to `HtmlParseJob`, `ActionProcessingJob`, and `PaginatedActionProcessingJob`
- The originating URL is exposed in the API/jobs page (e.g., as a `url` field)
- The show-job page displays the extra origin information in the arguments section

## Solution

- Pass the original URL from `ResourceRequestJob` as a parameter when constructing `HtmlParseJob`, `ActionProcessingJob`, and `PaginatedActionProcessingJob`
- Expose this URL field in the job serializer so it appears in the API and jobs listing
- Update the show-job page to render the origin URL in the arguments display

## Benefits

- Improves observability and traceability of the job pipeline
- Makes it easier to diagnose issues by knowing which resource triggered a given downstream job

---
See issue for details: https://github.com/darthjee/navi/issues/532
