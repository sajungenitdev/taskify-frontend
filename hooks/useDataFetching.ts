import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseDataFetchingOptions {
  fetchOnMount?: boolean;
  dependencies?: any[];
  enableCache?: boolean;
}

export function useDataFetching<T>(
  fetchFn: () => Promise<T>,
  options: UseDataFetchingOptions = {},
) {
  const {
    fetchOnMount = true,
    dependencies = [],
    enableCache = false,
  } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
      if (enableCache) {
        sessionStorage.setItem(
          `cache_${window.location.pathname}`,
          JSON.stringify(result),
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, router, enableCache]);

  useEffect(() => {
    // Check cache first
    if (enableCache) {
      const cached = sessionStorage.getItem(
        `cache_${window.location.pathname}`,
      );
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    }

    if (fetchOnMount) {
      fetchData();
    }
  }, [fetchOnMount, ...dependencies]);

  return { data, loading, error, refetch: fetchData };
}
