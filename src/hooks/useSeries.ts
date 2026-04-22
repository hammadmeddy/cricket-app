import { useEffect, useState } from 'react';
import { subscribeSeries } from '../services/seriesService';
import type { Series } from '../types/models';

export function useSeries() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSeries(
      (list) => {
        setSeries(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { series, loading, error };
}
