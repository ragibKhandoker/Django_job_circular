import { useCallback, useEffect, useState } from 'react';

/** Runs `loader` whenever `deps` change and exposes { data, loading, error, reload }. */
export function useAsync(loader, deps, initialData = null) {
  const [state, setState] = useState({ data: initialData, loading: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));
    loader()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState((current) => ({ ...current, loading: false, error })));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
