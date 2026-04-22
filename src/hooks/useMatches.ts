import { useEffect, useState } from 'react';
import { subscribeMatchesForSeries } from '../services/matchesService';
import type { Match } from '../types/models';

export function useMatches(seriesId: string | undefined) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seriesId) {
      setMatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeMatchesForSeries(
      seriesId,
      (list) => {
        setMatches(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [seriesId]);

  return { matches, loading, error };
}
