import { useCallback, useEffect, useRef, useState } from 'react';

/** Refreshable remote data; remains visible during background refresh. */
export function useApiData(loader, deps = [], delay = 0) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const pending = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const refresh = useCallback(async (opts) => {
    const call = ++pending.current;
    if (!alive.current) return null;
    if (data === null) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const result = await loaderRef.current(opts);
      if (alive.current && call === pending.current) setData(result);
      return result;
    } catch (e) {
      if (alive.current && call === pending.current) setError(e.message || 'Unable to load data.');
      return null;
    } finally {
      if (alive.current && call === pending.current) { setLoading(false); setRefreshing(false); }
    }
  }, [data]);
  useEffect(() => {
    alive.current = true;
    const timer = setTimeout(() => refresh(), delay);
    return () => { clearTimeout(timer); pending.current++; alive.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, setData, loading, refreshing, error, setError, refresh };
}
