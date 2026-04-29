# Issue: Add a Button to Shut Down the Server

## Description
The web server currently runs indefinitely with no way to stop it from the UI. A shutdown button is needed that calls the API to terminate the web server process, which will also stop the engine.

## Problem
- The web server has no shutdown mechanism exposed through the UI
- Users cannot stop the server without killing the process externally

## Expected Behavior
- A "Shut Down" button is available in the web UI
- Clicking it sends a request to the API that ends the web server promise
- Shutting down the web server also stops the engine

## Solution
- Add a new API endpoint (e.g., `PATCH /engine/shutdown` or similar) that resolves the web server promise and stops the engine
- Add a "Shut Down" button to the frontend that calls this endpoint

## Benefits
- Provides a clean, user-initiated shutdown path for the server
- Avoids having to kill the process manually

---
See issue for details: https://github.com/darthjee/navi/issues/422
