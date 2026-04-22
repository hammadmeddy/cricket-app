import { useEffect, useState } from 'react';
import { subscribePlayersByTeam } from '../services/playersService';
import type { Player } from '../types/models';

export function usePlayers(teamId: string | undefined) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribePlayersByTeam(
      teamId,
      (list) => {
        setPlayers(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [teamId]);

  return { players, loading, error };
}
