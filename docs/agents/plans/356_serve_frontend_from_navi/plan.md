# Plan: Serve Frontend from Navi

## Overview

Bundle the built React frontend with the Navi package so it can be served directly by the Navi webserver in production. This involves creating a `source/static/` folder, wiring it to the Vite build output via Docker Compose, adding secure static-file handlers to the webserver, and documenting the build workflow.

## Context

In development the frontend is served by the Vite dev server. For a production release, the built assets must live inside the Navi package and be served by Navi's own Express webserver. The webserver already serves a React SPA but currently reads files from `source/public/` — this plan extends that with a proper static-asset serving layer backed by `source/static/`.

## Parts

- [Part 1 — Static folder and Docker Compose wiring](plan_static_folder.md)
- [Part 2 — Webserver route handlers](plan_handlers.md)
- [Part 3 — Specs](plan_specs.md)
- [Part 4 — Documentation](plan_docs.md)
