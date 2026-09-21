# Add LoadingSpinner and ErrorAlert components
Create two small presentational components next to `components/Pagination.jsx`, reproducing the current markup exactly so page output is unchanged:

- `LoadingSpinner` renders `<div className="container mt-5 text-center"><div className="spinner-border" role="status" /></div>`
- `ErrorAlert({ message })` renders `<div className="container mt-5"><div className="alert alert-danger">{message}</div></div>`

Follow the existing style in `Pagination.jsx` (function component, default export). Add component specs mirroring `spec/components/Pagination_spec.js` (createRoot + `act`): spinner renders `.spinner-border` with `role="status"`; alert renders `.alert-danger` containing the message.

## Files to Change
- `dev/frontend/src/components/LoadingSpinner.jsx` — new component
- `dev/frontend/src/components/ErrorAlert.jsx` — new component
- `dev/frontend/spec/components/LoadingSpinner_spec.js` — new spec
- `dev/frontend/spec/components/ErrorAlert_spec.js` — new spec
