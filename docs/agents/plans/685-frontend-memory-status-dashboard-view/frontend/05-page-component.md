# MemoryStatus page component

Add the page component itself, wiring `MemoryStatusController` + `MemoryStatusHelper` together exactly the way `StatsHeader.jsx` wires `StatsHeaderController` + `StatsHeaderHelper`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import MemoryStatusController from './controllers/MemoryStatusController.jsx';
import MemoryStatusHelper from './helpers/MemoryStatusHelper.jsx';
import './MemoryStatus.css';

function MemoryStatus() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const view = useMemo(
    () => MemoryStatusController.build(setStatus, setError, setLoading),
    []
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(view.buildEffect(), []);

  if (loading) return MemoryStatusHelper.renderLoading();
  if (error) return MemoryStatusHelper.renderError(error);

  return MemoryStatusHelper.render(status);
}

export default MemoryStatus;
```

Note this lives under `frontend/src/components/pages/` (a page, like `Jobs.jsx`/`LogsPage.jsx`), not `frontend/src/components/elements/` (a reusable element, like `StatsHeader.jsx`) — it is rendered directly by a route (step 06), not embedded inside another page.

## Files to Change

- `frontend/src/components/pages/MemoryStatus.jsx` — new page component, as above.
- `frontend/spec/components/MemoryStatus_spec.js` — new integration spec mirroring `StatsHeader_spec.js`'s shape (`MemoryRouter`, `act`, `flushAsync`, `spec/support/fetch.js`'s `mockFetchSuccess`/`mockFetchFailure`): covers the loading state, a successful render for each of the 5 status/color conditions from step 02, and a fetch-failure state rendering `ErrorAlert`.
