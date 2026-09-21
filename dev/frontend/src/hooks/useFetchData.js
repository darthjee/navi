import { useEffect, useState } from 'react';

/**
 * Generic data-fetching hook that tracks loading, error and result state.
 *
 * The fetcher is invoked on mount and again whenever any value in `deps`
 * changes. The loading flag is set to `true` at the start of every fetch.
 *
 * @param {function(): Promise<*>} fetcher - Function returning a promise with the data.
 * @param {Array<*>} deps - Dependencies that trigger a new fetch when changed.
 * @returns {{data: *, error: (string|null), loading: boolean}}
 */
function useFetchData(fetcher, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetcher()
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // The fetcher is intentionally excluded: callers control refetching via `deps`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

export default useFetchData;
