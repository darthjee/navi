# Plan: Refactor `BaseUrlsMenu` Component

## Current State

- `BaseUrlsMenu.jsx` — component; calls `BaseUrlsClient.fetchBaseUrls()` directly and uses `menu.buildOutsideClickHandler`
- `BaseUrlsMenuHelper.jsx` — mixes HTML rendering with event handler logic (`buildOutsideClickHandler`)

## Target State

- `BaseUrlsMenu.jsx` — delegates data fetching to `BaseUrlsMenuView`
- `BaseUrlsMenuHelper.jsx` — HTML rendering only (`renderSingleUrl`, `renderDropdown`, `renderDropdownMenu`, `menuStyle`, `hasAny`, `hasSingle`)
- `BaseUrlsMenuView.jsx` — data fetching (`buildEffect`) and event handling (`buildOutsideClickHandler`)

## Implementation Steps

### Step 1 — Create `BaseUrlsMenuView.jsx`

Create a new class that encapsulates:
- `buildEffect(setBaseUrls)` — wraps the `BaseUrlsClient.fetchBaseUrls()` call
- `buildOutsideClickHandler(containerRef, setOpen)` — extracted from `BaseUrlsMenuHelper`

### Step 2 — Update `BaseUrlsMenuHelper.jsx`

Remove `buildOutsideClickHandler`. Keep only pure rendering and query methods.

### Step 3 — Update `BaseUrlsMenu.jsx`

- Remove the direct `BaseUrlsClient` import.
- Use `BaseUrlsMenuView.buildEffect(setBaseUrls)` inside `useEffect`.
- Use `BaseUrlsMenuView.buildOutsideClickHandler(...)` instead of `menu.buildOutsideClickHandler(...)`.

## Files to Change

- `frontend/src/components/BaseUrlsMenuHelper.jsx` — remove `buildOutsideClickHandler`
- `frontend/src/components/BaseUrlsMenu.jsx` — use `BaseUrlsMenuView` for fetch and click handler
- `frontend/src/components/BaseUrlsMenuView.jsx` — **new file**
