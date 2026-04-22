import { useEffect, useState } from 'react';
import { subscribeTeams } from '../services/teamsService';
import type { Team } from '../types/models';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeTeams(
      (list) => {
        setTeams(list);
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

  return { teams, loading, error };
}
