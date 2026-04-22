import { useEffect, useMemo, useState } from 'react';
import { computePlayerBattingStats, computePlayerBowlingStats } from '../lib/playerStats';
import { subscribeCompletedMatches } from '../services/matchesService';
import { subscribeAllPlayers } from '../services/playersService';
import type { Match, Player } from '../types/models';

export function usePlayerBattingStats() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [mOk, setMOk] = useState(false);
  const [pOk, setPOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeCompletedMatches(
      (list) => {
        setMatches(list);
        setMOk(true);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setMOk(true);
      }
    );
    const u2 = subscribeAllPlayers(
      (list) => {
        setPlayers(list);
        setPOk(true);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setPOk(true);
      }
    );
    return () => {
      u1();
      u2();
    };
  }, []);

  const stats = useMemo(
    () => computePlayerBattingStats(matches, players),
    [matches, players]
  );
  const bowlingStats = useMemo(
    () => computePlayerBowlingStats(matches, players),
    [matches, players]
  );

  const loading = !mOk || !pOk;

  return { stats, bowlingStats, loading, error };
}
