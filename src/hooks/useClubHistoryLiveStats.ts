import { useEffect, useMemo, useState } from 'react';
import { computePlayerBattingStats, computePlayerBowlingStats } from '../lib/playerStats';
import { computeTeamStandings } from '../lib/teamStandings';
import { subscribeCompletedMatches } from '../services/matchesService';
import { subscribeAllPlayers } from '../services/playersService';
import { subscribeTeams } from '../services/teamsService';
import type { Match, Player, Team } from '../types/models';

/** Single subscription bundle for History → avoids duplicate match listeners. */
export function useClubHistoryLiveStats() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tOk, setTOk] = useState(false);
  const [pOk, setPOk] = useState(false);
  const [mOk, setMOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uT = subscribeTeams(
      (list) => {
        setTeams(list);
        setTOk(true);
        setError(null);
      },
      (e) => {
        setError(e.message);
        setTOk(true);
      }
    );
    const uP = subscribeAllPlayers(
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
    const uM = subscribeCompletedMatches(
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
    return () => {
      uT();
      uP();
      uM();
    };
  }, []);

  const standings = useMemo(() => computeTeamStandings(teams, matches), [teams, matches]);
  const batting = useMemo(
    () => computePlayerBattingStats(matches, players),
    [matches, players]
  );
  const bowling = useMemo(
    () => computePlayerBowlingStats(matches, players),
    [matches, players]
  );

  const loading = !tOk || !pOk || !mOk;

  return {
    standings,
    batting,
    bowling,
    completedCount: matches.length,
    loading,
    error,
  };
}
