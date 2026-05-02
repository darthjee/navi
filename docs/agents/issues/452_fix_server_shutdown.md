# Issue: Fix Server Shutdown

## Description
The server shutdown endpoint is not properly shutting down the web server. When the shutdown endpoint is called, the web server should terminate gracefully, but it is failing to do so.

## Problem
- The server shutdown endpoint does not stop the web server when triggered
- The shutdown flow is broken, leaving the server running after a shutdown request

## Expected Behavior
- Calling the shutdown endpoint must cause the web server to stop accepting connections and terminate gracefully

## Solution
- Identify the shutdown endpoint handler and trace why the web server shutdown is not being invoked
- Ensure the handler correctly calls the web server's close/stop method
- Add or fix the logic that signals the HTTP server to stop

## Benefits
- Enables controlled, clean shutdowns of the Navi web server
- Prevents resource leaks from orphaned server processes

---
See issue for details: https://github.com/darthjee/navi/issues/452
