# Add `MenuClient`

A pure-fetch client for `/menu.json`, mirroring
`frontend/src/clients/LinksClient.js`.

```js
class MenuClient {
  static fetchEntries() {
    return fetch('/menu.json')
      .then(MenuClient.#handleResponse)   // throw new Error(`HTTP ${res.status}`) when !res.ok
      .then((data) => data.entries ?? []);
  }
}
export default MenuClient;
```

Same error posture as `LinksClient` (reject on non-ok response; the controller
`.catch`es it into an empty menu).

## Files to Change

- `frontend/src/clients/MenuClient.js` — new.
- `frontend/spec/clients/MenuClient_spec.js` — new; mirror
  `LinksClient_spec.js`: success with `entries`, success without `entries` key
  (⇒ `[]`), fetches from `/menu.json`, rejects with `HTTP 500` on failure.
