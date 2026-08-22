# Controller and helper

Add the Controller and Helper halves of the page, mirroring `StatsHeaderController.jsx` / `StatsHeaderHelper.jsx` exactly — the fetch/polling logic and the render logic live outside the component, the component just wires state to them (see step 05).

## `MemoryStatusController`

Same shape as `StatsHeaderController`: constructor takes the state setters, `static build(...)` factory, `buildEffect()` returns the effect function that does an initial `#load()` plus a `setInterval(() => this.#load(), 5000)` (cleared on unmount) — this *is* the "5-second auto-refresh while the view is active" requirement from the issue; no separate polling mechanism is needed.

```js
import fetchMemoryStatus from '../../../clients/MemoryStatusClient.js';

class MemoryStatusController {
  #setStatus;
  #setError;
  #setLoading;

  constructor(setStatus, setError, setLoading) {
    this.#setStatus = setStatus;
    this.#setError = setError;
    this.#setLoading = setLoading;
  }

  static build(setStatus, setError, setLoading) {
    return new MemoryStatusController(setStatus, setError, setLoading);
  }

  buildEffect() {
    return () => {
      this.#load();
      const interval = setInterval(() => this.#load(), 5000);
      return () => clearInterval(interval);
    };
  }

  #load() {
    fetchMemoryStatus()
      .then((data) => {
        this.#setStatus(data);
        this.#setError(null);
      })
      .catch((err) => this.#setError(err.message))
      .finally(() => this.#setLoading(false));
  }
}

export default MemoryStatusController;
```

## `MemoryStatusHelper`

Same shape as `StatsHeaderHelper`: `renderLoading()` / `renderError(error)` static methods reusing the existing shared `LoadingSpinner`/`ErrorAlert` elements, and `render(data)` producing the actual status display — formatted `current`/`maximum` (via `formatBytes` from step 01) and the color-coded indicator (via `colorForMemoryStatus` from step 02).

```js
import ErrorAlert from '../../elements/ErrorAlert.jsx';
import LoadingSpinner from '../../elements/LoadingSpinner.jsx';
import formatBytes from '../../../utils/formatBytes.js';
import { colorForMemoryStatus } from '../../../constants/memoryStatus.js';

class MemoryStatusHelper {
  static renderLoading() {
    return <LoadingSpinner message="Loading memory status…" />;
  }

  static renderError(error) {
    return <ErrorAlert error={error} prefix="Failed to load memory status" />;
  }

  static render({ current, maximum, percentage, status }) {
    const color = colorForMemoryStatus(status, percentage);
    // Render current/maximum via formatBytes(...) and the color-coded
    // indicator using `color` — exact markup is an implementation detail,
    // no existing "gauge" component to match in this codebase.
  }
}

export default MemoryStatusHelper;
```

The exact markup inside `render()` (badge vs. bar/gauge) is not prescribed by the issue beyond "a visual status indicator colored per the mapping" — keep it simple (e.g. a colored badge/card showing `current / maximum` and the status label), consistent with the plain-Bootstrap-classes styling used elsewhere, plus the custom color classes from `MemoryStatus.css` (step 02).

## Files to Change

- `frontend/src/components/pages/controllers/MemoryStatusController.jsx` — fetch + 5s polling, as above.
- `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx` — loading/error/success rendering, as above.
- `frontend/spec/components/MemoryStatusHelper_spec.js` — new unit spec for the helper's three render paths, mirroring `LogsPageHelper_spec.js`'s pattern of testing the helper independently of the page component.
